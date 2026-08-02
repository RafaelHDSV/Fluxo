-- Wishlist cover images

alter table public.fluxo_wishlist
  add column if not exists image_url text;
