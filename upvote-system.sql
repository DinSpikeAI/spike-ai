-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — Per-User Upvote System
-- Prevents spam: one vote per user per movie
-- ═══════════════════════════════════════════════════════════════

-- Votes table
CREATE TABLE IF NOT EXISTS public.user_votes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)  -- one vote per user per movie
);

CREATE INDEX IF NOT EXISTS idx_user_votes_user ON public.user_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_movie ON public.user_votes(movie_id);

ALTER TABLE public.user_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can see votes (for counts)
CREATE POLICY "Public can view votes"
  ON public.user_votes FOR SELECT USING (true);

-- Logged-in users can insert their own vote
CREATE POLICY "Users can vote"
  ON public.user_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own vote (un-vote)
CREATE POLICY "Users can unvote"
  ON public.user_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Replace old upvote function with secure version
CREATE OR REPLACE FUNCTION public.upvote_movie(p_movie_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_already boolean;
  v_new_count integer;
BEGIN
  -- Must be logged in
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Must be logged in to vote');
  END IF;

  -- Check if already voted
  SELECT EXISTS(
    SELECT 1 FROM public.user_votes
    WHERE user_id = v_user_id AND movie_id = p_movie_id
  ) INTO v_already;

  IF v_already THEN
    -- UNVOTE: remove vote + decrement
    DELETE FROM public.user_votes WHERE user_id = v_user_id AND movie_id = p_movie_id;
    UPDATE public.movies SET upvotes_count = GREATEST(upvotes_count - 1, 0) WHERE id = p_movie_id;
  ELSE
    -- VOTE: insert vote + increment
    INSERT INTO public.user_votes (user_id, movie_id) VALUES (v_user_id, p_movie_id);
    UPDATE public.movies SET upvotes_count = upvotes_count + 1 WHERE id = p_movie_id;
  END IF;

  SELECT upvotes_count INTO v_new_count FROM public.movies WHERE id = p_movie_id;

  RETURN jsonb_build_object(
    'count', COALESCE(v_new_count, 0),
    'voted', NOT v_already
  );
END;
$$;

-- Helper: get all movie IDs a user has voted for
CREATE OR REPLACE FUNCTION public.get_user_votes()
RETURNS uuid[] LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN ARRAY(
    SELECT movie_id FROM public.user_votes WHERE user_id = auth.uid()
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- DONE! upvote_movie now toggles (vote/unvote) and is spam-proof.
-- ═══════════════════════════════════════════════════════════════
