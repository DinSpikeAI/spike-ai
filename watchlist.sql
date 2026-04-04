-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — Watchlist / My List
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.watchlist (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON public.watchlist(user_id);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Users can see their own list
CREATE POLICY "Users can view own watchlist"
  ON public.watchlist FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to their list
CREATE POLICY "Users can add to watchlist"
  ON public.watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their list
CREATE POLICY "Users can remove from watchlist"
  ON public.watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Helper: get user's watchlist movie IDs
CREATE OR REPLACE FUNCTION public.get_watchlist()
RETURNS uuid[] LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN ARRAY(SELECT movie_id FROM public.watchlist WHERE user_id = auth.uid());
END;
$$;
