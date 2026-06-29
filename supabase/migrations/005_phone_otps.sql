-- Phone OTP table for Sparrow SMS authentication
-- Auth infrastructure — separate from the 5 business tables in 004_clean_schema.sql
-- Only accessible via service role key (createAdminClient). No RLS needed.

create extension if not exists "uuid-ossp";

create table if not exists phone_otps (
  id         uuid        primary key default uuid_generate_v4(),
  phone      text        not null,
  otp        text        not null,
  used       boolean     not null default false,
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

-- Fast lookup by phone + unused status
create index if not exists idx_phone_otps_phone_used on phone_otps (phone, used);
