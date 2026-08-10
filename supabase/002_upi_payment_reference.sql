-- ZAVONAM 2026 — UPI payment reference migration
alter table public.registrations
  add column if not exists payment_reference text;

alter table public.registrations
  add column if not exists payment_note text;

create index if not exists registrations_payment_reference_idx
on public.registrations (payment_reference);
