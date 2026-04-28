-- ─── Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run ──────────

CREATE TABLE IF NOT EXISTS tasks (
  id             uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id     uuid         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id        uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text         NOT NULL,
  description    text         DEFAULT '',
  status         text         DEFAULT 'pending',   -- pending | in-progress | observed | completed
  start_date     date,
  due_date       date,
  estimated_time text         DEFAULT '',
  sort_order     integer      DEFAULT 0,
  created_at     timestamptz  DEFAULT now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_delete" ON tasks FOR DELETE USING (auth.uid() = user_id);
