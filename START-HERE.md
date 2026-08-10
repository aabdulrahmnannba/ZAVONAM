# ZAVONAM 2026 — FIXED PACKAGE

## 1. Run locally
Open `admin/index.html` directly in your browser.

## 2. Admin login
The Admin page uses:
- `admin/index.html`
- `admin/admin.css`
- `admin/admin.js`
- `js/supabase-config.js`

The JavaScript now shows the actual Supabase error instead of silently staying on the login page.

## 3. If Sign in still does not open the dashboard
The Supabase Auth user must exist AND that user's UUID must be in `public.admin_users`.

Run `supabase/005_admin_auth_setup.sql` in Supabase SQL Editor.

Then:
1. Supabase Dashboard → Authentication → Users → Add user.
2. Create the organizer email and password.
3. Copy that user's UUID.
4. Run:
   `insert into public.admin_users (user_id, display_name) values ('USER-UUID-HERE', 'ZAVONAM Organizer');`
5. Return to `admin/index.html` and sign in.

## 4. Existing database migrations
Run the SQL files in this order if your Supabase project has not already received them:
1. `005_admin_auth_setup.sql` — admin table/function
2. Existing base schema / registration migration, if you have one
3. `002_upi_payment_reference.sql`
4. `003_gallery_storage.sql`
5. `004_security_hardening.sql`

Do not put a Supabase secret/service_role key in frontend files.
