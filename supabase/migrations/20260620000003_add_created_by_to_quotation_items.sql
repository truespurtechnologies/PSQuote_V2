-- Migration: Add created_by column to quotation_items table
-- Issue: quotation_items table is missing created_by column
-- Error: PGRST204 - Could not find the 'created_by' column in schema cache
-- Date: 2026-06-20

-- Check if created_by column exists, if not add it
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Check if created_by column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quotation_items' 
        AND column_name = 'created_by'
    ) THEN
        RAISE NOTICE 'Adding created_by column to quotation_items...';
        
        -- Step 1: Add column as nullable first
        ALTER TABLE public.quotation_items 
        ADD COLUMN created_by UUID REFERENCES auth.users(id);
        
        RAISE NOTICE 'Column created_by added (nullable)';
        
        -- Step 2: Get the first user ID from auth.users to use as default for existing rows
        SELECT id INTO first_user_id 
        FROM auth.users 
        LIMIT 1;
        
        -- Step 3: Update existing rows with a valid user ID
        IF first_user_id IS NOT NULL THEN
            UPDATE public.quotation_items 
            SET created_by = first_user_id 
            WHERE created_by IS NULL;
            
            RAISE NOTICE 'Updated existing rows with user ID: %', first_user_id;
        ELSE
            RAISE NOTICE 'No users found in auth.users - existing rows will remain NULL';
        END IF;
        
        -- Step 4: Make the column NOT NULL (only if we have data or no rows exist)
        IF (SELECT COUNT(*) FROM public.quotation_items WHERE created_by IS NULL) = 0 THEN
            ALTER TABLE public.quotation_items 
            ALTER COLUMN created_by SET NOT NULL;
            
            RAISE NOTICE 'Column created_by set to NOT NULL';
        ELSE
            RAISE WARNING 'Some rows still have NULL created_by - column remains nullable';
        END IF;
        
        -- Step 5: Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_quotation_items_created_by 
        ON public.quotation_items(created_by);
        
        RAISE NOTICE 'Index created on created_by column';
    ELSE
        RAISE NOTICE 'Column created_by already exists in quotation_items';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.quotation_items.created_by IS 'User ID of the item creator (references auth.users.id)';
