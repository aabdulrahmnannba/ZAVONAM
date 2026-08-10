-- ZAVONAM 2026 — Gallery + Supabase Storage
insert into storage.buckets (id, name, public)
values ('zavonam-gallery', 'zavonam-gallery', true)
on conflict (id) do update set public = true;

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_path text not null unique,
  image_url text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.gallery enable row level security;

drop policy if exists "gallery_public_read" on public.gallery;
create policy "gallery_public_read" on public.gallery
for select using (is_active = true);

drop policy if exists "gallery_admin_insert" on public.gallery;
create policy "gallery_admin_insert" on public.gallery
for insert to authenticated
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "gallery_admin_update" on public.gallery;
create policy "gallery_admin_update" on public.gallery
for update to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()))
with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "gallery_admin_delete" on public.gallery;
create policy "gallery_admin_delete" on public.gallery
for delete to authenticated
using (exists (select 1 from public.admin_users where user_id = auth.uid()));

drop policy if exists "gallery_storage_public_read" on storage.objects;
create policy "gallery_storage_public_read" on storage.objects
for select using (bucket_id = 'zavonam-gallery');

drop policy if exists "gallery_storage_admin_insert" on storage.objects;
create policy "gallery_storage_admin_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'zavonam-gallery'
  and exists (select 1 from public.admin_users where user_id = auth.uid())
);

drop policy if exists "gallery_storage_admin_update" on storage.objects;
create policy "gallery_storage_admin_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'zavonam-gallery'
  and exists (select 1 from public.admin_users where user_id = auth.uid())
)
with check (
  bucket_id = 'zavonam-gallery'
  and exists (select 1 from public.admin_users where user_id = auth.uid())
);

drop policy if exists "gallery_storage_admin_delete" on storage.objects;
create policy "gallery_storage_admin_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'zavonam-gallery'
  and exists (select 1 from public.admin_users where user_id = auth.uid())
);
