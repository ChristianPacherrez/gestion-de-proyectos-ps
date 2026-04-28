import { supabase } from '../../../lib/supabaseClient'

// ─── Mapper ───────────────────────────────────────────────────────────────────
function toApp(row, role) {
  return {
    id:        row.id,
    name:      row.name       ?? 'Sin nombre',
    ownerId:   row.owner_id   ?? null,
    createdAt: row.created_at ?? null,
    role:      role           ?? 'colaborador',
  }
}

// ─── Error helpers ────────────────────────────────────────────────────────────

/**
 * 409 / 23505 — unique_violation: fila ya existe (upsert race condition o pre-check fallido).
 * Se ignora completamente — es un no-op esperado.
 */
function isDuplicateError(err) {
  const code = err?.code ?? ''
  return code === '23505' || code === '409'
}

/**
 * 23503 — foreign_key_violation: workspace_id o user_id no existe todavía.
 * Se ignora con warning — puede ocurrir en race conditions de creación.
 */
function isFKError(err) {
  return (err?.code ?? '') === '23503'
}

// ─── Safe upsert ──────────────────────────────────────────────────────────────
/**
 * Inserta o actualiza una fila en workspace_members de forma segura.
 *
 * Flujo:
 *   1. Pre-check: si (workspace_id, user_id) ya existe → retorna sin tocar la DB.
 *   2. Upsert con ignoreDuplicates como red de seguridad ante race conditions.
 *
 * Errores:
 *   - 409 / 23505 → ignorar (ya existe — ok silencioso)
 *   - 23503        → ignorar con warning (FK no disponible todavía)
 *   - otros        → loguear como error real; lanzar si `throwOnError` es true
 *
 * No bloquea la UI: el caller decide si await o fire-and-forget.
 *
 * @param {string}  workspaceId
 * @param {string}  userId
 * @param {string}  role           — 'host' | 'colaborador'
 * @param {boolean} throwOnError   — si true, relanza errores no ignorables (default: false)
 */
async function safeUpsertWorkspaceMember(workspaceId, userId, role, throwOnError = false) {
  // ── 1. Pre-check ─────────────────────────────────────────────────────────
  const { data: existing, error: checkErr } = await supabase
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (checkErr) {
    console.warn('[Workspaces] safeUpsertWorkspaceMember: pre-check ⚠', checkErr.message)
    // Continuar con el upsert — el pre-check es una optimización, no un guard crítico
  } else if (existing) {
    console.log('[Workspaces] workspace_members: ya existe →', workspaceId, userId)
    return
  }

  // ── 2. Upsert ─────────────────────────────────────────────────────────────
  try {
    const { error } = await supabase
      .from('workspace_members')
      .upsert(
        { workspace_id: workspaceId, user_id: userId, role },
        { onConflict: 'workspace_id,user_id', ignoreDuplicates: true }
      )

    if (error) {
      if (isDuplicateError(error)) {
        console.log('[Workspaces] workspace_members: duplicate ignorado →', error.code)
        return
      }
      if (isFKError(error)) {
        console.warn('[Workspaces] workspace_members: FK ⚠ (ignorado):', error.message)
        return
      }
      console.error('[Workspaces] workspace_members ❌', error.code, error.message)
      if (throwOnError) throw error
    } else {
      console.log('[Workspaces] workspace_members ✅', workspaceId, '→', userId, `(${role})`)
    }
  } catch (e) {
    if (isDuplicateError(e) || isFKError(e)) {
      console.warn('[Workspaces] workspace_members exception ⚠ (ignorado):', e?.message)
      return
    }
    if (throwOnError) throw e
    console.error('[Workspaces] workspace_members exception ❌', e?.message)
  }
}

