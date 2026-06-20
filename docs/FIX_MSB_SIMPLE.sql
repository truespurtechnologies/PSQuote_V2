-- =====================================================
-- SIMPLE FIX: Update MSB to correct BR-* prefixes
-- =====================================================

-- First, let's see what item_type values actually exist
SELECT DISTINCT
  item_type,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY item_type
ORDER BY item_type;

-- Update in separate steps for clarity

-- Step 1: Update HEXAGON types
UPDATE products
SET display_prefix = 'BR-HEX'
WHERE item_category = 'MS BRIGHT BAR'
  AND item_type LIKE '%HEXAGON%';

-- Check result
SELECT 'After HEXAGON update' as step, COUNT(*) as updated_count
FROM products
WHERE item_category = 'MS BRIGHT BAR' AND display_prefix = 'BR-HEX';

-- Step 2: Update SQUARE types
UPDATE products
SET display_prefix = 'BR-SQ'
WHERE item_category = 'MS BRIGHT BAR'
  AND item_type LIKE '%SQUARE%';

-- Check result
SELECT 'After SQUARE update' as step, COUNT(*) as updated_count
FROM products
WHERE item_category = 'MS BRIGHT BAR' AND display_prefix = 'BR-SQ';

-- Step 3: Update FLAT types
UPDATE products
SET display_prefix = 'BR-FL'
WHERE item_category = 'MS BRIGHT BAR'
  AND item_type LIKE '%FLAT%';

-- Check result
SELECT 'After FLAT update' as step, COUNT(*) as updated_count
FROM products
WHERE item_category = 'MS BRIGHT BAR' AND display_prefix = 'BR-FL';

-- Step 4: Update basic MSBR (round)
UPDATE products
SET display_prefix = 'BR'
WHERE item_category = 'MS BRIGHT BAR'
  AND item_type = 'MSBR';

-- Check result
SELECT 'After MSBR update' as step, COUNT(*) as updated_count
FROM products
WHERE item_category = 'MS BRIGHT BAR' AND display_prefix = 'BR';

-- Final verification
SELECT 
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY display_prefix
ORDER BY display_prefix;

-- Check if any MSB remains
SELECT COUNT(*) as remaining_msb
FROM products
WHERE display_prefix = 'MSB';
