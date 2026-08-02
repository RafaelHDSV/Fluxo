-- Data de vencimento da fatura (crédito); compra fica em date
alter table public.fluxo_transactions
  add column if not exists due_date date;

create index if not exists fluxo_transactions_user_due_date_idx
  on public.fluxo_transactions (user_id, due_date)
  where due_date is not null;
