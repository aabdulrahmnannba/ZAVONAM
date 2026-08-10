# ZAVONAM 2026

Premium traditional-modern Onam festival website starter for **Second Year BCA, Srinivas University**.

## Included
- Responsive public event website
- Kerala/Onam visual direction
- Light + Dark theme
- Scroll reveal animations
- Countdown to 23 August 2026
- Events and category filters
- Schedule
- Registration form
- ₹600 payment split: UPI / Cash
- Demo QR placeholder
- Browser-based demo registration storage
- Digital registration ID
- Organizer Admin Dashboard with login + password change
- Payment verification workflow
- Participant list
- Announcements
- Gallery section
- Instagram @zevix.bca
- WhatsApp floating contact
- Back-to-top button

## Demo admin
URL: `admin/index.html`
Username: `admin`
Password: `zavonam` (change it from Admin → Settings)

## Before real launch
This ZIP is a **frontend/demo starter**, not a production payment or authentication system.

Replace:
1. WhatsApp number in `js/app.js`
2. UPI QR with the official event QR
3. Gallery placeholders with real approved photos
4. Demo admin authentication with secure authentication
5. localStorage registration storage with a real database
6. payment verification with your chosen official payment process
7. Add privacy/consent rules before publishing participant data

No sensitive payment credentials should be stored in this website.

## Current design decision
ZAVONAM has **no public leaderboard and no team system**. It is a single-batch celebration. Boys/girls activities can still be listed as event categories without creating teams.

## UPI QR
The current `assets/images/upi-qr.svg` is a placeholder QR. Replace that file with the official ZAVONAM UPI QR (keeping the same filename) before launch. The registration page now displays the QR image directly when UPI is selected.

## QR registration
The registration confirmation now generates a QR code containing the registration ID, name and payment method. It is a **registration-verification QR**, not a proof of payment. Final production entry passes should be activated only after payment verification.

## Registration PDF
After registration, the user can download a **two-page PDF**: Page 1 is the ZAVONAM festival pass with QR + student details; Page 2 is the ₹600 registration bill/payment note. It remains marked pending until an organizer verifies payment. WhatsApp attachment delivery will be connected in the final backend/WhatsApp phase after the payment approval workflow is confirmed.


## Final registration/pass workflow
- Student enters separate Mobile Number and WhatsApp Number.
- Student selects UPI or Cash.
- Registration creates only a **pending record**.
- No QR, Entry Pass, Pass ID, or Pass PDF is revealed before admin approval.
- Admin verifies the ₹600 payment.
- Approval sets `passEnabled=true`.
- Student uses **Student ID + WhatsApp Number** under View Entry Pass.
- Only then is the official QR/pass revealed and the verified 2-page PDF can be downloaded.
- The admin approval screen can open a WhatsApp notification link to the registered WhatsApp number.
- Automatic WhatsApp message/PDF delivery requires a proper WhatsApp Business API/backend connection in the production phase.

## Admin usability
The registrations/payments screen now has search, payment-status filters, UPI/Cash filters, and a confirmation step before approving a ₹600 payment.

## Settings PIN
Admin Settings is protected by a separate 4-digit PIN. Default starter PIN: `2580`. After unlocking Settings, the admin can change the PIN. Production will move this protection to secure server-side authentication.

## Admin exports
The Admin Registrations page can export all registrations to CSV, and Participants can export only approved/paid participants to a separate CSV.

## Premium entry pass
The approved student pass now has a premium festival-card treatment, verified payment badge, unique QR, registration code, and PDF download. The pass remains hidden until admin approval.

## Live announcements
Admin-published announcements now appear as a live strip on the public website using the same browser demo storage. Production will move this to the shared database so every student sees updates centrally.

## Admin event management
Admin now has an Events section to add/delete event schedule items with name, time, venue and category. This demo stores changes in browser localStorage; production will sync them through the database.

## Public event sync
The public Events section now reads the Admin-managed event list. Add/delete an event in Admin → Events and the public event cards update from the shared browser demo storage.

## Supabase connection
The public registration form now writes registrations to the Supabase `registrations` table, and the View Entry Pass lookup reads from that table. The Supabase browser configuration uses only the publishable key. Admin database access is intentionally the next step and will use Supabase Auth + RLS; do not place a secret/service_role key in the website.


## N1.2 — Real Admin Database
Admin login and registrations now use Supabase Auth + the real `registrations` table.

### Create the first organizer account
In Supabase:
1. Authentication → Users → Add user.
2. Create the organizer email and a strong password.
3. Copy the new user's UUID.
4. In SQL Editor run:
```sql
insert into public.admin_users (user_id, display_name)
values ('PASTE_AUTH_USER_UUID_HERE', 'ZAVONAM Organizer');
```
5. Open the ZAVONAM Admin page and sign in with that email/password.

The Admin dashboard now reads, approves and deletes registrations from Supabase. Never put a secret/service_role key in the website.

## N2 — UPI payment reference
The registration flow now supports an optional UPI Transaction/UTR reference and payment note. Admin sees the reference before manually approving a payment. This does not falsely mark UPI payments as successful; the organizer still verifies the payment before unlocking the pass.

## N3 — Approved Pass + Bill PDF
After Supabase marks a registration as `paid` and `pass_enabled = true`, the student can use View Entry Pass to generate a two-page PDF:
1. Approved Entry Pass with QR, student details and registration ID.
2. Payment Bill / Receipt with the ₹600 payment details.

The page also provides a WhatsApp link and a copy-message button. Fully automatic WhatsApp delivery of a PDF attachment requires an official WhatsApp Business API/server integration; a normal browser page cannot silently send a file to WhatsApp.

## N5 — Live Events + Announcements
Admin Events and Announcements now use Supabase. Public Events and the live announcement area read the active records from Supabase, so changes are shared across devices instead of being stored only in one browser.

## N6 — Supabase Gallery
Run `supabase/003_gallery_storage.sql` once in the existing Supabase project. This creates the `gallery` table and a public `zavonam-gallery` Storage bucket. Admins can upload multiple JPG/PNG/WebP images, hide/publish them, and delete them. Public users see active gallery images from Supabase.

## N7 — Security hardening
Run `supabase/004_security_hardening.sql` in Supabase SQL Editor. It re-applies the RLS policies, keeps registrations private from anonymous users, restricts registration inserts, adds the student/WhatsApp lookup index, and prevents duplicate Student IDs.
Do not put Supabase secret/service_role keys, Meta tokens, or database passwords in frontend files.
