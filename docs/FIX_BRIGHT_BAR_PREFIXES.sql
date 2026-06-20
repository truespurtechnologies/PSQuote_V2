-- Check current display_prefix values for bright bar products
SELECT 
  item_name,
  item_category,
  item_type,
  item_size,
  display_prefix
FROM products
WHERE item_category = 'MS BRIGHT BAR'
ORDER BY item_type, item_size
LIMIT 20;

-- Update bright bar prefixes to match the reference guide
UPDATE products
SET display_prefix = CASE
  -- MS Bright Bar Round (MSBR without subtype)
  WHEN item_type = 'MSBR' THEN 'BR'
  
  -- MS Bright Bar Flat
  WHEN item_type = 'MSBR FLAT' THEN 'BR-FL'
  
  -- MS Bright Bar Square (handle both single and double space)
  WHEN item_type = 'MSBR SQUARE' THEN 'BR-SQ'
  WHEN item_type = 'MSBR  SQUARE' THEN 'BR-SQ'
  
  -- MS Bright Bar Hexagon (handle both single and double space)
  WHEN item_type = 'MSBR HEXAGON' THEN 'BR-HEX'
  WHEN item_type = 'MSBR  HEXAGON' THEN 'BR-HEX'
  
  ELSE display_prefix -- Keep existing if no match
END
WHERE item_category = 'MS BRIGHT BAR';

-- Verify the updates
SELECT 
  item_name,
  item_category,
  item_type,
  item_size,
  display_prefix
FROM products
WHERE item_category = 'MS BRIGHT BAR'
ORDER BY item_type, item_size
LIMIT 20;
