-- Verify that display_prefix column exists in products table
-- Run this in Supabase SQL Editor

-- Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
  AND column_name = 'display_prefix';

-- If column exists, check sample data
SELECT 
  item_name,
  item_category,
  item_type,
  display_prefix,
  item_size
FROM public.products
LIMIT 10;

-- Count products with and without prefix
SELECT 
  CASE 
    WHEN display_prefix IS NULL THEN 'No Prefix'
    ELSE 'Has Prefix'
  END as prefix_status,
  COUNT(*) as count
FROM public.products
GROUP BY prefix_status;
