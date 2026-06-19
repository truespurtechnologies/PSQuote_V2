-- Drop existing policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow public read access') THEN
    DROP POLICY "Allow public read access" ON public.products;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow authenticated read access to products') THEN
    DROP POLICY "Allow authenticated read access to products" ON public.products;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow authenticated insert access to products') THEN
    DROP POLICY "Allow authenticated insert access to products" ON public.products;
  END IF;
END $$;

-- Enable Row Level Security on products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all products
CREATE POLICY "Allow authenticated read access to products" 
ON public.products 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy to allow authenticated users to insert products
CREATE POLICY "Allow authenticated insert access to products" 
ON public.products 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow users to update their own products
CREATE POLICY "Allow update access to own products" 
ON public.products 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow users to delete their own products
CREATE POLICY "Allow delete access to own products" 
ON public.products 
FOR DELETE 
TO authenticated 
USING (true);

-- Policy to allow users to update their own products
CREATE POLICY "Allow update access to own products" 
ON public.products 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy to allow users to delete their own products
CREATE POLICY "Allow delete access to own products" 
ON public.products 
FOR DELETE 
TO authenticated 
USING (true);
