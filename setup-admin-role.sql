-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — Admin Role Security Upgrade
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Add 'role' column to profiles (if it doesn't already exist)
-- Default is 'user', only you get 'admin'
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- Step 2: Set YOUR account as admin
-- Replace the email below with your actual Supabase auth email
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'YOUR_EMAIL_HERE'
);

-- Step 3: Verify it worked — should show your profile with role = 'admin'
SELECT p.id, p.display_name, p.email, p.role, u.email as auth_email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';

-- ═══════════════════════════════════════════════════════════════
-- SECURITY: Prevent users from changing their own role
-- ═══════════════════════════════════════════════════════════════

-- Drop existing update policy if it exists, then create a safe one
-- This policy lets users update their own profile EXCEPT the role field
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile safely"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- ═══════════════════════════════════════════════════════════════
-- DONE! After running this:
-- 1. Sign in to Spike AI with your email
-- 2. Go to /admin/dashboard (no ?admin= needed anymore!)
-- 3. Go to /submit — admin mode activates automatically
-- ═══════════════════════════════════════════════════════════════
