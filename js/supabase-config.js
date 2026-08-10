// ZAVONAM 2026 — Supabase public client configuration
// This file contains only the publishable browser key.
// Never put a Supabase secret/service_role key here.
const SUPABASE_URL = "https://bhsmkaqtpdpuagmgdklc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OgEu-P4Nk4-xSJcBUOn_Pw_TmOlA6Jz";
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
