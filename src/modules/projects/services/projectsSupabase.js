import { supabase } from '../../../lib/supabaseClient'

// ─── Campos que existen en la tabla de Supabase ───────────────────────────────
// id, name, description, due_date, status, progress, created_by, workspace_id, created_at

// ─── Mappers ──────────────────────────────────────────────────────────────────

/** DB row → app object */
function toApp(row) {
  return {
    id:            row.id,
    name:          row.name          ?? '',
    description:   row.description   ?? '',
    status:        row.status        ?? 'active',
    dueDate:       row.due_date      ?? '',
    progress:      row.progress      ?? 0,
    createdBy:     row.created_by    ?? null,   // auth.uid() del creador
    workspaceId:   row.workspace_id  ?? null,
    // Campos solo locales (se calculan fuera de este módulo)
    tasksTotal:    0,
    tasksDone:     0,
    ownerInitials: '',
  }
}

/** App object → DB row  (solo los campos que acepta la tabla) */
function toDB(project, userId) {
  return {
    name:         project.name,
    description:  project.description  ?? '',
    status:       project.status       ?? 'active',
    due_date:     project.dueDate      || null,
    progress:     project.progress     ?? 0,
    created_by:   userId,
    workspace_id: project.workspaceId  || null,
  }
}

/** Solo campos válidos de la tabla para UPDATE */
function changestoDB(changes) {
  const row = {}
  if (changes.name        !== undefined) row.name        = changes.name
  if (changes.description !== undefined) row.description = changes.description
  if (changes.status      !== undefined) row.status      = changes.status
  if (changes.dueDate     !== undefined) row.due_date    = changes.dueDate || null
  if (changes.progress    !== undefined) row.progress    = changes.progress
  // workspace_id is intentionally not updatable after creation
  return row
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/** Lee un único proyecto por id (usado para reconciliación post-update) */
export async function fetchProjectById(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .limit(1)

  if (error) {
    console.error('[Supabase] fetchProjectById error:', error)
    throw error
  }
  return data?.[0] ? toApp(data[0]) : null
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

/**
 * "Mis proyectos" — proyectos donde el usuario autenticado es el creador.
 * Filter: created_by = userId
 */
export async function fetchMyProjects(userId) {
  if (!userId) return []

  console.log('[Supabase] fetchMyProjects → created_by:', userId)

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Supabase] fetchMyProjects ❌', error)
    throw error
  }
  console.log('[Supabase] fetchMyProjects ✅', data.length, 'rows')
  return (data ?? []).map(toApp)
}

/**
 * "Compartidos conmigo" — proyectos donde el usuario tiene membresía
 * en project_members PERO no es el creador.
 *
 * Garantiza cero solapamiento con fetchMyProjects.
 *
 * Paso 1: project_members → project_ids del usuario
 * Paso 2: projects WHERE id IN (...) AND created_by != userId
 */
export async function fetchSharedProjects(userId) {
  if (!userId) return []

  console.log('[Supabase] fetchSharedProjects → user:', userId)

  const { data: memberships, error: mErr } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId)

  if (mErr) {
    console.error('[Supabase] fetchSharedProjects memberships ❌', mErr)
    throw mErr
  }

  if (!memberships?.length) {
    console.log('[Supabase] fetchSharedProjects — sin membresías')
    return []
  }

  const ids = memberships.map((m) => m.project_id)

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .in('id', ids)
    .neq('created_by', userId)      // excluir los que el usuario creó él mismo
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Supabase] fetchSharedProjects projects ❌', error)
    throw error
  }

  console.log('[Supabase] fetchSharedProjects ✅', data.length, 'rows')
  return (data ?? []).map(toApp)
}

/**
 * Rol del usuario en un proyecto concreto.
 *
 * Reglas (en orden):
 *   1. Si projects.created_by === userId → 'owner'  (sin consulta extra)
 *   2. Si hay fila en project_members    → devuelve ese role
 *   3. Sin membresía                     → null
 *
 * Nunca devuelve un fallback silencioso.
 *
 * @param {string} projectId
 * @param {string} userId
 * @param {string|null} createdBy  — si ya tienes projects.created_by, pásalo para
 *                                   evitar una query extra; de lo contrario se omite.
 * @returns {Promise<'owner'|'collaborator'|'client'|null>}
 */
