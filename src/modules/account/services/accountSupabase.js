import { supabase } from '../../../lib/supabaseClient'

// ─── resolveAuthEmail ─────────────────────────────────────────────────────────
// Obtiene el email del usuario desde la sesión activa.
// Usa authEmail si ya está disponible; si no, llama a auth.getUser() como
// fallback para garantizar que siempre tengamos el email real.
async function resolveAuthEmail(authEmail) {
  const fromSession = authEmail?.trim().toLowerCase() || null
  if (fromSession) return fromSession

  const { data: { user } } = await supabase.auth.getUser()
  const fromAuth = user?.email?.trim().toLowerCase() || null

  if (!fromAuth) console.warn('[Account] resolveAuthEmail: sin email en auth session')
  return fromAuth
}

// ─── ensureProfileEmail ───────────────────────────────────────────────────────
// Si el perfil existe pero no tiene email, lo sincroniza desde auth y devuelve
// el perfil actualizado.  Si la actualización falla, devuelve el perfil original
// sin bloquear el flujo de login.
async function ensureProfileEmail(profile, resolvedEmail) {
  if (profile.email?.trim()) return profile   // ya tiene email — no tocar

  if (!resolvedEmail) {
    console.warn('[Account] ensureProfileEmail: sin email disponible para perfil', profile.id)
    return profile
  }

  const { data: updated, error } = await supabase
    .from('profiles')
    .update({ email: resolvedEmail })
    .eq('id', profile.id)
    .select('id, full_name, email')
    .single()

  if (error) {
    console.warn('[Account] ensureProfileEmail ⚠ no se pudo sincronizar email:', error.message)
    return profile
  }

  console.log('[Account] ensureProfileEmail ✅ email sincronizado desde auth →', profile.id)
  return updated
}

// ─── fetchAccountProfile ──────────────────────────────────────────────────────
//
// Busca el perfil del usuario logueado con dos estrategias:
//   1. auth_id = auth.uid()  — enlace canónico (perfil pre-creado + trigger)
//   2. id      = auth.uid()  — perfil creado directamente con id = auth.uid()
//
// Si no existe con ninguna de las dos → crea un perfil con email garantizado.
// En cualquier caso, si el perfil encontrado no tiene email → se sincroniza
// automáticamente desde auth antes de devolverlo.
//
export async function fetchAccountProfile(authUserId, authEmail) {
  console.log('[Account] fetchAccountProfile →', authUserId)

  // Email autoritativo: sesión → auth.getUser() → null
  const resolvedEmail = await resolveAuthEmail(authEmail)

  // ── Intento 1: buscar por auth_id ─────────────────────────────────────────
  const { data: byAuthId, error: err1 } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('auth_id', authUserId)
    .maybeSingle()

  if (err1) {
    console.error('[Account] fetchAccountProfile by auth_id ❌', err1.code, err1.message)
    throw new Error(`Error al cargar el perfil: ${err1.message}`)
  }

  if (byAuthId) {
    console.log('[Account] fetchAccountProfile ✅ (auth_id)', byAuthId.id)
    return ensureProfileEmail(byAuthId, resolvedEmail)
  }

  // ── Intento 2: buscar por id ──────────────────────────────────────────────
  const { data: byId, error: err2 } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', authUserId)
    .maybeSingle()

  if (err2) {
    console.error('[Account] fetchAccountProfile by id ❌', err2.code, err2.message)
    throw new Error(`Error al cargar el perfil: ${err2.message}`)
  }

  if (byId) {
    console.log('[Account] fetchAccountProfile ✅ (id)', byId.id)
    return ensureProfileEmail(byId, resolvedEmail)
  }

  // ── No existe perfil → crear con email garantizado ───────────────────────
  console.warn('[Account] Sin perfil — creando automáticamente para', authUserId)

  if (!resolvedEmail) {
    throw new Error('No se puede crear el perfil: email no disponible en la sesión de auth.')
  }

  const { data: created, error: createErr } = await supabase
    .from('profiles')
    .insert({ id: authUserId, auth_id: authUserId, email: resolvedEmail, full_name: '' })
    .select('id, full_name, email')
    .single()

  if (createErr) {
    console.error('[Account] auto-create ❌', createErr.code, createErr.message)
    throw new Error(`No se pudo inicializar el perfil: ${createErr.message}`)
  }

  console.log('[Account] Perfil creado automáticamente ✅', created.id)
  return created
}

// ─── updateFullName ───────────────────────────────────────────────────────────
//
// Actualiza profiles.full_name. profiles.id = auth.uid().
//
export async function updateFullName(profileId, fullName) {
  console.log('[Account] updateFullName →', profileId, fullName)

  const trimmed = fullName.trim()
  if (!trimmed) throw new Error('El nombre no puede estar vacío.')

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: trimmed })
    .eq('id', profileId)
    .select('id, full_name, email')
    .single()

  if (error) {
    console.error('[Account] updateFullName ❌', error.code, error.message)
    throw new Error(`Error al actualizar el nombre: ${error.message}`)
  }

  console.log('[Account] updateFullName ✅', data.id)
  return data
}

// ─── updatePassword ───────────────────────────────────────────────────────────

export async function updatePassword(newPassword) {
  console.log('[Account] updatePassword →')

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    console.error('[Account] updatePassword ❌', error.code, error.message)
    throw new Error(`Error al cambiar la contraseña: ${error.message}`)
  }

  console.log('[Account] updatePassword ✅')
}
