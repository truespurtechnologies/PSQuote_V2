-- Migration: Fix item_size values for roofing sheets
-- Purpose: Update roofing sheet item_size to contain only ft value for proper POS display
-- Date: 2026-06-22

-- Fix item_size for roofing sheets to contain only ft value (e.g., "15ft" instead of "PPGI-0.47-15ft")
UPDATE public.products
SET item_size = CASE
  -- Extract only ft value from existing item_size like "PPGI-0.47-15ft" -> "15ft"
  WHEN item_category = 'ROOFING SHEET' AND item_size ~ '-([0-9.]+ft)' THEN
    REGEXP_REPLACE(item_size, '.*-([0-9.]+ft).*', '\1')
  -- If no ft pattern in item_size, try extracting from item_name
  WHEN item_category = 'ROOFING SHEET' AND item_name ~ '-([0-9.]+ft)' THEN
    REGEXP_REPLACE(item_name, '.*-([0-9.]+ft).*', '\1')
  ELSE item_size
END
WHERE item_category = 'ROOFING SHEET';

-- Log the update
DO $$
DECLARE
  roof_count INTEGER;
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO roof_count
  FROM public.products 
  WHERE item_category = 'ROOFING SHEET';
  
  SELECT COUNT(*) INTO updated_count
  FROM public.products 
  WHERE item_category = 'ROOFING SHEET' 
    AND item_size ~ '^[0-9.]+ft$';
  
  RAISE NOTICE 'Updated % roofing sheets total (% with correct ft format)', roof_count, updated_count;
END $$;
