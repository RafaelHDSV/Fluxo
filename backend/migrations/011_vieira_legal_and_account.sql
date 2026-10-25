-- Aceite legal, exportação e exclusão de dados por app no projects-v1.
-- Board: RafaelHDSV/board#8 e #12.
--
-- Objetos compartilhados por forge, fluxo, booker e vital: esta migration é idempotente e a
-- mesma versão vive em cada app; qualquer um pode aplicá-la primeiro. Mudança aqui = mudança nos 4.
-- As funções são security definer porque a Edge Function do vital chama com service_role, que não
-- tem permissão em auth.users; por isso a execução fica fechada para anon e authenticated.

create table if not exists public.vieira_legal_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  app text not null check (app in ('forge', 'fluxo', 'booker', 'vital')),
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now(),
  health_consent_version text,
  health_consent_at timestamptz,
  health_consent_revoked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, app)
);

alter table public.vieira_legal_acceptances enable row level security;

drop policy if exists vieira_legal_acceptances_select_own on public.vieira_legal_acceptances;
create policy vieira_legal_acceptances_select_own on public.vieira_legal_acceptances
  for select to authenticated using (user_id = auth.uid());

drop policy if exists vieira_legal_acceptances_insert_own on public.vieira_legal_acceptances;
create policy vieira_legal_acceptances_insert_own on public.vieira_legal_acceptances
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists vieira_legal_acceptances_update_own on public.vieira_legal_acceptances;
create policy vieira_legal_acceptances_update_own on public.vieira_legal_acceptances
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Tabelas do app com dados do usuário: prefixo "<app>_", coluna user_id uuid, fora as de controle.
create or replace function public.vieira_app_user_tables(p_app text)
returns table (table_name text)
language sql
stable
set search_path = public, pg_catalog
as $$
  select c.relname::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attname = 'user_id' and not a.attisdropped
  join pg_type t on t.oid = a.atttypid and t.typname = 'uuid'
  where n.nspname = 'public'
    and c.relkind = 'r'
    and p_app in ('forge', 'fluxo', 'booker', 'vital')
    and left(c.relname, length(p_app) + 1) = p_app || '_'
    and c.relname not like '%\_schema\_migrations' escape '\'
  order by c.relname;
$$;

create or replace function public.vieira_export_app_data(p_app text, p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_catalog
as $$
declare
  v_table text;
  v_rows jsonb;
  v_tables jsonb := '{}'::jsonb;
begin
  if p_app not in ('forge', 'fluxo', 'booker', 'vital') then
    raise exception 'app inválido: %', p_app;
  end if;

  for v_table in select table_name from public.vieira_app_user_tables(p_app) loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t where t.user_id = $1',
      v_table
    )
    into v_rows
    using p_user_id;
    v_tables := v_tables || jsonb_build_object(v_table, v_rows);
  end loop;

  select coalesce(jsonb_agg(to_jsonb(l) - 'user_id'), '[]'::jsonb)
  into v_rows
  from public.vieira_legal_acceptances l
  where l.user_id = p_user_id and l.app = p_app;

  return jsonb_build_object(
    'app', p_app,
    'exported_at', now(),
    'legal_acceptances', v_rows,
    'tables', v_tables
  );
end;
$$;

-- Apaga os dados do usuário em um app. Se não sobrar dado dele em nenhum app do projects-v1,
-- remove também o usuário do Auth e o espelho de cadastro do vieira-center.
create or replace function public.vieira_delete_app_data(
  p_app text,
  p_user_id uuid,
  p_protected_emails text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_email text;
  v_table text;
  v_count bigint;
  v_deleted bigint := 0;
  v_progress boolean;
  v_pass int;
  v_remaining bigint := 0;
  v_other_app text;
  v_auth_deleted boolean := false;
begin
  if p_app not in ('forge', 'fluxo', 'booker', 'vital') then
    raise exception 'app inválido: %', p_app;
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = p_user_id;

  if v_email is not null and exists (
    select 1 from unnest(coalesce(p_protected_emails, '{}')) as p(email)
    where lower(trim(p.email)) = v_email
  ) then
    raise exception 'protected_account' using errcode = 'P0001';
  end if;

  -- Várias passadas: a ordem das FKs entre tabelas do app não é conhecida.
  for v_pass in 1..16 loop
    v_progress := false;
    for v_table in select table_name from public.vieira_app_user_tables(p_app) loop
      begin
        execute format('delete from public.%I where user_id = $1', v_table) using p_user_id;
        get diagnostics v_count = row_count;
        if v_count > 0 then
          v_deleted := v_deleted + v_count;
          v_progress := true;
        end if;
      exception
        when foreign_key_violation then null;
      end;
    end loop;
    exit when not v_progress;
  end loop;

  for v_table in select table_name from public.vieira_app_user_tables(p_app) loop
    execute format('select count(*) from public.%I where user_id = $1', v_table) into v_count using p_user_id;
    if v_count > 0 then
      raise exception 'falha na exclusão: restaram % linha(s) em %', v_count, v_table;
    end if;
  end loop;

  delete from public.vieira_legal_acceptances where user_id = p_user_id and app = p_app;

  foreach v_other_app in array array['forge', 'fluxo', 'booker', 'vital'] loop
    for v_table in select table_name from public.vieira_app_user_tables(v_other_app) loop
      execute format('select count(*) from public.%I where user_id = $1', v_table) into v_count using p_user_id;
      v_remaining := v_remaining + v_count;
    end loop;
  end loop;

  select v_remaining + count(*) into v_remaining
  from public.vieira_legal_acceptances where user_id = p_user_id;

  if v_remaining = 0 then
    if to_regclass('public.vieira_center_signups') is not null then
      execute 'delete from public.vieira_center_signups where user_id = $1' using p_user_id;
    end if;
    delete from auth.users where id = p_user_id;
    v_auth_deleted := found;
  end if;

  return jsonb_build_object('deleted_rows', v_deleted, 'auth_user_deleted', v_auth_deleted);
end;
$$;

revoke all on function public.vieira_app_user_tables(text) from public, anon, authenticated;
revoke all on function public.vieira_export_app_data(text, uuid) from public, anon, authenticated;
revoke all on function public.vieira_delete_app_data(text, uuid, text[]) from public, anon, authenticated;
grant execute on function public.vieira_app_user_tables(text) to service_role;
grant execute on function public.vieira_export_app_data(text, uuid) to service_role;
grant execute on function public.vieira_delete_app_data(text, uuid, text[]) to service_role;

comment on function public.vieira_export_app_data(text, uuid) is
  'Exporta em jsonb os dados de um usuário em um app do projects-v1 (#12). Só service_role e postgres.';
comment on function public.vieira_delete_app_data(text, uuid, text[]) is
  'Apaga os dados de um usuário em um app; remove o Auth se não sobrar dado em nenhum app (#12). Só service_role e postgres.';
