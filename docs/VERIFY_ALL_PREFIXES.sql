-- =====================================================
-- COMPREHENSIVE PREFIX VERIFICATION SCRIPT
-- Cross-checks all product prefixes against reference guide
-- =====================================================

-- 1. BASE PLATES (Expected: BP)
SELECT 'BASE PLATE' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'BP' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be BP' END as status
FROM products
WHERE item_category = 'BASE PLATE'
ORDER BY item_name
LIMIT 10;

-- 2. SHEETS - CR (Expected: CR)
SELECT 'CR SHEET' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'CR' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be CR' END as status
FROM products
WHERE item_category = 'CR SHEET'
ORDER BY item_name
LIMIT 10;

-- 3. SHEETS - GI (Expected: GI)
SELECT 'GI SHEET' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'GI' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be GI' END as status
FROM products
WHERE item_category = 'GI SHEET'
ORDER BY item_name
LIMIT 10;

-- 4. SHEETS - HR (Expected: HR)
SELECT 'HR SHEET' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'HR' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be HR' END as status
FROM products
WHERE item_category = 'HR SHEET'
ORDER BY item_name
LIMIT 10;

-- 5. ROOFING SHEET (Expected: ROOF)
SELECT 'ROOFING SHEET' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'ROOF' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be ROOF' END as status
FROM products
WHERE item_category = 'ROOFING SHEET'
ORDER BY item_name
LIMIT 10;

-- 6. CUT PLATE (Expected: CP)
SELECT 'CUT PLATE' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'CP' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be CP' END as status
FROM products
WHERE item_category = 'CUT PLATE'
ORDER BY item_name
LIMIT 10;

-- 7. MS STRUCTURALS - ANGLE (Expected: ANG)
SELECT 'MS ANGLE' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'ANG' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be ANG' END as status
FROM products
WHERE item_category = 'MS STRUCTURALS' AND item_type = 'MS ANGLE'
ORDER BY item_name
LIMIT 10;

-- 8. MS STRUCTURALS - CHANNEL (Expected: CH)
SELECT 'MS CHANNEL' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'CH' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be CH' END as status
FROM products
WHERE item_category = 'MS STRUCTURALS' AND item_type = 'MS CHANNEL'
ORDER BY item_name
LIMIT 10;

-- 9. MS STRUCTURALS - I BEAM (Expected: ISMB)
SELECT 'MS I BEAM' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'ISMB' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be ISMB' END as status
FROM products
WHERE item_category = 'MS STRUCTURALS' AND item_type LIKE '%BEAM%'
ORDER BY item_name
LIMIT 10;

-- 10. MS FLAT (Expected: FL)
SELECT 'MS FLAT' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'FL' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be FL' END as status
FROM products
WHERE item_category = 'MS FLAT'
ORDER BY item_name
LIMIT 10;

-- 11. MS PIPE - CHS (Expected: P-CHS)
SELECT 'MS PIPE CHS' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'P-CHS' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be P-CHS' END as status
FROM products
WHERE item_category = 'MS PIPE' AND item_type = 'MS PIPE CHS'
ORDER BY item_name
LIMIT 10;

-- 12. MS PIPE - RHS (Expected: P-RHS)
SELECT 'MS PIPE RHS' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'P-RHS' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be P-RHS' END as status
FROM products
WHERE item_category = 'MS PIPE' AND item_type = 'MS PIPE RHS'
ORDER BY item_name
LIMIT 10;

-- 13. MS PIPE - SHS (Expected: P-SHS)
SELECT 'MS PIPE SHS' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'P-SHS' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be P-SHS' END as status
FROM products
WHERE item_category = 'MS PIPE' AND item_type = 'MS PIPE SHS'
ORDER BY item_name
LIMIT 10;

-- 14. MS ROUND (Expected: RD)
SELECT 'MS ROUND' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'RD' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be RD' END as status
FROM products
WHERE item_category = 'MS ROUND'
ORDER BY item_name
LIMIT 10;

-- 15. MS SQUARE (Expected: SQ)
SELECT 'MS SQUARE' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'SQ' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be SQ' END as status
FROM products
WHERE item_category = 'MS SQUARE'
ORDER BY item_name
LIMIT 10;

-- 16. MS BRIGHT BAR - ROUND (Expected: BR)
SELECT 'MS BRIGHT BAR ROUND' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'BR' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be BR' END as status
FROM products
WHERE item_category = 'MS BRIGHT BAR' AND item_type = 'MSBR'
ORDER BY item_name
LIMIT 10;

