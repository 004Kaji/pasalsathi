ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS pan_number          text,
  ADD COLUMN IF NOT EXISTS vat_number          text,
  ADD COLUMN IF NOT EXISTS business_reg_number text;
