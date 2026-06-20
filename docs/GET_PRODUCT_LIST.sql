-- Get all active products with their names and categories
-- Run this in Supabase SQL Editor to see your complete product catalog

SELECT 
    item_name,
    item_category,
    item_sub_category,
    item_type,
    item_size,
    item_description
FROM public.products
WHERE is_active = true
ORDER BY item_name;
