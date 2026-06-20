-- Verification Script: Check Database State After Migrations
-- Run this in Supabase SQL Editor to verify everything is correct

-- 1. Check quotations table has created_by column (should show created_by, NOT user_id)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'quotations'
AND column_name IN ('user_id', 'created_by')
ORDER BY column_name;
-- Expected: Only 'created_by' should appear

-- 2. Check quotations RLS policies (should reference created_by)
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'quotations' 
AND schemaname = 'public';
-- Expected: All policies should reference created_by, not user_id

-- 3. Check products RLS policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'products' 
AND schemaname = 'public'
ORDER BY policyname;
-- Expected: Should see policies for SELECT, INSERT, UPDATE, DELETE

-- 4. Check profiles RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public';
-- Expected: Should see "Users can read own profile" policy

-- 5. Check quotation_items RLS policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'quotation_items' 
AND schemaname = 'public'
ORDER BY policyname;
-- Expected: Should see policies for SELECT, INSERT, UPDATE

-- 6. Verify current user authentication
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;
-- Expected: Should show your user ID and 'authenticated' role
