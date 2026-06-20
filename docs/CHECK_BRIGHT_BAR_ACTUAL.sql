-- Check what's actually in the database for MS Bright Bar products
-- This will show us the actual item_type values and current display_prefix

SELECT 
  item_name,
  item_category,
  item_type,
  item_size,
  display_prefix,
  LENGTH(item_type) as type_length,
  LENGTH(TRIM(item_type)) as trimmed_length
FROM products
WHERE item_category = 'MS BRIGHT BAR'
ORDER BY item_type, item_name
LIMIT 50;

-- Check for all unique item_type values in MS BRIGHT BAR category
SELECT DISTINCT
  item_type,
  display_prefix,
  COUNT(*) as product_count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY item_type, display_prefix
ORDER BY item_type;

-- Check if there are products with 'MSB' prefix
SELECT 
  item_name,
  item_category,
  item_type,
  display_prefix
FROM products
WHERE display_prefix = 'MSB'
LIMIT 20;
