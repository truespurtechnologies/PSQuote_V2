-- =====================================================
-- CHECK DATABASE CONTEXT
-- =====================================================

-- 1. What database are we in?
SELECT current_database();

-- 2. What schema are we using?
SELECT current_schema();

-- 3. Total products in the table
SELECT COUNT(*) as total_products FROM products;

-- 4. Check if RLS is enabled on products table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'products';

-- 5. Check RLS policies on products table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'products';

-- 6. Try selecting with explicit schema
SELECT COUNT(*) as bright_bar_count
FROM public.products
WHERE item_category = 'MS BRIGHT BAR';

-- 7. Show all categories again
SELECT 
  item_category,
  COUNT(*) as count
FROM public.products
GROUP BY item_category
ORDER BY item_category;

-- 8. Try update with explicit schema (no LIMIT - PostgreSQL doesn't support LIMIT in UPDATE)
UPDATE public.products
SET display_prefix = CASE
  WHEN item_type LIKE '%HEXAGON%' THEN 'BR-HEX'
  WHEN item_type LIKE '%SQUARE%' THEN 'BR-SQ'
  WHEN item_type LIKE '%FLAT%' THEN 'BR-FL'
  WHEN item_type = 'MSBR' THEN 'BR'
  ELSE 'BR'
END
WHERE item_category = 'MS BRIGHT BAR';

-- 9. Verify the update
SELECT 
  display_prefix,
  COUNT(*) as count
FROM public.products
WHERE item_category = 'MS BRIGHT BAR'
GROUP BY display_prefix;
