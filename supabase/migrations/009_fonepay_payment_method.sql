-- Add fonepay to the transactions payment_method CHECK constraint
alter table transactions
  drop constraint transactions_payment_method_check;

alter table transactions
  add constraint transactions_payment_method_check
    check (payment_method in ('cash', 'khata', 'esewa', 'khalti', 'fonepay'));
