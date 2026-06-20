-- Check if created_by column exists in loading_slips table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'loading_slips'
AND column_name = 'created_by';

-- If the above returns no rows, the column doesn't exist
-- If it returns a row, check the data type matches UUID
