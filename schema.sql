-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — Database Schema with Admin Bypass
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════

-- Drop old policies if they exist (safe to run multiple times)
drop policy if exists "Anyone can read approved movies" on public.movies;
drop policy if exists "Anyone can submit films" on public.movies;
drop policy if exists "read approved" on public.movies;
drop policy if exists "submit films" on public.movies;

-- Create table (skips if already exists)
create table if not exists public.movies (
  id            uuid default gen_random_uuid() primary key,
  title         text not null,
  description   text,
  tagline       text,
  video_url     text,
  trailer_url   text,
  poster_url    text,
  hero_image    text,
  category      text not null default 'Trending',
  genre         text,
  duration      text,
  year          integer default extract(year from now())::integer,
  rating        numeric(3,1) default 0.0,
  maturity      text default '16+',
  ai_models     text[] default '{}',
  creator_name  text,
  upvotes_count integer default 0,
  status        text default 'pending'
                  check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Indexes
create index if not exists idx_movies_category on public.movies (category);
create index if not exists idx_movies_status on public.movies (status);

-- Enable RLS
alter table public.movies enable row level security;

-- READ: Anyone can see approved movies
create policy "Anyone can read approved movies"
  on public.movies for select
  using (status = 'approved');

-- INSERT: Allow both 'pending' (public) and 'approved' (admin bypass)
create policy "Anyone can submit films"
  on public.movies for insert
  with check (status in ('pending', 'approved'));

-- Upvote function (atomic increment)
create or replace function public.upvote_movie(movie_id uuid)
returns integer language plpgsql security definer as $$
declare new_count integer;
begin
  update public.movies
    set upvotes_count = upvotes_count + 1, updated_at = now()
    where id = movie_id and status = 'approved';
  select upvotes_count into new_count
    from public.movies where id = movie_id;
  return coalesce(new_count, 0);
end;
$$;

-- Auto updated_at trigger
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists movies_updated_at on public.movies;
create trigger movies_updated_at
  before update on public.movies
  for each row execute function public.handle_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- DONE! Verify:
-- 1. Table Editor → movies table exists
-- 2. Auth → Policies → 2 policies on movies
-- 3. Database → Functions → upvote_movie exists
-- ═══════════════════════════════════════════════════════════════