-- 17. MS BRIGHT BAR - FLAT (Expected: BR-FL)
SELECT 'MS BRIGHT BAR FLAT' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'BR-FL' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be BR-FL' END as status
FROM products
WHERE item_category = 'MS BRIGHT BAR' AND item_type = 'MSBR FLAT'
ORDER BY item_name
LIMIT 10;

-- 18. MS BRIGHT BAR - SQUARE (Expected: BR-SQ)
SELECT 'MS BRIGHT BAR SQUARE' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'BR-SQ' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be BR-SQ' END as status
FROM products
WHERE item_category = 'MS BRIGHT BAR' AND (item_type = 'MSBR SQUARE' OR item_type = 'MSBR  SQUARE')
ORDER BY item_name
LIMIT 10;

-- 19. MS BRIGHT BAR - HEXAGON (Expected: BR-HEX)
SELECT 'MS BRIGHT BAR HEXAGON' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'BR-HEX' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be BR-HEX' END as status
FROM products
WHERE item_category = 'MS BRIGHT BAR' AND (item_type = 'MSBR HEXAGON' OR item_type = 'MSBR  HEXAGON')
ORDER BY item_name
LIMIT 10;

-- 20. TMT ROD (Expected: TMT)
SELECT 'TMT ROD' as category, item_name, item_type, display_prefix,
  CASE WHEN display_prefix = 'TMT' THEN '✓ CORRECT' ELSE '✗ WRONG - Should be TMT' END as status
FROM products
WHERE item_category = 'TMT ROD'
ORDER BY item_name
LIMIT 10;

-- =====================================================
-- SUMMARY: Count of incorrect prefixes by category
-- =====================================================
SELECT 
  item_category,
  item_type,
  display_prefix,
  COUNT(*) as count,
  '✗ NEEDS REVIEW' as status
FROM products
WHERE 
  (item_category = 'BASE PLATE' AND display_prefix != 'BP') OR
  (item_category = 'CR SHEET' AND display_prefix != 'CR') OR
  (item_category = 'GI SHEET' AND display_prefix != 'GI') OR
  (item_category = 'HR SHEET' AND display_prefix != 'HR') OR
  (item_category = 'ROOFING SHEET' AND display_prefix != 'ROOF') OR
  (item_category = 'CUT PLATE' AND display_prefix != 'CP') OR
  (item_category = 'MS STRUCTURALS' AND item_type = 'MS ANGLE' AND display_prefix != 'ANG') OR
  (item_category = 'MS STRUCTURALS' AND item_type = 'MS CHANNEL' AND display_prefix != 'CH') OR
  (item_category = 'MS STRUCTURALS' AND item_type LIKE '%BEAM%' AND display_prefix != 'ISMB') OR
  (item_category = 'MS FLAT' AND display_prefix != 'FL') OR
  (item_category = 'MS PIPE' AND item_type = 'MS PIPE CHS' AND display_prefix != 'P-CHS') OR
  (item_category = 'MS PIPE' AND item_type = 'MS PIPE RHS' AND display_prefix != 'P-RHS') OR
  (item_category = 'MS PIPE' AND item_type = 'MS PIPE SHS' AND display_prefix != 'P-SHS') OR
  (item_category = 'MS ROUND' AND display_prefix != 'RD') OR
  (item_category = 'MS SQUARE' AND display_prefix != 'SQ') OR
  (item_category = 'MS BRIGHT BAR' AND item_type = 'MSBR' AND display_prefix != 'BR') OR
  (item_category = 'MS BRIGHT BAR' AND item_type = 'MSBR FLAT' AND display_prefix != 'BR-FL') OR
  (item_category = 'MS BRIGHT BAR' AND (item_type = 'MSBR SQUARE' OR item_type = 'MSBR  SQUARE') AND display_prefix != 'BR-SQ') OR
  (item_category = 'MS BRIGHT BAR' AND (item_type = 'MSBR HEXAGON' OR item_type = 'MSBR  HEXAGON') AND display_prefix != 'BR-HEX') OR
  (item_category = 'TMT ROD' AND display_prefix != 'TMT')
GROUP BY item_category, item_type, display_prefix
ORDER BY item_category, item_type;

-- =====================================================
-- If the summary shows any rows, there are discrepancies
-- If the summary is empty, all prefixes are correct!
-- =====================================================
