-- =====================================================
-- UPDATE PREFIX CHANGES
-- MS I Beam: ISMB → MSIB
-- CR Sheet: CR → CRS
-- HR Sheet: HR → HRS
-- =====================================================

-- Check current values before update
SELECT 'BEFORE UPDATE' as status, item_category, item_type, display_prefix, COUNT(*) as count
FROM products
WHERE 
  (item_category = 'MS STRUCTURALS' AND item_type LIKE '%BEAM%') OR
  item_category = 'CR SHEET' OR
  item_category = 'HR SHEET'
GROUP BY item_category, item_type, display_prefix
ORDER BY item_category;

-- Update MS I Beam: ISMB → MSIB
UPDATE products
SET display_prefix = 'MSIB'
WHERE item_category = 'MS STRUCTURALS' 
  AND item_type LIKE '%BEAM%'
  AND display_prefix = 'ISMB';

-- Update CR Sheet: CR → CRS
UPDATE products
SET display_prefix = 'CRS'
WHERE item_category = 'CR SHEET'
  AND display_prefix = 'CR';

-- Update HR Sheet: HR → HRS
UPDATE products
SET display_prefix = 'HRS'
WHERE item_category = 'HR SHEET'
  AND display_prefix = 'HR';

-- Verify updates
SELECT 'AFTER UPDATE' as status, item_category, item_type, display_prefix, COUNT(*) as count
FROM products
WHERE 
  (item_category = 'MS STRUCTURALS' AND item_type LIKE '%BEAM%') OR
  item_category = 'CR SHEET' OR
  item_category = 'HR SHEET'
GROUP BY item_category, item_type, display_prefix
ORDER BY item_category;

-- Sample products to verify
SELECT 'SAMPLE PRODUCTS' as status, item_name, item_category, item_type, display_prefix
FROM products
WHERE 
  (item_category = 'MS STRUCTURALS' AND item_type LIKE '%BEAM%') OR
  item_category = 'CR SHEET' OR
  item_category = 'HR SHEET'
ORDER BY item_category, item_name
LIMIT 20;
