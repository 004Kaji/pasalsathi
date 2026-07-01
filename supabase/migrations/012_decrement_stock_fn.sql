-- Atomic stock decrement — avoids SELECT + UPDATE round trip
-- Called from the app as supabase.rpc('decrement_stock', { product_id, qty })
create or replace function decrement_stock(product_id uuid, qty integer)
returns void
language sql
security definer
as $$
  update products
  set    stock = greatest(0, stock - qty)
  where  id = product_id;
$$;
