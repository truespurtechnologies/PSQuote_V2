-- SQL to check the structure of the quotations table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM 
    information_schema.columns 
WHERE 
    table_name = 'quotations' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- Check constraints and indexes
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM 
    information_schema.table_constraints tc
LEFT JOIN 
    information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE 
    tc.table_name = 'quotations' 
    AND tc.table_schema = 'public';

-- Get a sample row (if any data exists)
SELECT * FROM public.quotations LIMIT 1;
