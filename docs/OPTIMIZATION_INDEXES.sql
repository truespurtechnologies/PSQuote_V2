-- Database Optimization Indexes
-- This file contains recommended indexes for performance optimization

-- Quotations table indexes
-- Primary index for user-specific queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_created_by 
ON public.quotations(created_by);

-- Composite index for user quotations ordered by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_created_by_date 
ON public.quotations(created_by, created_at DESC);

-- Index for quotation number lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_number 
ON public.quotations(quotation_number);

-- Index for customer searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_customer_name 
ON public.quotations(customer_name);

-- Index for status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_status 
ON public.quotations(status);

-- Quotation items table indexes
-- Index for items by quotation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotation_items_quotation_id 
ON public.quotation_items(quotation_id);

-- Products table indexes
-- Index for active products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_active 
ON public.products(is_active) WHERE is_active = true;

-- Index for product searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_item_name 
ON public.products(item_name);

-- Index for product code searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_item_code 
ON public.products(item_code);

-- Composite index for product listings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_name 
ON public.products(is_active, item_name) WHERE is_active = true;

-- Profiles table indexes
-- Index for username lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_username 
ON public.profiles(username);

-- Index for email lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email 
ON public.profiles(email);

-- Index for role-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role 
ON public.profiles(role);

-- Composite index for active users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_active_role 
ON public.profiles(is_active, role) WHERE is_active = true;

-- Customers table indexes
-- Index for customer searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_name 
ON public.customers(name);

-- Index for phone searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_phone 
ON public.customers(phone);

-- Index for GSTIN searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_gstin 
ON public.customers(gstin);

-- Composite index for active customers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_active_name 
ON public.customers(is_active, name) WHERE is_active = true;

-- Loading slips table indexes (if exists)
-- Note: These indexes are already created in the migration file
-- Index for loading slip by slip number (already exists)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loading_slips_slip_number 
-- ON public.loading_slips(slip_number);

-- Index for loading slip dates (already exists)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loading_slips_created_at 
-- ON public.loading_slips(created_at DESC);

-- Additional indexes for loading slips if needed
-- Index for loading slips by creator
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loading_slips_created_by 
ON public.loading_slips(created_by);

-- Composite index for user loading slips ordered by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loading_slips_created_by_date 
ON public.loading_slips(created_by, created_at DESC);

-- Loading slip items table indexes
-- Index for items by slip (already exists in migration)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loading_slip_items_slip_id 
-- ON public.loading_slip_items(slip_id);

-- Index for items by product
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loading_slip_items_product_id 
ON public.loading_slip_items(product_id);

-- Index for item names
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loading_slip_items_item_name 
ON public.loading_slip_items(item_name);

-- Maintenance queries
-- Analyze tables after creating indexes
ANALYZE public.quotations;
ANALYZE public.quotation_items;
ANALYZE public.products;
ANALYZE public.profiles;
ANALYZE public.customers;
ANALYZE public.loading_slips;
ANALYZE public.loading_slip_items;

-- Check index usage
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_scan DESC;

-- Monitor slow queries
-- SELECT query, mean_time, calls, total_time
-- FROM pg_stat_statements 
-- WHERE mean_time > 100 
-- ORDER BY mean_time DESC 
-- LIMIT 10;
