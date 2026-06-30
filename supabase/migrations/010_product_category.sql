-- Add optional category column to products for filtering in POS
alter table products add column if not exists category text default null;
