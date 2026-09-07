-- Direção da transferência com caixinha: to_goal (aporte) | from_goal (resgate)
alter table public.fluxo_transactions
  add column if not exists goal_direction text;

alter table public.fluxo_transactions
  drop constraint if exists fluxo_transactions_goal_direction_check;

alter table public.fluxo_transactions
  add constraint fluxo_transactions_goal_direction_check
  check (goal_direction is null or goal_direction in ('to_goal', 'from_goal'));
