-- =====================================================
-- REMOVE TRAILING SPACE FROM MS BRIGHT BAR CATEGORY
-- =====================================================

-- Check current category names with trailing spaces
SELECT 
  item_category,
  LENGTH(item_category) as length,
  COUNT(*) as count
FROM products
WHERE item_category LIKE 'MS BRIGHT BAR%'
GROUP BY item_category
ORDER BY item_category;

-- Update MS BRIGHT BAR category to remove trailing space
UPDATE products
SET item_category = TRIM(item_category)
WHERE item_category = 'MS BRIGHT BAR ';

-- Verify the update
SELECT 
  'AFTER TRIM' as status,
  item_category,
  LENGTH(item_category) as length,
  COUNT(*) as count
FROM products
WHERE item_category LIKE 'MS BRIGHT BAR%'
GROUP BY item_category
ORDER BY item_category;

-- Check all categories for any other trailing spaces
SELECT 
  item_category,
  LENGTH(item_category) as length,
  COUNT(*) as count
FROM products
WHERE item_category != TRIM(item_category)
GROUP BY item_category
ORDER BY item_category;

-- Optional: Clean up ALL categories with trailing spaces
UPDATE products
SET item_category = TRIM(item_category)
WHERE item_category != TRIM(item_category);

-- Final verification - should show no categories with trailing spaces
SELECT 
  'FINAL CHECK' as status,
  COUNT(*) as categories_with_trailing_space
FROM products
WHERE item_category != TRIM(item_category);
