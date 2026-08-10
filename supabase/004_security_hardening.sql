-- ZAVONAM 2026 — N7 security hardening
-- Run after the previous ZAVONAM migrations.

-- Make sure RLS is enabled on every exposed application table.
alter table public.registrations enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;
alter table public.gallery enable row level security;
alter table public.admin_users enable row level security;

-- Keep the public registration insert intentionally narrow.
drop policy if exists "Public can create registration" on public.registrations;
create policy "Public can create registration"
on public.registrations
for insert
to anon, authenticated
with check (
  payment_status = 'pending'
  and pass_enabled = false
  and amount = 600
);

-- Students must never be able to read the registrations table.
-- Only admins can read/update/delete registrations.
drop policy if exists "Admins can view registrations" on public.registrations;
create policy "Admins can view registrations"
on public.registrations
for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can update registrations" on public.registrations;
create policy "Admins can update registrations"
on public.registrations
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins can delete registrations" on public.registrations;
create policy "Admins can delete registrations"
on public.registrations
for delete
to authenticated
using ((select public.is_admin()));

-- Public can only see active event/announcement/gallery records.
-- Admins can manage them.
drop policy if exists "Public can view active events" on public.events;
create policy "Public can view active events"
on public.events for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage events" on public.events;
create policy "Admins can manage events"
on public.events for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view active announcements" on public.announcements;
create policy "Public can view active announcements"
on public.announcements for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements"
on public.announcements for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Public can view active gallery" on public.gallery;
create policy "Public can view active gallery"
on public.gallery for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage gallery" on public.gallery;
create policy "Admins can manage gallery"
on public.gallery for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Admin membership itself is private.
drop policy if exists "Admins can view admin users" on public.admin_users;
create policy "Admins can view admin users"
on public.admin_users for select
to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can manage admin users" on public.admin_users;
create policy "Admins can manage admin users"
on public.admin_users for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Helpful indexes for the approval lookup.
create index if not exists registrations_student_whatsapp_idx
on public.registrations (student_id, whatsapp);

-- Avoid duplicate registrations for the same student ID.
create unique index if not exists registrations_student_id_unique_idx
on public.registrations (student_id);
