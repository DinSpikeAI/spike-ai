-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — COMPLETE DATABASE SETUP
-- Safe to run multiple times (uses IF NOT EXISTS everywhere)
-- ═══════════════════════════════════════════════════════════════

-- 1. USER VOTES TABLE
CREATE TABLE IF NOT EXISTS public.user_votes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);
CREATE INDEX IF NOT EXISTS idx_user_votes_user ON public.user_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_votes_movie ON public.user_votes(movie_id);
ALTER TABLE public.user_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view votes" ON public.user_votes;
CREATE POLICY "Public can view votes" ON public.user_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can vote" ON public.user_votes;
CREATE POLICY "Users can vote" ON public.user_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unvote" ON public.user_votes;
CREATE POLICY "Users can unvote" ON public.user_votes FOR DELETE USING (auth.uid() = user_id);

-- 2. WATCHLIST TABLE
CREATE TABLE IF NOT EXISTS public.watchlist (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);
CREATE INDEX IF NOT EXISTS idx_watchlist_user ON public.watchlist(user_id);
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own watchlist" ON public.watchlist;
CREATE POLICY "Users can view own watchlist" ON public.watchlist FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add to watchlist" ON public.watchlist;
CREATE POLICY "Users can add to watchlist" ON public.watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove from watchlist" ON public.watchlist;
CREATE POLICY "Users can remove from watchlist" ON public.watchlist FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- DONE! Both tables ready. No RPC functions needed.
-- ═══════════════════════════════════════════════════════════════
