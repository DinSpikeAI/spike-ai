-- ═══════════════════════════════════════════════════════════════
-- Spike AI — toggle_upvote RPC
-- ═══════════════════════════════════════════════════════════════
-- Run this ONCE in Supabase SQL Editor.
--
-- Why: the client used to update movies.upvotes_count directly,
-- but RLS blocks non-admins from doing that. So upvotes appeared
-- to work (optimistic UI) but the counter never actually changed.
--
-- This RPC runs with SECURITY DEFINER, so it has permission to
-- update the counter regardless of who calls it. It also handles
-- the toggle logic atomically.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.toggle_upvote(p_movie_id uuid)
RETURNS TABLE (voted boolean, count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_existing uuid;
  v_count integer;
BEGIN
  -- Must be logged in
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be logged in to vote';
  END IF;

  -- Movie must exist and be approved
  IF NOT EXISTS (
    SELECT 1 FROM public.movies
    WHERE id = p_movie_id AND status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Movie not found or not approved';
  END IF;

  -- Check existing vote
  SELECT id INTO v_existing
  FROM public.user_votes
  WHERE user_id = v_user_id AND movie_id = p_movie_id;

  IF v_existing IS NOT NULL THEN
    DELETE FROM public.user_votes WHERE id = v_existing;
  ELSE
    INSERT INTO public.user_votes (user_id, movie_id)
    VALUES (v_user_id, p_movie_id);
  END IF;

  -- Recount and update the cached counter
  SELECT COUNT(*) INTO v_count
  FROM public.user_votes
  WHERE movie_id = p_movie_id;

  UPDATE public.movies
  SET upvotes_count = v_count, updated_at = now()
  WHERE id = p_movie_id;

  RETURN QUERY SELECT (v_existing IS NULL), v_count;
END;
$$;

-- Lock it down: only authenticated users can call this
REVOKE ALL ON FUNCTION public.toggle_upvote(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_upvote(uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- Done.
--
-- Verify with (replace with a real movie id from your DB):
--   SELECT * FROM public.toggle_upvote('some-movie-uuid-here');
-- Should return a row like (voted=true, count=1).
-- ═══════════════════════════════════════════════════════════════
