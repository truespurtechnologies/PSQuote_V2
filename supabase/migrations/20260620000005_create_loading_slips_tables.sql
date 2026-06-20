-- Create loading_slips table
CREATE TABLE IF NOT EXISTS loading_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_number TEXT NOT NULL UNIQUE,
  to_name TEXT,
  phone TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_weight NUMERIC(10, 3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create loading_slip_items table
CREATE TABLE IF NOT EXISTS loading_slip_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slip_id UUID NOT NULL REFERENCES loading_slips(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  item_name TEXT NOT NULL,
  qty_in_kg_pc NUMERIC(10, 3) DEFAULT 0,
  required_qty INTEGER DEFAULT 0,
  total_qty_kg NUMERIC(10, 3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loading_slips_created_at ON loading_slips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loading_slips_slip_number ON loading_slips(slip_number);
CREATE INDEX IF NOT EXISTS idx_loading_slip_items_slip_id ON loading_slip_items(slip_id);

-- Enable RLS
ALTER TABLE loading_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE loading_slip_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loading_slips
CREATE POLICY "Users can view all loading slips"
  ON loading_slips FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert loading slips"
  ON loading_slips FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update loading slips"
  ON loading_slips FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete loading slips"
  ON loading_slips FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for loading_slip_items
CREATE POLICY "Users can view all loading slip items"
  ON loading_slip_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert loading slip items"
  ON loading_slip_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update loading slip items"
  ON loading_slip_items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete loading slip items"
  ON loading_slip_items FOR DELETE
  TO authenticated
  USING (true);

-- Add updated_at trigger for loading_slips
CREATE OR REPLACE FUNCTION update_loading_slips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_loading_slips_updated_at
  BEFORE UPDATE ON loading_slips
  FOR EACH ROW
  EXECUTE FUNCTION update_loading_slips_updated_at();

-- Add updated_at trigger for loading_slip_items
CREATE OR REPLACE FUNCTION update_loading_slip_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_loading_slip_items_updated_at
  BEFORE UPDATE ON loading_slip_items
  FOR EACH ROW
  EXECUTE FUNCTION update_loading_slip_items_updated_at();
