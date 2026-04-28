-- ─── Brief personalization columns ────────────────────────────────────────────
-- Adds 4 optional text columns so project owners can customize the messages
-- shown in the intro screen and the post-submission celebration screen of the
-- public brief form.
--
-- All columns default to NULL; the application layer supplies display defaults
-- when NULL is encountered (see briefSupabase.js → toApp()).
--
-- Run once in the Supabase SQL editor (or via `supabase db push`).

ALTER TABLE project_briefs
  ADD COLUMN IF NOT EXISTS welcome_title       TEXT,
  ADD COLUMN IF NOT EXISTS welcome_description TEXT,
  ADD COLUMN IF NOT EXISTS success_title       TEXT,
  ADD COLUMN IF NOT EXISTS success_message     TEXT;
