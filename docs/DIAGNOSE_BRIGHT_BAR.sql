-- =====================================================
-- DIAGNOSTIC SCRIPT - Find MS Bright Bar products
-- =====================================================

-- 1. Find all unique item_category values that contain "BRIGHT"
SELECT DISTINCT
  item_category,
  COUNT(*) as product_count
FROM products
WHERE item_category LIKE '%BRIGHT%'
GROUP BY item_category;

-- 2. Find all unique item_category values that contain "BAR"
SELECT DISTINCT
  item_category,
  COUNT(*) as product_count
FROM products
WHERE item_category LIKE '%BAR%'
GROUP BY item_category;

-- 3. Find products with display_prefix = 'MSB'
SELECT 
  item_name,
  item_category,
  item_type,
  item_size,
  display_prefix
FROM products
WHERE display_prefix = 'MSB'
LIMIT 20;

-- 4. Find products with item_type containing 'MSBR'
SELECT 
  item_name,
  item_category,
  item_type,
  item_size,
  display_prefix
FROM products
WHERE item_type LIKE '%MSBR%'
LIMIT 20;

-- 5. Find products with item_name containing 'MSBR'
SELECT 
  item_name,
  item_category,
  item_type,
  item_size,
  display_prefix
FROM products
WHERE item_name LIKE '%MSBR%'
LIMIT 20;

-- 6. List ALL unique item_category values to see exact spelling
SELECT DISTINCT item_category
FROM products
ORDER BY item_category;
