-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — Admin Dashboard Policies
-- Run this in Supabase SQL Editor AFTER the initial schema
-- ═══════════════════════════════════════════════════════════════

-- Drop old read policy (only showed approved)
drop policy if exists "Anyone can read approved movies" on public.movies;

-- New read policy: allow reading ALL movies (admin needs to see pending/rejected)
create policy "Read all movies"
  on public.movies for select
  using (true);

-- Allow updating movies (for status changes, edits)
create policy "Allow updates"
  on public.movies for update
  using (true)
  with check (true);

-- Allow deleting movies
create policy "Allow deletes"
  on public.movies for delete
  using (true);

-- ═══════════════════════════════════════════════════════════════
-- DONE! Admin dashboard now has full CRUD access.
-- Note: In production, these policies should be restricted to
-- authenticated admin users. For local dev, this is fine.
-- ═══════════════════════════════════════════════════════════════
