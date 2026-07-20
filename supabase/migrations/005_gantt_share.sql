-- ─── Gantt public share link ──────────────────────────────────────────────────
-- Adds two columns to `projects` so an owner can publish a read-only Gantt
-- via an opaque token URL (/share/gantt/:token).
--
-- gantt_share_token   — UUID used as the URL token. NULL until first activation.
-- gantt_share_enabled — true = link is live; false = link is disabled (token kept).
--
-- Run once in Supabase Dashboard → SQL Editor → New query → Run

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS gantt_share_token   uuid    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gantt_share_enabled boolean DEFAULT false;

-- Fast lookup by token (partial index — only rows that have a token)
CREATE UNIQUE INDEX IF NOT EXISTS projects_gantt_share_token_idx
  ON projects (gantt_share_token)
  WHERE gantt_share_token IS NOT NULL;

-- ─── RLS: allow anonymous reads via share token ────────────────────────────────
--
-- Projects: anon can SELECT a project row if sharing is active.
-- Tasks:    anon can SELECT tasks belonging to a shared project.
--
-- Multiple SELECT policies on the same table combine with OR, so these
-- policies do not affect authenticated users or owner-only access.

CREATE POLICY "public_gantt_project_select"
  ON projects FOR SELECT
  USING (
    gantt_share_token IS NOT NULL
    AND gantt_share_enabled = true
  );

CREATE POLICY "public_gantt_tasks_select"
  ON tasks FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE  gantt_share_token IS NOT NULL
        AND  gantt_share_enabled = true
    )
  );
