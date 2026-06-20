-- Simple check to see MS BRIGHT BAR products
SELECT 
  item_name,
  item_category,
  item_type,
  item_size,
  display_prefix
FROM products
WHERE item_category = 'MS BRIGHT BAR'
ORDER BY item_name
LIMIT 30;

-- Count by display_prefix
SELECT 
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY display_prefix;

-- Count by item_type
SELECT 
  item_type,
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY item_type, display_prefix
ORDER BY item_type;
