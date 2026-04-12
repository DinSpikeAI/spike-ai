-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — Complete Database Schema (April 12, 2026)
-- ═══════════════════════════════════════════════════════════════
--
-- This is the SINGLE SOURCE OF TRUTH for the live Supabase DB.
-- All previous .sql files (schema.sql, admin-rls-secure.sql,
-- auth-profiles.sql, setup-tables.sql, etc.) are superseded.
--
-- To rebuild from scratch:
--   1. Create a new Supabase project
--   2. Run this entire file in SQL Editor
--   3. Create a storage bucket named 'media' (public: ON)
--   4. Run the storage policies section at the bottom
--   5. Enable Google OAuth in Auth → Providers
--
-- ═══════════════════════════════════════════════════════════════


-- ┌─────────────────────────────────────────────────────────────┐
-- │  1. PROFILES                                                │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text,
  avatar_url      text,
  email           text,
  role            text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  user_type       text DEFAULT 'viewer' CHECK (user_type IN ('viewer', 'creator')),
  bio             text,
  website         text,
  social_x        text,
  social_youtube  text,
  social_instagram text,
  banner_url      text,
  creator_slug    text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (public creator pages)
CREATE POLICY "Public profiles are viewable"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile (but NOT role or user_type)
CREATE POLICY "Users can update own profile safely"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND user_type IS NOT DISTINCT FROM (SELECT user_type FROM public.profiles WHERE id = auth.uid())
  );

-- Admins can update any profile (including role and user_type)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'avatar_url', null)
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ┌─────────────────────────────────────────────────────────────┐
-- │  2. MOVIES                                                  │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.movies (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title           text NOT NULL,
  description     text,
  tagline         text,
  video_url       text,
  trailer_url     text,
  poster_url      text,
  hero_image      text,
  category        text NOT NULL DEFAULT 'Trending',
  genre           text,
  duration        text,
  year            integer DEFAULT extract(year FROM now())::integer,
  rating          numeric(3,1) DEFAULT 0.0,
  maturity        text DEFAULT '16+',
  ai_models       text[] DEFAULT '{}',
  creator_name    text,
  creator_id      uuid REFERENCES public.profiles(id),
  upvotes_count   integer DEFAULT 0,
  sort_order      integer DEFAULT 0,
  series_name     text,
  episode_number  integer,
  status          text DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movies_category ON public.movies (category);
CREATE INDEX IF NOT EXISTS idx_movies_status ON public.movies (status);
CREATE INDEX IF NOT EXISTS idx_movies_creator ON public.movies (creator_name);
CREATE INDEX IF NOT EXISTS idx_movies_series ON public.movies (series_name);

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- SELECT: public sees approved; admins see everything
CREATE POLICY "View approved movies"
  ON public.movies FOR SELECT
  USING (
    status = 'approved'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- INSERT: creators can submit (pending only); admins can insert any status
CREATE POLICY "Creators submit films"
  ON public.movies FOR INSERT
  WITH CHECK (
    -- Admin: any status
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    OR (
      -- Creator: pending only
      status = 'pending'
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.user_type = 'creator' OR profiles.role = 'admin')
      )
    )
  );

-- UPDATE: creators can edit own films; admins can edit all
CREATE POLICY "Creators can update own films"
  ON public.movies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_type = 'creator'
        AND profiles.display_name = movies.creator_name
      )
    )
  );

-- DELETE: admins only
CREATE POLICY "Admin delete movies"
  ON public.movies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Auto updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$;

DROP TRIGGER IF EXISTS movies_updated_at ON public.movies;
CREATE TRIGGER movies_updated_at
  BEFORE UPDATE ON public.movies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ┌─────────────────────────────────────────────────────────────┐
-- │  3. UPVOTES (per-user tracking)                             │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.user_votes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE public.user_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view votes"
  ON public.user_votes FOR SELECT USING (true);

CREATE POLICY "Users can vote"
  ON public.user_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unvote"
  ON public.user_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Atomic upvote (increments count on movies table)
CREATE OR REPLACE FUNCTION public.upvote_movie(movie_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_count integer;
BEGIN
  UPDATE public.movies
  SET upvotes_count = upvotes_count + 1, updated_at = now()
  WHERE id = movie_id AND status = 'approved';

  SELECT upvotes_count INTO new_count
  FROM public.movies WHERE id = movie_id;

  RETURN COALESCE(new_count, 0);
END;
$$;


-- ┌─────────────────────────────────────────────────────────────┐
-- │  4. WATCHLIST                                               │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.watchlist (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id   uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist"
  ON public.watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to watchlist"
  ON public.watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from watchlist"
  ON public.watchlist FOR DELETE
  USING (auth.uid() = user_id);


-- ┌─────────────────────────────────────────────────────────────┐
-- │  5. NOTIFICATIONS (admin → users)                           │
-- └─────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text NOT NULL,
  body       text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Everyone can read notifications
CREATE POLICY "Public can view notifications"
  ON public.notifications FOR SELECT
  USING (true);

-- Only admins can manage notifications
CREATE POLICY "Admin insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin delete notifications"
  ON public.notifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- ┌─────────────────────────────────────────────────────────────┐
-- │  6. STORAGE POLICIES                                        │
-- │  Prerequisites: create bucket 'media' (public: ON)          │
-- └─────────────────────────────────────────────────────────────┘

-- SELECT: anyone can view (public bucket)
CREATE POLICY "Public can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- INSERT: authenticated users can upload
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );

-- UPDATE: admins + users can update own banners
CREATE POLICY "Users update own banners"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND (
      -- Own banner
      (auth.role() = 'authenticated' AND name LIKE 'banners/' || auth.uid()::text || '%')
      -- Or admin
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    )
  );

-- DELETE: admins only
CREATE POLICY "Admin can delete media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );


-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION CHECKLIST
-- ═══════════════════════════════════════════════════════════════
--
-- Tables:     profiles, movies, user_votes, watchlist, notifications
-- Functions:  handle_new_user, handle_updated_at, upvote_movie
-- Triggers:   on_auth_user_created, movies_updated_at
-- Indexes:    idx_movies_category, idx_movies_status,
--             idx_movies_creator, idx_movies_series
-- Storage:    bucket 'media' with 4 policies
--
-- RLS Summary:
--   profiles  → public read, own update (safe), admin update all
--   movies    → approved read (+admin all), creator insert pending,
--               creator update own, admin full CRUD
--   votes     → public read, auth insert/delete own
--   watchlist → auth read/insert/delete own
--   notifs    → public read, admin insert/delete
--   storage   → public read, auth upload, own banner update, admin delete
--
-- ═══════════════════════════════════════════════════════════════
