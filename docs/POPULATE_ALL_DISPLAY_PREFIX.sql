-- =====================================================
-- POPULATE display_prefix FOR ALL PRODUCTS
-- This runs the migration logic to populate the display_prefix column
-- =====================================================

-- First, check if display_prefix column exists and is NULL
SELECT 
  'BEFORE UPDATE' as status,
  COUNT(*) as total_products,
  COUNT(display_prefix) as products_with_prefix,
  COUNT(*) - COUNT(display_prefix) as products_without_prefix
FROM products;

-- Populate display_prefix based on item_category and item_type
UPDATE products
SET display_prefix = CASE
  -- Base Plates
  WHEN item_category = 'BASE PLATE' THEN 'BP'
  
  -- Sheets
  WHEN item_category = 'CR SHEET' THEN 'CRS'
  WHEN item_category = 'GI SHEET' THEN 'GI'
  WHEN item_category = 'HR SHEET' THEN 'HRS'
  WHEN item_category = 'ROOFING SHEET' THEN 'ROOF'
  
  -- Cut Plates
  WHEN item_category = 'CUT PLATE' THEN 'CP'
  
  -- MS Structurals (Angles, Channels, I-Beams)
  WHEN item_category = 'MS STRUCTURALS' AND item_type = 'MS ANGLE' THEN 'ANG'
  WHEN item_category = 'MS STRUCTURALS' AND item_type = 'MS CHANNEL' THEN 'CH'
  WHEN item_category = 'MS STRUCTURALS' AND item_type = 'MS I BEAM' THEN 'MSIB'
  
  -- MS Flats
  WHEN item_category = 'MS FLAT' THEN 'FL'
  
  -- MS Pipes (CHS, RHS, SHS)
  WHEN item_category = 'MS PIPE' AND item_type = 'MS PIPE CHS' THEN 'P-CHS'
  WHEN item_category = 'MS PIPE' AND item_type = 'MS PIPE RHS' THEN 'P-RHS'
  WHEN item_category = 'MS PIPE' AND item_type = 'MS PIPE SHS' THEN 'P-SHS'
  
  -- MS Round and Square
  WHEN item_category = 'MS ROUND' THEN 'RD'
  WHEN item_category = 'MS SQUARE' THEN 'SQ'
  
  -- MS Bright Bar (MSBR) - Using LIKE to handle spacing variations
  WHEN item_category = 'MS BRIGHT BAR' AND item_type = 'MSBR' THEN 'BR'
  WHEN item_category = 'MS BRIGHT BAR' AND item_type LIKE '%FLAT%' THEN 'BR-FL'
  WHEN item_category = 'MS BRIGHT BAR' AND item_type LIKE '%SQUARE%' THEN 'BR-SQ'
  WHEN item_category = 'MS BRIGHT BAR' AND item_type LIKE '%HEXAGON%' THEN 'BR-HEX'
  
  -- TMT Rods
  WHEN item_category = 'TMT ROD' THEN 'TMT'
  
  -- Generic/Unknown
  WHEN item_category = 'Generic Product' THEN 'GEN'
  WHEN item_category = 'Product Not found' THEN 'PNF'
  
  -- Default fallback
  ELSE 'UNK'
END
WHERE display_prefix IS NULL;

-- Verify the update
SELECT 
  'AFTER UPDATE' as status,
  COUNT(*) as total_products,
  COUNT(display_prefix) as products_with_prefix,
  COUNT(*) - COUNT(display_prefix) as products_without_prefix
FROM products;

-- Check MS BRIGHT BAR specifically
SELECT 
  'MS BRIGHT BAR PREFIXES' as status,
  display_prefix,
  COUNT(*) as count
FROM products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY display_prefix
ORDER BY display_prefix;

-- Show sample MS BRIGHT BAR products
SELECT 
  item_name,
  item_type,
  item_size,
  display_prefix
FROM products
WHERE item_category = 'MS BRIGHT BAR'
ORDER BY display_prefix, item_name
LIMIT 30;

-- Summary by category
SELECT 
  item_category,
  display_prefix,
  COUNT(*) as count
FROM products
GROUP BY item_category, display_prefix
ORDER BY item_category, display_prefix;
