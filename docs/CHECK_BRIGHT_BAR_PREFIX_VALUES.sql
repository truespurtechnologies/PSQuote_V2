-- Check what display_prefix values exist for MS BRIGHT BAR
SELECT 
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY display_prefix
ORDER BY display_prefix;

-- Show sample MS BRIGHT BAR products with their current prefix
SELECT 
  item_name,
  item_type,
  item_size,
  display_prefix
FROM products
WHERE item_category = 'MS BRIGHT BAR'
ORDER BY item_type, item_name
LIMIT 50;

-- Check if display_prefix is NULL for MS BRIGHT BAR
SELECT 
  COUNT(*) as null_prefix_count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
  AND display_prefix IS NULL;

-- Check unique item_type values for MS BRIGHT BAR
SELECT DISTINCT
  item_type,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY item_type
ORDER BY item_type;
