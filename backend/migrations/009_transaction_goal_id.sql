-- Vínculo transação → caixinha (aporte/resgate)
alter table public.fluxo_transactions
  add column if not exists goal_id uuid references public.fluxo_goals (id) on delete set null;

create index if not exists fluxo_transactions_user_goal_idx
  on public.fluxo_transactions (user_id, goal_id)
  where goal_id is not null;
