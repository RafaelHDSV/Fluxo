-- Regras de rename de descrição na importação + original_description nas rows

create table if not exists public.fluxo_description_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pattern text not null,
  replacement text not null,
  match_type text not null default 'contains'
    check (match_type in ('contains')),
  priority int not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists fluxo_description_rules_user_idx
  on public.fluxo_description_rules (user_id, priority, created_at);

alter table public.fluxo_description_rules enable row level security;

drop policy if exists fluxo_description_rules_own on public.fluxo_description_rules;
create policy fluxo_description_rules_own on public.fluxo_description_rules
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.fluxo_import_rows
  add column if not exists original_description text;
