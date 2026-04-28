-- ─── Tabla: projects ─────────────────────────────────────────────────────────
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS projects (
  id             uuid            DEFAULT gen_random_uuid() PRIMARY KEY,
  name           text            NOT NULL,
  description    text            DEFAULT '',
  status         text            DEFAULT 'active',
  due_date       date,
  progress       integer         DEFAULT 0,
  tasks_total    integer         DEFAULT 0,
  tasks_done     integer         DEFAULT 0,
  owner_initials text            DEFAULT '',
  user_ids       text[]          DEFAULT '{}',   -- IDs locales de miembros del proyecto
  user_id        uuid            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     timestamptz     DEFAULT now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Solo el dueño del proyecto puede verlo y modificarlo.

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_owner_all"
  ON projects
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
