-- Migration: Add display_prefix column to products table
-- Purpose: Store short prefix codes for POS loading slips and quotations
-- Date: 2026-06-20

-- Add display_prefix column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS display_prefix VARCHAR(10);

-- Add comment for documentation
COMMENT ON COLUMN public.products.display_prefix IS 'Short prefix code for display in POS loading slips (e.g., ANG, CH, P-CHS)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_display_prefix 
ON public.products(display_prefix);

-- Populate display_prefix based on item_category and item_type
UPDATE public.products
SET display_prefix = CASE
  -- Base Plates
  WHEN item_category = 'BASE PLATE' THEN 'BP'
  
  -- Sheets
  WHEN item_category = 'CR SHEET' THEN 'SH'
  WHEN item_category = 'GI SHEET' THEN 'SH'
  WHEN item_category = 'HR SHEET' THEN 'SH'
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
  
  -- MS Bright Bar (MSBR) - Handle with/without trailing space
  WHEN TRIM(item_category) = 'MS BRIGHT BAR' AND item_type = 'MSBR' THEN 'BR'
  WHEN TRIM(item_category) = 'MS BRIGHT BAR' AND item_type LIKE '%FLAT%' THEN 'BR-FL'
  WHEN TRIM(item_category) = 'MS BRIGHT BAR' AND item_type LIKE '%SQUARE%' THEN 'BR-SQ'
  WHEN TRIM(item_category) = 'MS BRIGHT BAR' AND item_type LIKE '%HEXAGON%' THEN 'BR-HEX'
  
  -- TMT Rods
  WHEN item_category = 'TMT ROD' THEN 'TMT'
  
  -- Generic/Unknown
  WHEN item_category = 'Generic Product' THEN 'GEN'
  WHEN item_category = 'Product Not found' THEN 'PNF'
  
  -- Fallback: Use first 3 characters of item_type
  ELSE COALESCE(SUBSTRING(item_type FROM 1 FOR 3), 'UNK')
END
WHERE display_prefix IS NULL;

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM public.products 
  WHERE display_prefix IS NOT NULL;
  
  RAISE NOTICE 'Updated display_prefix for % products', updated_count;
END $$;
