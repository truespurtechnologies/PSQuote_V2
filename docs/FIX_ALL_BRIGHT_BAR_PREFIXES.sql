-- =====================================================
-- FIX ALL MS BRIGHT BAR PREFIXES
-- This script will update ALL MS Bright Bar products regardless of item_type
-- =====================================================

-- Step 1: Check current state
SELECT 'CURRENT STATE' as status, 
  item_type,
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY item_type, display_prefix
ORDER BY item_type;

-- Step 2: Update based on item_type patterns
UPDATE products
SET display_prefix = CASE
  -- Hexagon types (with any spacing variations)
  WHEN item_type LIKE '%HEXAGON%' THEN 'BR-HEX'
  
  -- Square types (with any spacing variations)
  WHEN item_type LIKE '%SQUARE%' THEN 'BR-SQ'
  
  -- Flat types
  WHEN item_type LIKE '%FLAT%' THEN 'BR-FL'
  
  -- Round/Basic MSBR (no subtype)
  WHEN item_type = 'MSBR' THEN 'BR'
  
  -- Default for any other MS BRIGHT BAR
  ELSE 'BR'
END
WHERE item_category = 'MS BRIGHT BAR';

-- Step 3: Verify the updates
SELECT 'AFTER UPDATE' as status,
  item_type,
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY item_type, display_prefix
ORDER BY item_type;

-- Step 4: Show sample products to verify
SELECT 
  item_name,
  item_type,
  display_prefix
FROM products
WHERE item_category = 'MS BRIGHT BAR'
ORDER BY display_prefix, item_name
LIMIT 30;

-- Step 5: Check if any still have 'MSB' prefix (should be none)
SELECT 
  'REMAINING MSB PREFIX' as status,
  COUNT(*) as count
FROM products
WHERE display_prefix = 'MSB';
