# How to Apply Database Migrations

**Issue:** Quotation save failing because database schema doesn't match code expectations.

**Root Cause:** The migrations created in Phase 1 haven't been applied to your Supabase database yet.

---

## 🚨 Required Migrations

You need to apply these 3 migration files:

1. **20260620000000_fix_quotations_schema_safe.sql** - Renames `user_id` to `created_by` in quotations table
2. **20260620000001_fix_duplicate_products_policies.sql** - Fixes duplicate RLS policies on products
3. **20260620000002_restrict_profile_access.sql** - Restricts profile access for privacy

---

## 📋 Option 1: Apply via Supabase Dashboard (Recommended)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run Each Migration
Run these migrations **in order**:

#### Migration 1: Fix Quotations Schema
```sql
-- Migration: Fix quotations table schema (SAFE VERSION)
-- Issue: Column name mismatch - table uses 'user_id' but RLS policies reference 'created_by'
-- Solution: Rename user_id to created_by for consistency across all tables
-- Date: 2026-06-20

-- Check if user_id exists and rename it, otherwise skip
DO $$
BEGIN
    -- Check if user_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quotations' 
        AND column_name = 'user_id'
    ) THEN
        -- Rename user_id to created_by
        ALTER TABLE public.quotations RENAME COLUMN user_id TO created_by;
        RAISE NOTICE 'Column user_id renamed to created_by';
        
        -- Update the index
        DROP INDEX IF EXISTS idx_quotations_user_id;
        CREATE INDEX idx_quotations_created_by ON public.quotations(created_by);
        RAISE NOTICE 'Index updated';
    ELSE
        RAISE NOTICE 'Column user_id does not exist - likely already renamed to created_by';
    END IF;
END $$;

-- Drop existing policies (they may reference either user_id or created_by)
DROP POLICY IF EXISTS "Users can view their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can insert their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can update their own quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users can delete their own quotations" ON public.quotations;

-- Recreate RLS policies with correct column reference (created_by)
CREATE POLICY "Users can view their own quotations" 
ON public.quotations 
FOR SELECT 
TO authenticated 
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own quotations" 
ON public.quotations 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own quotations" 
ON public.quotations 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own quotations" 
ON public.quotations 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Add comment for documentation
COMMENT ON COLUMN public.quotations.created_by IS 'User ID of the quotation creator (references auth.users.id)';
```

#### Migration 2: Fix Duplicate Products Policies
```sql
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
```

#### Migration 3: Restrict Profile Access
```sql
-- Migration: Restrict Profile Access
-- Date: 2026-06-20
-- Purpose: Change profiles RLS policy from public to authenticated-only for privacy

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;

-- Create restricted policy - users can only read their own profile
CREATE POLICY "Users can read own profile" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Note: Service role key can still read all profiles for admin operations
-- This is implicit with service role and doesn't require a policy
```

### Step 3: Verify Migrations
After running each migration, check for success messages in the SQL Editor output.

---

## 📋 Option 2: Apply via Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to project directory
cd d:\Mine\BusinessOfficial\PopularSteels\PSQuoteApp_Revised\PSQuote_V2

# Link to your Supabase project (if not already linked)
npx supabase link --project-ref <your-project-ref>

# Apply migrations
npx supabase db push
```

---

## 🔍 Verify Migrations Were Applied

Run this query in Supabase SQL Editor to check:

```sql
-- Check if quotations table has created_by column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'quotations'
AND column_name IN ('user_id', 'created_by');

-- Should show 'created_by' only, not 'user_id'
```

---

## ⚠️ Important Notes

1. **Backup First:** These migrations are safe, but it's always good practice to backup your database before running migrations.

2. **Order Matters:** Run migrations in the order listed above.

3. **No Data Loss:** These migrations only modify schema and policies, not data.

4. **RLS Policies:** The migrations update Row Level Security policies to ensure proper access control.

---

## 🐛 After Applying Migrations

Once migrations are applied, your quotation save should work correctly because:

1. ✅ `quotations` table will have `created_by` column (matching the code)
2. ✅ RLS policies will reference `created_by` (matching quotation_items policies)
3. ✅ The foreign key check in quotation_items RLS will pass

---

## 🆘 If You Still Get Errors

If errors persist after applying migrations, check:

1. **User Authentication:** Ensure you're logged in and `user?.id` is not null
2. **Quotation Insert:** Verify the quotation was successfully inserted before trying to insert items
3. **Console Logs:** Check browser console for more detailed error messages

Run this query to debug:

```sql
-- Check current user
SELECT auth.uid();

-- Check quotations table structure
\d public.quotations

-- Check quotation_items RLS policies
SELECT * FROM pg_policies WHERE tablename = 'quotation_items';
```

---

**Created:** June 20, 2026  
**Status:** Ready to Apply
