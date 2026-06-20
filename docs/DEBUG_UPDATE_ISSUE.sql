-- =====================================================
-- DEBUG: Why aren't updates working?
-- =====================================================

-- 1. Confirm products exist
SELECT COUNT(*) as total_bright_bar
FROM products
WHERE item_category = 'MS BRIGHT BAR';

-- 2. Show actual data
SELECT 
  id,
  item_name,
  item_category,
  item_type,
  display_prefix
FROM products
WHERE item_category = 'MS BRIGHT BAR'
LIMIT 5;

-- 3. Try a simple test update on ONE product
UPDATE products
SET display_prefix = 'TEST'
WHERE item_category = 'MS BRIGHT BAR'
LIMIT 1;

-- 4. Check if it updated
SELECT 
  item_name,
  item_category,
  display_prefix
FROM products
WHERE display_prefix = 'TEST';

-- 5. If test worked, update all MS BRIGHT BAR
UPDATE products
SET display_prefix = CASE
  WHEN item_type LIKE '%HEXAGON%' THEN 'BR-HEX'
  WHEN item_type LIKE '%SQUARE%' THEN 'BR-SQ'
  WHEN item_type LIKE '%FLAT%' THEN 'BR-FL'
  WHEN item_type = 'MSBR' THEN 'BR'
  ELSE 'BR'
END
WHERE item_category = 'MS BRIGHT BAR';

-- 6. Final check
SELECT 
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY display_prefix;
