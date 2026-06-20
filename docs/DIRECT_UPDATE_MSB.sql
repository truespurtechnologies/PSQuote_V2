-- =====================================================
-- DIRECT UPDATE - No WHERE clause on display_prefix
-- =====================================================

-- Show current item_type values
SELECT DISTINCT item_type
FROM products
WHERE item_category = 'MS BRIGHT BAR'
ORDER BY item_type;

-- Update ALL MS BRIGHT BAR products directly
UPDATE products
SET display_prefix = CASE
  WHEN item_type LIKE '%HEXAGON%' THEN 'BR-HEX'
  WHEN item_type LIKE '%SQUARE%' THEN 'BR-SQ'
  WHEN item_type LIKE '%FLAT%' THEN 'BR-FL'
  WHEN item_type = 'MSBR' THEN 'BR'
  ELSE 'BR'  -- Default for any other MS BRIGHT BAR
END
WHERE item_category = 'MS BRIGHT BAR';

-- Verify
SELECT 
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY display_prefix;
