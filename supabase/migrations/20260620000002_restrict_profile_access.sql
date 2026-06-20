-- Migration: Restrict Profile Access
-- Date: 2026-06-20
-- Purpose: Change profiles RLS policy from public to authenticated-only for privacy

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;

-- Create restricted policy - users can only read their own profile
CREATE POLICY "Users can read own profile" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Note: Service role key can still read all profiles for admin operations
-- This is implicit with service role and doesn't require a policy
