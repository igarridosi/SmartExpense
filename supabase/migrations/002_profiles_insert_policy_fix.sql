-- ============================================================
-- SmartExpense: Fix profiles INSERT RLS policy + backfill
-- Run ONCE in Supabase SQL Editor if users get RLS insert errors
-- ============================================================

-- 1) Allow authenticated users to create their own profile row
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2) Backfill missing profile rows for existing auth users
INSERT INTO public.profiles (id, display_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'display_name', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
