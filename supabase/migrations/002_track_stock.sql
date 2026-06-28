-- Phase 2: Add track_stock to businesses table
-- Run this in Supabase SQL Editor

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS track_stock boolean DEFAULT true;
