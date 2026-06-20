-- Add created_by column to loading_slips table
ALTER TABLE loading_slips 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'loading_slips'
AND column_name = 'created_by';

-- After running this, you MUST reload the schema cache:
-- Go to Supabase Dashboard > API > Click "Reload schema cache"
-- OR run: NOTIFY pgrst, 'reload schema';
