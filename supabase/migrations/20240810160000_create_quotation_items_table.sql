-- Create quotation_items table
CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    quotation_id UUID NOT NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Foreign key to quotations table
    CONSTRAINT fk_quotation
        FOREIGN KEY(quotation_id) 
        REFERENCES public.quotations(id)
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON public.quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_created_by ON public.quotation_items(created_by);

-- Enable Row Level Security
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own quotation items" 
ON public.quotation_items 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.quotations q
        WHERE q.id = quotation_items.quotation_id
        AND q.created_by = auth.uid()
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
        AND q.created_by = auth.uid()
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
        AND q.created_by = auth.uid()
    )
);

-- Create a trigger function to update the updated_at column
CREATE OR REPLACE FUNCTION update_quotation_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update the updated_at column on each update
CREATE TRIGGER update_quotation_items_updated_at
BEFORE UPDATE ON public.quotation_items
FOR EACH ROW
EXECUTE FUNCTION update_quotation_items_updated_at();
