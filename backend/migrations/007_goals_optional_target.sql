-- Valor alvo opcional nas caixinhas (investimentos): permite target_amount = 0
alter table public.fluxo_goals
  drop constraint if exists fluxo_goals_target_amount_check;

alter table public.fluxo_goals
  add constraint fluxo_goals_target_amount_check
  check (target_amount >= 0);
