-- Migration: Remove duplicate RLS policies on products table
-- Issue: Duplicate policies defined in 20250803000000_add_products_rls_policies.sql
-- Solution: Drop all existing policies and recreate with single instances
-- Date: 2026-06-20

-- Drop all existing policies on products table
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated read access to products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated insert access to products" ON public.products;
DROP POLICY IF EXISTS "Allow update access to own products" ON public.products;
DROP POLICY IF EXISTS "Allow delete access to own products" ON public.products;

-- Ensure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create clean, non-duplicate policies

-- Policy: Allow authenticated users to read all products
CREATE POLICY "Allow authenticated read access to products" 
ON public.products 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Allow authenticated users to insert products
CREATE POLICY "Allow authenticated insert access to products" 
ON public.products 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to update products
-- Note: Adjust USING clause if products should have ownership (e.g., created_by column)
CREATE POLICY "Allow authenticated update access to products" 
ON public.products 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy: Allow authenticated users to delete products
-- Note: Adjust USING clause if products should have ownership (e.g., created_by column)
CREATE POLICY "Allow authenticated delete access to products" 
ON public.products 
FOR DELETE 
TO authenticated 
USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.products IS 'Product catalog with RLS policies allowing authenticated users full access';
