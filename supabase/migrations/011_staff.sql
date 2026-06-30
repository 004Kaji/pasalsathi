create table if not exists staff (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  pin_hash    text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table staff enable row level security;

create policy "Owner manages their staff"
  on staff using (
    business_id in (select id from businesses where owner_id = auth.uid())
  );
