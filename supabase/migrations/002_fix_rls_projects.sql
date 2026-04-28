-- ─── Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run ──────────
-- Este script corrige las policies de RLS para la tabla projects.
-- Es seguro ejecutarlo aunque ya hayas ejecutado 001_create_projects.sql

-- 1. Eliminar policies anteriores (por si quedaron mal creadas)
DROP POLICY IF EXISTS "projects_owner_all"     ON projects;
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

-- 2. Asegurar que RLS está habilitado
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 3. Crear policies separadas (más claras y confiables que FOR ALL)

-- SELECT: cada usuario ve solo sus proyectos
CREATE POLICY "projects_select"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: solo puede insertar filas donde user_id = su propio uid
CREATE POLICY "projects_insert"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: solo puede modificar sus propios proyectos
CREATE POLICY "projects_update"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: solo puede eliminar sus propios proyectos
CREATE POLICY "projects_delete"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Verificar que quedó bien (opcional, ver resultados en la pestaña Results)
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'projects';
