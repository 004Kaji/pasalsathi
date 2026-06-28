-- Phase 2: Add item_type to products table
-- Run this in Supabase SQL Editor

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS item_type text DEFAULT 'product';

-- Existing rows get 'product' by default
UPDATE products SET item_type = 'product' WHERE item_type IS NULL;
