-- Wishlist dedicada (paridade Notion Wishlist)

create table if not exists public.fluxo_wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  price numeric(14, 2) not null check (price >= 0),
  saved_amount numeric(14, 2) not null default 0 check (saved_amount >= 0),
  category text,
  url text,
  purchased boolean not null default false,
  source_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists fluxo_wishlist_user_source_ref_uidx
  on public.fluxo_wishlist (user_id, source_ref)
  where source_ref is not null;

create index if not exists fluxo_wishlist_user_purchased_idx
  on public.fluxo_wishlist (user_id, purchased, created_at desc);

alter table public.fluxo_wishlist enable row level security;

drop policy if exists fluxo_wishlist_own on public.fluxo_wishlist;
create policy fluxo_wishlist_own on public.fluxo_wishlist
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
