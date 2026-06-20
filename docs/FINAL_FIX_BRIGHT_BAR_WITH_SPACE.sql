-- =====================================================
-- FINAL FIX: MS BRIGHT BAR (with trailing space)
-- Category name is 'MS BRIGHT BAR ' not 'MS BRIGHT BAR'
-- =====================================================

-- Verify the category name with trailing space
SELECT 
  item_category,
  LENGTH(item_category) as category_length,
  COUNT(*) as count
FROM products
WHERE item_category LIKE 'MS BRIGHT BAR%'
GROUP BY item_category;

-- Show current state
SELECT 
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR '
GROUP BY display_prefix;

-- Update MS BRIGHT BAR products (with trailing space)
UPDATE products
SET display_prefix = CASE
  WHEN item_type LIKE '%HEXAGON%' THEN 'BR-HEX'
  WHEN item_type LIKE '%SQUARE%' THEN 'BR-SQ'
  WHEN item_type LIKE '%FLAT%' THEN 'BR-FL'
  WHEN item_type = 'MSBR' THEN 'BR'
  ELSE 'BR'
END
WHERE item_category = 'MS BRIGHT BAR ';

-- Verify the fix
SELECT 
  'AFTER UPDATE' as status,
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR '
GROUP BY display_prefix
ORDER BY display_prefix;

-- Show sample products
SELECT 
  item_name,
  item_type,
  item_size,
  display_prefix
FROM products
WHERE item_category = 'MS BRIGHT BAR '
ORDER BY display_prefix, item_name
LIMIT 30;

-- Check if any MSB prefixes remain anywhere
SELECT COUNT(*) as remaining_msb
FROM products
WHERE display_prefix = 'MSB';

-- Final summary of all categories
SELECT 
  item_category,
  display_prefix,
  COUNT(*) as count
FROM products
GROUP BY item_category, display_prefix
ORDER BY item_category, display_prefix;
