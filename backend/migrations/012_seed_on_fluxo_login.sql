-- Perfil e categorias padrão só no primeiro uso do Fluxo, não no INSERT de auth.users.
-- O projects-v1 compartilha Auth entre forge, fluxo, booker e vital: o trigger global
-- criava linhas fluxo_* para qualquer cadastro (board#12 — exclusão no Booker não
-- removia o usuário Auth porque restavam 11 categorias do Fluxo).
-- Board: RafaelHDSV/board#12.

drop trigger if exists fluxo_on_auth_user_created on auth.users;

drop function if exists public.fluxo_handle_new_user();

create or replace function public.fluxo_ensure_user(p_user_id uuid, p_email text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'fluxo_ensure_user: p_user_id nulo';
  end if;

  if exists (select 1 from public.fluxo_profiles where id = p_user_id) then
    return;
  end if;

  insert into public.fluxo_profiles (id, display_name)
  values (
    p_user_id,
    coalesce(nullif(split_part(coalesce(p_email, ''), '@', 1), ''), 'Usuário')
  )
  on conflict (id) do nothing;

  insert into public.fluxo_categories (user_id, name, kind, color) values
    (p_user_id, 'Alimentação', 'expense', '#E6B450'),
    (p_user_id, 'Consumo & Compras', 'expense', '#FF8F70'),
    (p_user_id, 'Custos Fixos', 'expense', '#F07178'),
    (p_user_id, 'Desenvolvimento Pessoal & Profissional', 'expense', '#C3A6FF'),
    (p_user_id, 'Estilo de Vida & Lazer', 'expense', '#5B8DEF'),
    (p_user_id, 'Financeiro Estratégico', 'expense', '#3DDC97'),
    (p_user_id, 'Outros', 'both', '#8B9AAB'),
    (p_user_id, 'Social & Afetivo', 'expense', '#7AD7F0'),
    (p_user_id, 'Transporte & Mobilidade', 'expense', '#5B8DEF'),
    (p_user_id, 'Salário', 'income', '#3DDC97'),
    (p_user_id, 'Freelance', 'income', '#5B8DEF')
  on conflict (user_id, name) do nothing;
end;
$$;

revoke all on function public.fluxo_ensure_user(uuid, text) from public, anon, authenticated;
