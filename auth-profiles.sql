-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — User Profiles Table
-- Run in Supabase SQL Editor after enabling Auth
-- ═══════════════════════════════════════════════════════════════

-- Profiles table (linked to Supabase Auth)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url  text,
  email       text,
  role        text default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz default now()
);

alter table public.profiles enable row level security;

-- Users can read all profiles
create policy "Public profiles are viewable"
  on public.profiles for select using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════
-- DONE! New users will auto-get a profile row on sign-up.
-- ═══════════════════════════════════════════════════════════════
