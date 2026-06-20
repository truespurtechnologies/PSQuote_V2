-- =====================================================
-- FIX MS BRIGHT BAR PREFIXES: MSB → BR-*
-- All 224 MS BRIGHT BAR products currently have 'MSB'
-- Need to update them to BR, BR-FL, BR-SQ, BR-HEX
-- =====================================================

-- Check current state
SELECT 
  'BEFORE FIX' as status,
  item_type,
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY item_type, display_prefix
ORDER BY item_type;

-- Update MS BRIGHT BAR prefixes based on item_type
UPDATE products
SET display_prefix = CASE
  -- Hexagon types (handles spacing variations with LIKE)
  WHEN item_type LIKE '%HEXAGON%' THEN 'BR-HEX'
  
  -- Square types (handles spacing variations with LIKE)
  WHEN item_type LIKE '%SQUARE%' THEN 'BR-SQ'
  
  -- Flat types
  WHEN item_type LIKE '%FLAT%' THEN 'BR-FL'
  
  -- Round/Basic MSBR (exact match, no subtype)
  WHEN item_type = 'MSBR' THEN 'BR'
  
  -- Fallback for any other MS BRIGHT BAR (shouldn't happen but safe)
  ELSE 'BR'
END
WHERE item_category = 'MS BRIGHT BAR'
  AND display_prefix = 'MSB';

-- Verify the fix
SELECT 
  'AFTER FIX' as status,
  item_type,
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY item_type, display_prefix
ORDER BY display_prefix, item_type;

-- Show sample products to verify
SELECT 
  item_name,
  item_type,
  item_size,
  display_prefix
FROM products
WHERE item_category = 'MS BRIGHT BAR'
ORDER BY display_prefix, item_name
LIMIT 40;

-- Final summary - should show BR, BR-FL, BR-SQ, BR-HEX (no MSB)
SELECT 
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY display_prefix
ORDER BY display_prefix;

-- Check if any MSB prefixes remain (should be 0)
SELECT 
  'REMAINING MSB COUNT' as status,
  COUNT(*) as count
FROM products
WHERE display_prefix = 'MSB';
