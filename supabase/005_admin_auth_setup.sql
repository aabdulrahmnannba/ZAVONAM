-- ZAVONAM 2026 — Admin authentication setup
-- Run this ONCE in Supabase SQL Editor before using the Admin dashboard.
-- This does NOT create an Auth user. Create the user in:
-- Supabase Dashboard → Authentication → Users → Add user
--
-- Then copy that user's UUID into:
-- INSERT INTO public.admin_users (user_id, display_name) VALUES (...);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'ZAVONAM Organizer',
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Security-definer function used by the frontend after Supabase Auth login.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admins can see/manage the admin_users table.
drop policy if exists "Admins can view admin users" on public.admin_users;
create policy "Admins can view admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage admin users" on public.admin_users;
create policy "Admins can manage admin users"
on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- AFTER creating the Auth user, replace the UUID below and run:
-- insert into public.admin_users (user_id, display_name)
-- values ('PASTE_AUTH_USER_UUID_HERE', 'ZAVONAM Organizer');
