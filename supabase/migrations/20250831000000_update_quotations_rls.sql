-- Update the RLS policy to allow all authenticated users to view all quotations
DROP POLICY IF EXISTS "Users can view their own quotations" ON public.quotations;

CREATE POLICY "All authenticated users can view all quotations" 
ON public.quotations 
FOR SELECT 
TO authenticated 
USING (true);

-- Keep the other policies as they are for insert, update, and delete
-- to ensure users can only modify their own quotations