// ─── fetchUserWorkspaces ──────────────────────────────────────────────────────
//
// Fuente de verdad: workspace_members.user_id = userId
//
// No realiza ningún backfill ni escribe en la DB.
// Las membresías se crean exclusivamente en:
//   • createWorkspace        → owner (host)
//   • addToWorkspaceMember   → colaborador al invitar a un proyecto
//
export async function fetchUserWorkspaces(userId) {
  // ── Membresías explícitas ─────────────────────────────────────────────────
  const { data: memberships, error: memErr } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', userId)

  if (memErr) {
    console.error('[Workspaces] workspace_members query error:', memErr)
    throw memErr
  }

  if (!memberships?.length) {
    console.log('[Workspaces] fetchUserWorkspaces → sin membresías para', userId)
    return []
  }

  const wsIds      = memberships.map((m) => m.workspace_id)
  const roleByWsId = Object.fromEntries(memberships.map((m) => [m.workspace_id, m.role]))

  // ── Fetch workspaces ──────────────────────────────────────────────────────
  const { data: wsRows, error: wsErr } = await supabase
    .from('workspaces')
    .select('id, name, owner_id, created_at')
    .in('id', wsIds)

  if (wsErr) {
    console.error('[Workspaces] workspaces fetch error:', wsErr)
    throw wsErr
  }

  console.log('[Workspaces] fetchUserWorkspaces ✅', (wsRows ?? []).length, 'workspace(s)')

  return (wsRows ?? []).map((row) => {
    const role = roleByWsId[row.id] ?? (row.owner_id === userId ? 'host' : 'colaborador')
    return toApp(row, role)
  })
}

// ─── createWorkspace ──────────────────────────────────────────────────────────
//
// Crea un workspace e inserta al creador como host en workspace_members.
// Safe to call multiple times: dedup por (owner_id + name) antes de insertar.
//
export async function createWorkspace(name, userId) {
  const trimmedName = name.trim()
  console.log('[Workspaces] createWorkspace →', { name: trimmedName, userId })

  // ── Dedup check ───────────────────────────────────────────────────────────
  const { data: existing, error: checkErr } = await supabase
    .from('workspaces')
    .select('id, name, owner_id, created_at')
    .eq('owner_id', userId)
    .eq('name', trimmedName)
    .limit(1)

  if (checkErr) {
    console.warn('[Workspaces] createWorkspace dedup check ⚠:', checkErr.message)
    // No fatal — continuar con insert; el upsert posterior actúa como red de seguridad
  }

  if (existing?.length > 0) {
    console.log('[Workspaces] Workspace ya existe, devolviendo existente:', existing[0].id)
    return toApp(existing[0], 'host')
  }

  // ── Insert workspace ──────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('workspaces')
    .insert({ name: trimmedName, owner_id: userId })
    .select()

  if (error) {
    console.error('[Workspaces] createWorkspace insert error:', error)
    throw error
  }

  const ws = data[0]
  console.log('[Workspaces] workspace creado:', ws.id)

  // ── Insertar owner como host ──────────────────────────────────────────────
  // throwOnError: false — workspace sigue siendo usable aunque falle esta fila
  await safeUpsertWorkspaceMember(ws.id, userId, 'host', false)

  return toApp(ws, 'host')
}

// ─── getOrCreateDefaultWorkspace ─────────────────────────────────────────────
// Solo crea "Mi espacio" cuando el usuario no tiene absolutamente ningún workspace.
// NO se llama automáticamente al login — WorkspaceContext llama fetchUserWorkspaces
// directamente y usa esta solo para el onboarding inicial.
export async function getOrCreateDefaultWorkspace(userId) {
  const existing = await fetchUserWorkspaces(userId)
  if (existing.length > 0) return existing

  console.log('[Workspaces] First-time user — creating default "Mi espacio"')
  const created = await createWorkspace('Mi espacio', userId)
  return [created]
}

// ─── Workspace members ────────────────────────────────────────────────────────

export async function fetchWorkspaceMembers(workspaceId) {
  try {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('user_id, role, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Workspaces] fetchWorkspaceMembers error:', error)
      return []
    }

    return (data ?? []).map((r) => ({
      userId:   r.user_id,
      role:     r.role,
      email:    null,
      fullName: null,
    }))
  } catch (e) {
    console.error('[Workspaces] fetchWorkspaceMembers exception:', e)
    return []
  }
}

/**
 * Inserta un miembro en workspace_members.
 *
 * Punto de entrada explícito — solo se llama desde:
 *   • createWorkspace (owner → host)
 *   • addToWorkspaceMember / addMemberFromContact / inviteByEmail (colaborador)
 *
 * Errores:
 *   - duplicate (409 / 23505) → silencioso
 *   - FK (23503)               → warning
 *   - otros                    → lanza
 */
export async function insertWorkspaceMember(workspaceId, userId, role = 'colaborador') {
  await safeUpsertWorkspaceMember(workspaceId, userId, role, true)
}

export async function removeWorkspaceMember(workspaceId, userId) {
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) {
    console.error('[Workspaces] removeWorkspaceMember error:', error)
    throw error
  }
}
