-- Check if products table has any data at all
SELECT COUNT(*) as total_products FROM products;

-- Check if display_prefix column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name = 'display_prefix';

-- Find products with MSBR in the name (regardless of category)
SELECT 
  item_name,
  item_category,
  item_type,
  item_size,
  display_prefix
FROM products
WHERE item_name LIKE '%MSBR%'
LIMIT 30;

-- Check all categories to see what exists
SELECT 
  item_category,
  COUNT(*) as count
FROM products
GROUP BY item_category
ORDER BY item_category;

-- Check if there are any products with NULL or empty category
SELECT 
  item_name,
  item_category,
  item_type,
  display_prefix
FROM products
WHERE item_category IS NULL 
   OR item_category = ''
LIMIT 20;