export async function getUserProjectRole(projectId, userId, createdBy = null) {
  if (!projectId || !userId) return null

  // ── Regla 1: creador siempre es owner ────────────────────────────────────
  if (createdBy !== null) {
    if (createdBy === userId) {
      console.log('[Supabase] getUserProjectRole → owner (createdBy match)')
      return 'owner'
    }
  } else {
    // Si no se pasó createdBy, consultamos projects para averiguarlo
    const { data: proj, error: pErr } = await supabase
      .from('projects')
      .select('created_by')
      .eq('id', projectId)
      .maybeSingle()

    if (pErr) throw new Error(`getUserProjectRole: ${pErr.message}`)

    if (proj?.created_by === userId) {
      console.log('[Supabase] getUserProjectRole → owner (DB check)')
      return 'owner'
    }
  }

  // ── Regla 2: buscar en project_members ───────────────────────────────────
  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`getUserProjectRole: ${error.message}`)

  if (data?.role) {
    console.log('[Supabase] getUserProjectRole → membership role:', data.role)
    return data.role   // 'owner' | 'collaborator' | 'client'
  }

  // ── Regla 3: sin acceso ───────────────────────────────────────────────────
  console.log('[Supabase] getUserProjectRole → null (sin membresía)')
  return null
}

/** Inserta un proyecto nuevo — solo envía campos válidos de la tabla */
export async function insertProject(project, userId) {
  const row = toDB(project, userId)
  console.log('[Supabase] insertProject →', row)

  const { data, error } = await supabase
    .from('projects')
    .insert(row)
    .select()

  if (error) {
    console.log('[Supabase] insertProject error:', error)
    throw error
  }

  const record = Array.isArray(data) ? data[0] : data
  if (!record) throw new Error('insertProject: no se recibió registro de Supabase')

  console.log('[Supabase] insertProject ✅', record.id)
  return toApp(record)
}

/** Actualiza solo los campos válidos de un proyecto existente */
export async function updateProjectInDB(id, changes) {
  const row = changestoDB(changes)
  if (Object.keys(row).length === 0) return   // nada que persistir en DB

  console.log('[Supabase] updateProject →', id, row)

  const { data, error } = await supabase
    .from('projects')
    .update(row)
    .eq('id', id)
    .select()

  if (error) {
    console.error('[Supabase] updateProject error:', error)
    throw error
  }

  const record = Array.isArray(data) ? data[0] : data

  if (!record) {
    // RETURNING vacío: RLS bloqueó el SELECT post-UPDATE → fallback SELECT
    console.warn('[Supabase] updateProject: RETURNING vacío → fallback SELECT', id)
    return fetchProjectById(id)
  }

  console.log('[Supabase] updateProject ✅', record.id)
  return toApp(record)
}

/**
 * Crea un proyecto.
 *
 * El owner queda registrado únicamente en `projects.created_by`.
 * NO se inserta en `project_members` — esa tabla es exclusiva para usuarios
 * invitados. La membresía del owner se resuelve siempre por `created_by`.
 *
 * @param {object} project    — campos del formulario (name, description, dueDate, …)
 * @param {string} workspaceId
 * @param {string} userId     — auth.uid() del creador
 * @returns {Promise<object>} El proyecto creado mapeado al formato de la app.
 */
export async function createProjectWithOwner(project, workspaceId, userId) {
  console.log('[Supabase] createProjectWithOwner →', { name: project.name, workspaceId })

  const { data: projectRow, error: projectErr } = await supabase
    .from('projects')
    .insert({
      name:         project.name,
      description:  project.description ?? '',
      due_date:     project.dueDate     || null,
      status:       project.status      ?? 'active',
      progress:     project.progress    ?? 0,
      created_by:   userId,
      workspace_id: workspaceId         || null,
    })
    .select()
    .single()

  if (projectErr) {
    console.error('[Supabase] createProjectWithOwner ❌', projectErr.message)
    throw new Error(`Error al crear el proyecto: ${projectErr.message}`)
  }

  console.log('[Supabase] createProjectWithOwner ✅', projectRow.id)

  return toApp(projectRow)
}

/** Elimina un proyecto por id */
export async function deleteProjectFromDB(id) {
  console.log('[Supabase] deleteProject →', id)

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    console.log('[Supabase] deleteProject error:', error)
    throw error
  }
  console.log('[Supabase] deleteProject ✅', id)
}
