-- PasalSathi Migration: Add missing columns + new tables from full spec
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. BUSINESSES — add missing columns
-- ============================================================
alter table businesses
  add column if not exists name_nepali text,
  add column if not exists rent_per_month numeric(12,2) default 0,
  add column if not exists working_days_per_month int default 26;

-- ============================================================
-- 2. TRANSACTIONS — add bs_date, soft delete, new categories/methods
-- ============================================================
alter table transactions
  add column if not exists bs_date text,
  add column if not exists is_deleted boolean default false,
  add column if not exists deleted_at timestamptz;

-- Backfill bs_date for existing rows (store as YYYY-MM-DD AD for now, fix via app later)
update transactions set bs_date = transaction_date::text where bs_date is null;

-- ============================================================
-- 3. CUSTOMERS — add missing columns
-- ============================================================
alter table customers
  add column if not exists photo_url text,
  add column if not exists credit_limit numeric(12,2) default 0,
  add column if not exists is_active boolean default true;

-- ============================================================
-- 4. KHATA_ENTRIES — add bs_date
-- ============================================================
alter table khata_entries
  add column if not exists bs_date text;

update khata_entries set bs_date = entry_date::text where bs_date is null;

-- ============================================================
-- 5. PRODUCTS — add missing columns
-- ============================================================
alter table products
  add column if not exists supplier_id uuid references suppliers(id) on delete set null,
  add column if not exists name_nepali text,
  add column if not exists wholesale_price numeric(12,2) default 0,
  add column if not exists expiry_date date,
  add column if not exists bs_date text;

-- ============================================================
-- 6. STOCK_MOVEMENTS — add missing columns
-- ============================================================
alter table stock_movements
  add column if not exists supplier_id uuid references suppliers(id) on delete set null,
  add column if not exists customer_id uuid references customers(id) on delete set null,
  add column if not exists discount_percent numeric(5,2) default 0,
  add column if not exists bs_date text;

update stock_movements set bs_date = movement_date::text where bs_date is null;

-- ============================================================
-- 7. STAFF — add missing columns
-- ============================================================
alter table staff
  add column if not exists photo_url text,
  add column if not exists max_discount_percent numeric(5,2) default 0;

-- ============================================================
-- 8. ATTENDANCE — add bs_date, marked_by, leave status
-- ============================================================
alter table attendance
  add column if not exists bs_date text,
  add column if not exists marked_by uuid references auth.users(id);

update attendance set bs_date = attendance_date::text where bs_date is null;

-- ============================================================
-- 9. SALARY_PAYMENTS — add bs fields and salary slip url
-- ============================================================
alter table salary_payments
  add column if not exists bs_month int,
  add column if not exists bs_year int,
  add column if not exists salary_slip_url text;

-- Backfill bs_month/bs_year from existing month/year columns
update salary_payments set bs_month = month, bs_year = year
  where bs_month is null and month is not null;

-- ============================================================
-- 10. SMS_LOGS — add type column
-- ============================================================
alter table sms_logs
  add column if not exists type text;
-- type values: khata_reminder, payment_received, supplier_payment, salary_paid, trial_ending

-- ============================================================
-- 11. NEW TABLE: BUSINESS_USERS
-- ============================================================
create table if not exists business_users (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'staff', -- owner, manager, staff
  max_discount_percent numeric(5,2) default 0,
  can_view_hisab boolean default true,
  can_view_khata boolean default true,
  can_view_godam boolean default true,
  can_view_staff boolean default false,
  can_view_report boolean default false,
  created_at timestamptz default now(),
  unique(business_id, user_id)
);

-- ============================================================
-- 12. NEW TABLE: SUPPLIERS
-- ============================================================
create table if not exists suppliers (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  product_categories text,
  notes text,
  total_credit_taken numeric(12,2) default 0,
  total_paid numeric(12,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 13. NEW TABLE: SUPPLIER_ENTRIES
-- ============================================================
create table if not exists supplier_entries (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete cascade,
  type text not null, -- credit_taken, payment_made
  amount numeric(12,2) not null,
  description text,
  due_date date,
  bs_date text not null,
  entry_date date not null default current_date,
  sms_sent boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ============================================================
-- 14. NEW TABLE: AUDIT_LOGS
-- ============================================================
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) on delete cascade,
  table_name text not null,
  record_id uuid not null,
  action text not null, -- create, update, delete
  old_values jsonb,
  new_values jsonb,
  changed_by uuid references auth.users(id),
  changed_at timestamptz default now()
);

-- ============================================================
-- 15. FOREIGN KEY: products.supplier_id (add after suppliers table exists)
-- ============================================================
-- Already added above in step 5, but guard against ordering issues:
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'products' and column_name = 'supplier_id'
  ) then
    alter table products add column supplier_id uuid references suppliers(id) on delete set null;
  end if;
end $$;

-- ============================================================
-- 16. RLS — enable on new tables
-- ============================================================
alter table business_users enable row level security;
alter table suppliers enable row level security;
alter table supplier_entries enable row level security;
alter table audit_logs enable row level security;

-- ============================================================
-- 17. HELPER FUNCTION — get all business IDs for current user
-- ============================================================
create or replace function get_user_business_ids()
returns setof uuid as $$
  select id from businesses where owner_id = auth.uid()
  union
  select business_id from business_users where user_id = auth.uid()
$$ language sql security definer;

-- ============================================================
-- 18. RLS POLICIES — new tables
-- ============================================================

-- business_users
drop policy if exists "business_users_isolation" on business_users;
create policy "business_users_isolation" on business_users
  for all using (business_id in (select get_user_business_ids()));

-- suppliers
drop policy if exists "suppliers_isolation" on suppliers;
create policy "suppliers_isolation" on suppliers
  for all using (business_id in (select get_user_business_ids()));

-- supplier_entries
drop policy if exists "supplier_entries_isolation" on supplier_entries;
create policy "supplier_entries_isolation" on supplier_entries
  for all using (business_id in (select get_user_business_ids()));

-- audit_logs
drop policy if exists "audit_logs_isolation" on audit_logs;
create policy "audit_logs_isolation" on audit_logs
  for all using (business_id in (select get_user_business_ids()));

-- ============================================================
-- 19. INDEXES — for performance
-- ============================================================
create index if not exists idx_transactions_bs_date on transactions(business_id, bs_date);
create index if not exists idx_khata_entries_customer on khata_entries(customer_id, entry_date);
create index if not exists idx_supplier_entries_supplier on supplier_entries(supplier_id, entry_date);
create index if not exists idx_audit_logs_business on audit_logs(business_id, changed_at);
create index if not exists idx_stock_movements_bs on stock_movements(business_id, bs_date);
create index if not exists idx_attendance_bs on attendance(business_id, bs_date);
