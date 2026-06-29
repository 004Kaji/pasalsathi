-- Add referral fields to businesses
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS referral_code  text UNIQUE,
  ADD COLUMN IF NOT EXISTS months_earned  integer NOT NULL DEFAULT 0;

-- Referrals table: one row per successful referral
CREATE TABLE IF NOT EXISTS referrals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  referee_id  uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referee_id)
);
