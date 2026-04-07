# SPIKE AI - Project Documentation

## Tech Stack
- Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- Supabase (DB + Auth + Storage)
- Vercel: https://spike-ai-seven.vercel.app
- Repo: https://github.com/DinSpikeAI/spike-ai

## Local Path
C:\Users\Din\Desktop\spike\ai-flix

## File Structure
- src/app/auth/page.tsx - Login/Signup/Magic Link/Profile Setup
- src/app/submit/page.tsx - Submit Your Film
- src/app/admin/ - Admin dashboard
- src/app/movie/ - Movie detail
- src/app/my-list/ - Watchlist
- src/app/profile/ - User profile
- src/app/settings/ - Settings
- public/spike-icon-512.png - Logo

## Supabase
- Project Ref: mddllmhvryprkpzhfrkv
- Main table: movies (title, description, video_url, poster_url, genre, category, ai_models[], status, upvotes_count)
- Other tables: profiles, watchlist
- RLS + upvote_movie function

## Google OAuth
- Google Cloud Project: Spike AI
- Client ID: 687623895283-4g7eve9usmamm4fs2scl3bstph34sc07.apps.googleusercontent.com
- Callback: https://mddllmhvryprkpzhfrkv.supabase.co/auth/v1/callback
- Console: https://console.cloud.google.com/apis/credentials
