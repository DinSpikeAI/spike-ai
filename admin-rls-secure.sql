-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — Admin-Only RLS Policies
-- Only admins can INSERT, UPDATE, DELETE movies
-- Everyone can view approved movies
-- ═══════════════════════════════════════════════════════════════

-- Drop old permissive policies
DROP POLICY IF EXISTS "Read all movies" ON public.movies;
DROP POLICY IF EXISTS "Anyone can submit films" ON public.movies;
DROP POLICY IF EXISTS "Allow updates" ON public.movies;
DROP POLICY IF EXISTS "Allow deletes" ON public.movies;
DROP POLICY IF EXISTS "Anyone can read approved movies" ON public.movies;

-- SELECT: Everyone can view approved movies (public site)
-- Admins can view ALL movies (including pending/rejected)
CREATE POLICY "View movies"
  ON public.movies FOR SELECT
  USING (
    status = 'approved'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- INSERT: Only admins can add movies
CREATE POLICY "Admin insert"
  ON public.movies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- UPDATE: Only admins can edit movies
CREATE POLICY "Admin update"
  ON public.movies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- DELETE: Only admins can delete movies
CREATE POLICY "Admin delete"
  ON public.movies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- DONE! Regular users: can only SEE approved films.
-- Admin: full CRUD + sees pending/rejected in dashboard.
-- ═══════════════════════════════════════════════════════════════
