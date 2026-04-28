-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: profiles + workspace_members + project_members RLS
--
-- Ejecutar en Supabase → SQL Editor (una sola vez).
-- Idempotente: usa IF NOT EXISTS / ON CONFLICT DO NOTHING / DROP … IF EXISTS.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. Tabla profiles ────────────────────────────────────────────────────────
--
-- Diseño:
--   id      — UUID generado por la app (crypto.randomUUID). SIN FK a auth.users.
--             Permite crear usuarios de display antes de que se registren.
--   auth_id — UUID de auth.users (FK nullable). Se llena cuando el usuario hace
--             signup vía el trigger handle_new_user. Es el UUID que se usa en
--             project_members.user_id para que RLS funcione con auth.uid().
--   email   — UNIQUE. Puente entre perfil de display y usuario Auth.

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id    uuid        REFERENCES auth.users (id) ON DELETE SET NULL,
  email      text        UNIQUE,
  full_name  text,
  initials   text,
  -- role NO existe aquí: vive en workspace_members y project_members
  created_at timestamptz DEFAULT now()
);

-- Si la tabla ya existía con columna role, eliminarla
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

CREATE INDEX IF NOT EXISTS idx_profiles_email   ON public.profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON public.profiles (auth_id);


-- ─── 2. Trigger: vincular auth signup ↔ perfil existente ─────────────────────
--
-- Cuando un usuario hace signup en Supabase Auth:
--   a) Si existe perfil con ese email → actualiza auth_id (vincula).
--   b) Si no existe → inserta perfil nuevo con id = auth.uid().

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(email) = lower(NEW.email)) THEN
    UPDATE public.profiles
    SET    auth_id = NEW.id
    WHERE  lower(email) = lower(NEW.email)
      AND  auth_id IS NULL;
  ELSE
    INSERT INTO public.profiles (id, auth_id, email)
    VALUES (NEW.id, NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ─── 3. Backfill: vincular usuarios Auth existentes ──────────────────────────

UPDATE public.profiles p
SET    auth_id = au.id
FROM   auth.users au
WHERE  lower(p.email) = lower(au.email)
  AND  p.auth_id IS NULL;

INSERT INTO public.profiles (id, auth_id, email)
SELECT au.id, au.id, au.email
FROM   auth.users au
WHERE  NOT EXISTS (SELECT 1 FROM public.profiles WHERE auth_id = au.id)
ON CONFLICT (id) DO NOTHING;


-- ─── 4. workspace_members: eliminar FK a auth.users si existe ────────────────
--
-- El host crea usuarios de display (profiles.id es UUID de app, no de auth.users).
-- Para que INSERT workspace_members con ese user_id funcione, la columna user_id
-- NO debe tener FK constraint a auth.users.
--
-- Si tu tabla tiene FK constraint en workspace_members.user_id, ejecuta:
--
--   ALTER TABLE public.workspace_members
--   DROP CONSTRAINT IF EXISTS workspace_members_user_id_fkey;
--
-- Reemplaza "workspace_members_user_id_fkey" con el nombre real del constraint
-- (búscalo en Supabase → Table Editor → workspace_members → Constraints).
--
-- Este bloque lo hace automáticamente buscando el constraint por convención:

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM   pg_constraint
  WHERE  conrelid = 'public.workspace_members'::regclass
    AND  contype  = 'f'
    AND  conname  LIKE '%user_id%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.workspace_members DROP CONSTRAINT IF EXISTS %I', constraint_name);
    RAISE NOTICE 'Dropped FK constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No user_id FK constraint found on workspace_members — nothing to drop.';
  END IF;
END;
$$;


-- ─── 5. workspace_members: unique constraint (workspace_id, user_id) ─────────
--
-- Garantiza que no haya duplicados; el código maneja el 23505 gracefully.

ALTER TABLE public.workspace_members
  ADD CONSTRAINT IF NOT EXISTS uq_workspace_members_ws_user
  UNIQUE (workspace_id, user_id);


-- ─── 6. RLS en profiles ───────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
CREATE POLICY "profiles_insert_authenticated"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "profiles_update_authenticated" ON public.profiles;
CREATE POLICY "profiles_update_authenticated"
  ON public.profiles FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "profiles_delete_authenticated" ON public.profiles;
CREATE POLICY "profiles_delete_authenticated"
  ON public.profiles FOR DELETE
  USING (auth.role() = 'authenticated');


-- ─── 7. RLS en workspace_members ─────────────────────────────────────────────

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- SELECT: el propio miembro O el dueño del workspace
DROP POLICY IF EXISTS "wm_select" ON public.workspace_members;
CREATE POLICY "wm_select"
  ON public.workspace_members FOR SELECT
  USING (
    user_id      = auth.uid()
    OR workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

-- INSERT: self-insert O el dueño del workspace inserta miembros
DROP POLICY IF EXISTS "wm_insert" ON public.workspace_members;
CREATE POLICY "wm_insert"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    user_id      = auth.uid()
    OR workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

-- UPDATE: solo el dueño del workspace
DROP POLICY IF EXISTS "wm_update" ON public.workspace_members;
CREATE POLICY "wm_update"
  ON public.workspace_members FOR UPDATE
  USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

-- DELETE: self-remove O el dueño del workspace elimina miembros
DROP POLICY IF EXISTS "wm_delete" ON public.workspace_members;
CREATE POLICY "wm_delete"
  ON public.workspace_members FOR DELETE
  USING (
    user_id      = auth.uid()
    OR workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );


-- ─── 8. RLS en project_members ───────────────────────────────────────────────

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pm_select" ON public.project_members;
CREATE POLICY "pm_select"
  ON public.project_members FOR SELECT
  USING (
    user_id    = auth.uid()
    OR project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "pm_insert" ON public.project_members;
CREATE POLICY "pm_insert"
  ON public.project_members FOR INSERT
  WITH CHECK (
    user_id    = auth.uid()
    OR project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "pm_update" ON public.project_members;
CREATE POLICY "pm_update"
  ON public.project_members FOR UPDATE
  USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "pm_delete" ON public.project_members;
CREATE POLICY "pm_delete"
  ON public.project_members FOR DELETE
  USING (
    user_id    = auth.uid()
    OR project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  );
