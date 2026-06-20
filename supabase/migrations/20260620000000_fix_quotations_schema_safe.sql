-- Migration: Fix quotations table schema (SAFE VERSION)
-- Issue: Column name mismatch - table uses 'user_id' but RLS policies reference 'created_by'
-- Solution: Rename user_id to created_by for consistency across all tables
-- Date: 2026-06-20

-- Check if user_id exists and rename it, otherwise skip
DO $$
BEGIN
    -- Check if user_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quotations' 
        AND column_name = 'user_id'
    ) THEN
        -- Rename user_id to created_by
        ALTER TABLE public.quotations RENAME COLUMN user_id TO created_by;
        RAISE NOTICE 'Column user_id renamed to created_by';
        
        -- Update the index
        DROP INDEX IF EXISTS idx_quotations_user_id;
        CREATE INDEX idx_quotations_created_by ON public.quotations(created_by);
        RAISE NOTICE 'Index updated';
    ELSE
        RAISE NOTICE 'Column user_id does not exist - likely already renamed to created_by';
    END IF;
END $$;

-- Drop existing policies (they may reference either user_id or created_by)
DROP POLICY IF EXISTS "Users can view their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can insert their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can update their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can delete their own quotations" ON public.quotations;

-- Recreate RLS policies with correct column reference (created_by)
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
