-- First, drop existing policies and RLS if they exist
DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view their own quotation items" ON public.quotation_items;
    DROP POLICY IF EXISTS "Users can insert their own quotation items" ON public.quotation_items;
    DROP POLICY IF EXISTS "Users can update their own quotation items" ON public.quotation_items;
    
    -- Drop the trigger and function if they exist
    DROP TRIGGER IF EXISTS update_quotation_items_updated_at ON public.quotation_items;
    DROP FUNCTION IF EXISTS public.update_quotation_items_updated_at();
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error cleaning up existing objects: %', SQLERRM;
END $$;

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION public.update_quotation_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER update_quotation_items_updated_at
BEFORE UPDATE ON public.quotation_items
FOR EACH ROW
EXECUTE FUNCTION public.update_quotation_items_updated_at();

-- Recreate RLS policies with correct column references
CREATE POLICY "Users can view their own quotation items" 
ON public.quotation_items 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.quotations q
        WHERE q.id = quotation_items.quotation_id
        AND q.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own quotation items" 
ON public.quotation_items 
FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.quotations q
        WHERE q.id = quotation_items.quotation_id
        AND q.user_id = auth.uid()
    ) AND created_by = auth.uid()
);

CREATE POLICY "Users can update their own quotation items" 
ON public.quotation_items 
FOR UPDATE 
TO authenticated 
USING (
    created_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.quotations q
        WHERE q.id = quotation_items.quotation_id
        AND q.user_id = auth.uid()
    )
);

-- Add a policy for deleting items if needed
CREATE POLICY "Users can delete their own quotation items"
ON public.quotation_items
FOR DELETE
TO authenticated
USING (
    created_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.quotations q
        WHERE q.id = quotation_items.quotation_id
        AND q.user_id = auth.uid()
    )
);

-- Ensure RLS is enabled
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
