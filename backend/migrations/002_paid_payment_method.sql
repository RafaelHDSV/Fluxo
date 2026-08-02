-- paid + payment_method + source_ref; seed alinhado às categorias Notion

alter table public.fluxo_transactions
  add column if not exists paid boolean not null default true;

alter table public.fluxo_transactions
  add column if not exists payment_method text
    check (payment_method is null or payment_method in ('debit', 'credit'));

alter table public.fluxo_transactions
  add column if not exists source_ref text;

create unique index if not exists fluxo_transactions_user_source_ref_uidx
  on public.fluxo_transactions (user_id, source_ref)
  where source_ref is not null;

create or replace function public.fluxo_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.fluxo_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.fluxo_categories (user_id, name, kind, color) values
    (new.id, 'Alimentação', 'expense', '#E6B450'),
    (new.id, 'Consumo & Compras', 'expense', '#FF8F70'),
    (new.id, 'Custos Fixos', 'expense', '#F07178'),
    (new.id, 'Desenvolvimento Pessoal & Profissional', 'expense', '#C3A6FF'),
    (new.id, 'Estilo de Vida & Lazer', 'expense', '#5B8DEF'),
    (new.id, 'Financeiro Estratégico', 'expense', '#3DDC97'),
    (new.id, 'Outros', 'both', '#8B9AAB'),
    (new.id, 'Social & Afetivo', 'expense', '#7AD7F0'),
    (new.id, 'Transporte & Mobilidade', 'expense', '#5B8DEF'),
    (new.id, 'Salário', 'income', '#3DDC97'),
    (new.id, 'Freelance', 'income', '#5B8DEF')
  on conflict (user_id, name) do nothing;

  return new;
end;
$$;
