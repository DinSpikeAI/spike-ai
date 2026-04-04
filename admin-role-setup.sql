-- ═══════════════════════════════════════════════════════════════
-- SPIKE AI — Admin Role Setup
-- REPLACE 'YOUR_EMAIL_HERE' with your actual email before running!
-- ═══════════════════════════════════════════════════════════════

-- 1. Add role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- 2. Set YOUR account as admin (change the email!)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'YOUR_EMAIL_HERE';

-- 3. Prevent users from changing their own role
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
  );

-- ═══════════════════════════════════════════════════════════════
-- VERIFY: Run this query to check it worked:
-- SELECT email, role FROM public.profiles;
-- Your email should show 'admin'
-- ═══════════════════════════════════════════════════════════════
