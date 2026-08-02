-- Fluxo MVP schema + RLS (run in Supabase SQL Editor)

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking', 'wallet', 'investment', 'credit_card', 'external')),
  balance numeric(14, 2) not null default 0,
  credit_limit numeric(14, 2),
  due_day int check (due_day is null or (due_day >= 1 and due_day <= 31)),
  closing_day int check (closing_day is null or (closing_day >= 1 and closing_day <= 31)),
  color text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense', 'both')),
  color text,
  icon text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  match_type text not null check (match_type in ('contains', 'recurring', 'source')),
  pattern text not null,
  priority int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  description text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  type text not null check (type in ('income', 'expense', 'transfer', 'adjustment')),
  category_id uuid not null references public.categories (id),
  account_id uuid not null references public.accounts (id),
  transfer_account_id uuid references public.accounts (id),
  card_account_id uuid references public.accounts (id),
  tags text[] not null default '{}',
  notes text,
  dedupe_hash text not null,
  external_fitid text,
  import_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists transactions_user_dedupe_uidx
  on public.transactions (user_id, dedupe_hash);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month date not null,
  amount_limit numeric(14, 2) not null check (amount_limit >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  deadline date,
  account_id uuid references public.accounts (id),
  created_at timestamptz not null default now()
);

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  filename text not null,
  source_type text not null check (source_type in ('csv', 'ofx')),
  status text not null default 'pending'
    check (status in ('pending', 'preview', 'committed', 'cancelled')),
  storage_path text,
  account_id uuid references public.accounts (id),
  created_at timestamptz not null default now()
);

alter table public.transactions
  drop constraint if exists transactions_import_id_fkey;
alter table public.transactions
  add constraint transactions_import_id_fkey
  foreign key (import_id) references public.imports (id) on delete set null;

create table if not exists public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.imports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  raw jsonb not null,
  date date,
  description text,
  amount numeric(14, 2),
  type text,
  external_fitid text,
  dedupe_hash text,
  suggested_category_id uuid references public.categories (id),
  is_duplicate boolean not null default false,
  selected boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.category_rules enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.imports enable row level security;
alter table public.import_rows enable row level security;

create policy profiles_own on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy accounts_own on public.accounts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy categories_own on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy category_rules_own on public.category_rules
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy transactions_own on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy budgets_own on public.budgets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy goals_own on public.goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy imports_own on public.imports
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy import_rows_own on public.import_rows
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.categories (user_id, name, kind, color) values
    (new.id, 'Moradia', 'expense', '#F07178'),
    (new.id, 'Alimentação', 'expense', '#E6B450'),
    (new.id, 'Transporte', 'expense', '#5B8DEF'),
    (new.id, 'Saúde', 'expense', '#3DDC97'),
    (new.id, 'Educação', 'expense', '#C3A6FF'),
    (new.id, 'Lazer', 'expense', '#FF8F70'),
    (new.id, 'Assinaturas', 'expense', '#7AD7F0'),
    (new.id, 'Investimentos', 'both', '#3DDC97'),
    (new.id, 'Dívidas', 'expense', '#F07178'),
    (new.id, 'Viagens', 'expense', '#5B8DEF'),
    (new.id, 'Outros', 'both', '#8B9AAB'),
    (new.id, 'Salário', 'income', '#3DDC97'),
    (new.id, 'Freelance', 'income', '#5B8DEF');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
