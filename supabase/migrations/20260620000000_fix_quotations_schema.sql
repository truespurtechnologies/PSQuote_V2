-- Migration: Fix quotations table schema
-- Issue: Column name mismatch - table uses 'user_id' but RLS policies reference 'created_by'
-- Solution: Rename user_id to created_by for consistency across all tables
-- Date: 2026-06-20

-- Rename user_id column to created_by
ALTER TABLE public.quotations 
RENAME COLUMN user_id TO created_by;

-- Update the index to use the new column name
DROP INDEX IF EXISTS idx_quotations_user_id;
CREATE INDEX idx_quotations_created_by ON public.quotations(created_by);

-- Verify RLS policies are using the correct column name
-- These policies should already exist and reference created_by, but we'll recreate them to be safe

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can insert their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can update their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can delete their own quotations" ON public.quotations;

-- Recreate RLS policies with correct column reference
CREATE POLICY "Users can view their own quotations" 
ON public.quotations 
FOR SELECT 
TO authenticated 
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own quotations" 
ON public.quotations 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own quotations" 
ON public.quotations 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own quotations" 
ON public.quotations 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Add comment for documentation
COMMENT ON COLUMN public.quotations.created_by IS 'User ID of the quotation creator (references auth.users.id)';
