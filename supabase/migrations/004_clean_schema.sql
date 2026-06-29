-- =============================================================
-- PasalSathi — Clean Schema Reset
-- Migration: 004_clean_schema.sql
--
-- PURPOSE:
--   Drop all existing tables and replace them with the simplified
--   5-table schema. This is a full reset — run only on a fresh
--   database or a dev database you are willing to wipe.
--
-- TABLES:
--   businesses, products, customers, transactions, khata_entries
--
-- NOTE on owner_id:
--   The businesses spec does not list owner_id, but Row Level Security
--   requires a way to know which auth user owns which business.
--   owner_id (references auth.users) is added as a mandatory field.
-- =============================================================


-- =============================================================
-- STEP 1: Drop existing tables (child tables first)
-- =============================================================

drop table if exists audit_logs          cascade;
drop table if exists supplier_entries    cascade;
drop table if exists suppliers           cascade;
drop table if exists salary_payments     cascade;
drop table if exists attendance          cascade;
drop table if exists staff               cascade;
drop table if exists stock_movements     cascade;
drop table if exists business_users      cascade;
drop table if exists sms_logs            cascade;
drop table if exists payment_history     cascade;
drop table if exists khata_entries       cascade;
drop table if exists transactions        cascade;
drop table if exists customers           cascade;
drop table if exists products            cascade;
drop table if exists branches            cascade;
drop table if exists businesses          cascade;

-- Drop the old helper function if it exists
drop function if exists get_user_business_ids();
drop function if exists auth_user_owns_business(uuid);


-- =============================================================
-- STEP 2: Enable the UUID extension
-- =============================================================

create extension if not exists "uuid-ossp";


-- =============================================================
-- STEP 3: Create tables
-- =============================================================

-- TABLE: businesses
-- One row per merchant. owner_id links to Supabase auth.users.
create table businesses (
  id          uuid        primary key default uuid_generate_v4(),
  owner_id    uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  phone       text,
  address     text,
  created_at  timestamptz not null default now()
);

-- TABLE: products
-- Items or services the business sells.
-- unit: piece | kg | litre | box | dozen
-- type: product (has stock) | service (no stock)
create table products (
  id           uuid           primary key default uuid_generate_v4(),
  business_id  uuid           not null references businesses(id) on delete cascade,
  name         text           not null,
  price        decimal(10,2)  not null,
  unit         text           not null default 'piece',
  type         text           not null default 'product',
  stock        decimal(10,2)  not null default 0,
  track_stock  boolean        not null default true,
  created_at   timestamptz    not null default now()
);

-- TABLE: customers
-- People who buy from the business or carry a khata balance.
-- balance: positive = customer owes money, negative = overpaid
create table customers (
  id           uuid           primary key default uuid_generate_v4(),
  business_id  uuid           not null references businesses(id) on delete cascade,
  name         text           not null,
  phone        text,
  address      text,
  balance      decimal(10,2)  not null default 0,
  created_at   timestamptz    not null default now()
);

-- TABLE: transactions
-- Every income (sale) or expense recorded by the business.
-- type: 'income' | 'expense'
-- payment_method: 'cash' | 'khata' | 'esewa' | 'khalti'
create table transactions (
  id              uuid           primary key default uuid_generate_v4(),
  business_id     uuid           not null references businesses(id) on delete cascade,
  type            text           not null,
  amount          decimal(10,2)  not null,
  item_name       text           not null,
  product_id      uuid           references products(id) on delete set null,
  payment_method  text           not null default 'cash',
  customer_id     uuid           references customers(id) on delete set null,
  created_at      timestamptz    not null default now(),

  -- Database-level guard: only valid types allowed
  constraint transactions_type_check
    check (type in ('income', 'expense')),

  -- Guard: only valid payment methods allowed
  constraint transactions_payment_method_check
    check (payment_method in ('cash', 'khata', 'esewa', 'khalti'))
);

-- TABLE: khata_entries
-- Ledger: tracks credit given to a customer and payments received.
-- type: 'credit' = money given on credit, 'payment' = customer paid back
-- transaction_id: links to the sale transaction that created the credit (nullable)
create table khata_entries (
  id              uuid           primary key default uuid_generate_v4(),
  business_id     uuid           not null references businesses(id) on delete cascade,
  customer_id     uuid           not null references customers(id) on delete cascade,
  amount          decimal(10,2)  not null,
  type            text           not null,
  transaction_id  uuid           references transactions(id) on delete set null,
  created_at      timestamptz    not null default now(),

  constraint khata_entries_type_check
    check (type in ('credit', 'payment'))
);


-- =============================================================
-- STEP 4: Row Level Security — enable on all tables
-- =============================================================

alter table businesses    enable row level security;
alter table products      enable row level security;
alter table customers     enable row level security;
alter table transactions  enable row level security;
alter table khata_entries enable row level security;


-- =============================================================
-- STEP 5: Helper function — checks if the current auth user
--   owns the given business. Used in RLS policies for child tables.
--   security definer: runs as the function owner (bypasses RLS on
--   businesses so the lookup always works).
-- =============================================================

create function auth_user_owns_business(business_uuid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from businesses
    where id = business_uuid
      and owner_id = auth.uid()
  )
$$;


-- =============================================================
-- STEP 6: RLS policies
--   businesses: select/insert/update/delete own rows only
--   all child tables: only if business belongs to current user
-- =============================================================

-- businesses: user can only access rows where they are the owner
create policy "businesses_owner_all"
  on businesses
  for all
  using     (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- products: access if the parent business belongs to the user
create policy "products_owner_all"
  on products
  for all
  using     (auth_user_owns_business(business_id))
  with check (auth_user_owns_business(business_id));

-- customers: same pattern
create policy "customers_owner_all"
  on customers
  for all
  using     (auth_user_owns_business(business_id))
  with check (auth_user_owns_business(business_id));

-- transactions: same pattern
create policy "transactions_owner_all"
  on transactions
  for all
  using     (auth_user_owns_business(business_id))
  with check (auth_user_owns_business(business_id));

-- khata_entries: same pattern
create policy "khata_entries_owner_all"
  on khata_entries
  for all
  using     (auth_user_owns_business(business_id))
  with check (auth_user_owns_business(business_id));


-- =============================================================
-- STEP 7: Indexes for performance
--   Every list/filter query hits business_id.
--   Khata queries also filter by customer_id.
--   All list views sort by created_at desc.
-- =============================================================

-- business_id indexes (most common filter)
create index idx_products_business_id       on products      (business_id);
create index idx_customers_business_id      on customers     (business_id);
create index idx_transactions_business_id   on transactions  (business_id);
create index idx_khata_entries_business_id  on khata_entries (business_id);

-- customer_id index (khata: "show all entries for this customer")
create index idx_khata_entries_customer_id  on khata_entries (customer_id);

-- customer_id on transactions (filter sales by customer)
create index idx_transactions_customer_id   on transactions  (customer_id);

-- created_at indexes for descending sort in list views
create index idx_products_created_at        on products      (created_at desc);
create index idx_customers_created_at       on customers     (created_at desc);
create index idx_transactions_created_at    on transactions  (created_at desc);
create index idx_khata_entries_created_at   on khata_entries (created_at desc);
