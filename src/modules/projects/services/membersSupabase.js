import { supabase } from '../../../lib/supabaseClient'

// ─── DB operations ────────────────────────────────────────────────────────────

/**
 * Rol del usuario en un proyecto concreto.
 *
 * Reglas (en orden de prioridad):
 *   1. projects.created_by === userId → 'owner'  (sin query extra si se pasa createdBy)
 *   2. project_members.role           → role almacenado
 *   3. Sin membresía                  → null
 *
 * @param {string}      projectId
 * @param {string}      userId
 * @param {string|null} createdBy — si ya tienes projects.created_by, pásalo para
 *                                  evitar una query extra; si no, se consulta la DB.
 * @returns {Promise<'owner'|'collaborator'|'client'|null>}
 */
export async function getUserProjectRole(projectId, userId, createdBy = null) {
  if (!projectId || !userId) return null

  // ── Regla 1: el creador siempre es owner ─────────────────────────────────
  if (createdBy !== null) {
    if (createdBy === userId) return 'owner'
  } else {
    const { data: proj, error: pErr } = await supabase
      .from('projects')
      .select('created_by')
      .eq('id', projectId)
      .maybeSingle()

    if (pErr) throw new Error(`getUserProjectRole: ${pErr.message}`)
    if (proj?.created_by === userId) return 'owner'
  }

  // ── Regla 2: buscar en project_members ───────────────────────────────────
  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`getUserProjectRole: ${error.message}`)

  // ── Regla 3: sin membresía → null (sin fallback silencioso) ──────────────
  return data?.role ?? null
}

/**
 * Inserta un usuario invitado en project_members.
 *
 * Reglas:
 *   - Solo acepta roles 'collaborator' | 'client' — el owner nunca va aquí.
 *   - Verifica en DB que userId NO sea el creador del proyecto antes de insertar.
 *     Si lo fuera, lanza un error descriptivo (no inserta silenciosamente).
 *   - Dedup: si ya existe una fila (project_id, user_id) lanza error claro.
 */
export async function insertMembership(projectId, userId, role = 'collaborator') {
  if (!projectId || !userId || !role) {
    throw new Error('insertMembership: project_id, user_id y role son obligatorios.')
  }

  // project_members solo admite roles de invitados — el owner vive en projects.created_by
  const VALID_ROLES = ['collaborator', 'client']
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`insertMembership: role "${role}" no es válido. Usa: ${VALID_ROLES.join(', ')}.`)
  }

  // ── Guard: rechazar si userId es el owner del proyecto ───────────────────
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('created_by')
    .eq('id', projectId)
    .maybeSingle()

  if (projErr) throw new Error(`insertMembership: no se pudo verificar el owner: ${projErr.message}`)

  if (project?.created_by === userId) {
    throw new Error(
      'El owner del proyecto no puede ser insertado en project_members. ' +
      'Su membresía está definida por projects.created_by.'
    )
  }

  // ── Insert ────────────────────────────────────────────────────────────────
  console.log('[Members] insertMembership →', { projectId, userId, role })

  const { data, error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: userId, role, status: 'active' })
    .select()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este usuario ya es miembro del proyecto.')
    }
    console.error('[Members] insertMembership ❌', error.code, error.message)
    throw error
  }

  console.log('[Members] insertMembership ✅', data[0]?.user_id, '→', role)
  return data[0]
}

/**
 * Lista completa de miembros de un proyecto.
 *
 * Incluye:
 *   - Miembros activos (user_id IS NOT NULL, status = 'active')
 *   - Invitaciones pendientes (user_id IS NULL, status = 'pending') — marcadas con isPending: true
 *   - El owner (projects.created_by) — construido manualmente, isOwner: true
 *
 * @param {string}      projectId
 * @param {string|null} ownerId — projects.created_by
 * @returns {Promise<Array<{userId, role, status, email, fullName, createdAt, isOwner, isPending}>>}
 */
export async function fetchProjectMembers(projectId, ownerId = null) {
  // ── 1. Fetch project_members — incluye activos Y pendientes ──────────────
  // Seleccionamos email directamente de la fila (para invitaciones pending donde user_id = null)
  // y también el join a profiles (para miembros activos con user_id).
  const { data, error } = await supabase
    .from('project_members')
    .select('user_id, role, status, email, created_at, profiles(email, full_name)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  let rows = []

  if (error) {
    // FK a profiles no existe aún — fallback sin join
    console.warn('[Members] fetchProjectMembers join failed, plain fetch:', error.message)

    const { data: plain, error: plainErr } = await supabase
      .from('project_members')
      .select('user_id, role, status, email, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (plainErr) {
      console.error('[Members] fetchProjectMembers plain ❌', plainErr)
      rows = []
    } else {
      rows = (plain ?? []).map((r) => ({
        userId:    r.user_id    ?? null,
        role:      r.role       ?? 'collaborator',
        status:    r.status     ?? 'active',
        createdAt: r.created_at ?? null,
        email:     r.email      ?? null,
        fullName:  null,
        isOwner:   false,
        isPending: r.status === 'pending',
      }))
    }
  } else {
    rows = (data ?? []).map((r) => {
      const isPending = r.status === 'pending' || r.user_id === null
      return {
        userId:    r.user_id             ?? null,
        role:      r.role                ?? 'collaborator',
        status:    r.status              ?? 'active',
        createdAt: r.created_at          ?? null,
        // Para activos: email viene del perfil. Para pending: email viene directo de la fila.
        email:     r.profiles?.email     ?? r.email ?? null,
        fullName:  r.profiles?.full_name ?? null,
        isOwner:   false,
        isPending,
      }
    })
  }

  // ── 2. Añadir owner al principio si se proporcionó ownerId ────────────────
  // Por diseño, el owner NO tiene fila en project_members — su membresía viene
  // de projects.created_by. Lo construimos manualmente y lo ponemos primero.
  if (ownerId) {
    const ownerRowIdx = rows.findIndex((r) => r.userId === ownerId)

    if (ownerRowIdx !== -1) {
      // Invariante violado: el owner tiene fila en project_members.
      // Lo eliminamos de la lista y lo reconstruimos al principio con isOwner: true
      // para no mostrar una entrada duplicada o con rol incorrecto.
      console.warn(
        '[Members] fetchProjectMembers: el owner tiene fila en project_members — ' +
        'esto no debería ocurrir. Se normaliza la entrada.',
        { projectId, ownerId }
      )
      rows.splice(ownerRowIdx, 1)
    }

    // Fetch del perfil del owner para mostrar nombre/email
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', ownerId)
      .maybeSingle()

    rows.unshift({
      userId:    ownerId,
      role:      'owner',
      createdAt: null,
      email:     ownerProfile?.email     ?? null,
      fullName:  ownerProfile?.full_name ?? null,
      isOwner:   true,   // fuente de verdad: createdBy, NO project_members.role
    })
  }

  console.log('[Members] fetchProjectMembers ✅', rows.length, 'miembros (owner incluido)')
  return rows
}

/** Change a member's role. */
export async function updateMemberRole(projectId, userId, role) {
  const { error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) throw error
}

/** Remove a member from a project. */
export async function removeMember(projectId, userId) {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * El usuario sale voluntariamente del proyecto.
 * La validación de que no sea el owner debe hacerse ANTES de llamar esta función
 * (en el hook useProjectMember.leaveProject).
 */
export async function leaveProject(projectId, userId) {
  if (!projectId || !userId) {
    throw new Error('leaveProject: projectId y userId son obligatorios.')
  }

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) throw error
}

// ─── Contact sync helpers ─────────────────────────────────────────────────────

/**
 * Crea un contacto ownerProfile → contactProfile si no existe aún.
 *
 * Reglas:
 *   - email obligatorio en contactProfile — nunca inserta con email vacío
 *   - no autocontacto (ownerProfile.id === contactProfile.id)
 *   - dedup por (owner_id + email): más fiable que buscar por contact_user_id
 *     porque un contacto puede haberse creado como pending (sin contact_user_id)
 *   - si existe con contact_user_id null → upgrade a active (preserve alias)
 *   - si ya existe con cualquier contact_user_id → no tocar
 *
 * Nunca lanza — los errores se loguean y se ignoran.
 */
/**
 * Crea un contacto owner → contact.
 *
 * Email:
 *   Si contact_user_id existe → obtener desde profiles (fuente autoritativa).
 *   Fallback: usar contactProfile.email si profiles no devuelve resultado.
 *   Sin email en ninguna fuente → descartar (nunca inserta sin email).
 *
 * Dedup:
 *   Upsert con onConflict(owner_id, contact_user_id) + ignoreDuplicates.
 *   Si ya existe un contacto con ese par → no se crea otro, no se sobreescribe.
 *   Si existe un pending por email (contact_user_id null) → se upgradea antes del upsert.
 *
 * Nunca lanza.
 */
async function createContactOneWay(ownerProfile, contactProfile) {
  if (ownerProfile.id === contactProfile.id) return  // no autocontacto

  // ── 1. Resolver email y full_name desde profiles ──────────────────────────
  let email    = null
  let fullName = contactProfile.full_name?.trim() || null

  if (contactProfile.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', contactProfile.id)
      .maybeSingle()

    email    = profile?.email?.trim().toLowerCase() || null
    fullName = fullName || profile?.full_name?.trim() || null
  }

  if (!email) email = contactProfile.email?.trim().toLowerCase() || null

  if (!email) {
    console.warn('[Contacts] createContactOneWay: sin email, descartado →', contactProfile.id)
    return
  }

  try {
    // ── 2. Upgrade de pending por email (si existe y aún no tiene contact_user_id) ──
    // Cubre el caso donde el contacto fue creado manualmente con email pero sin cuenta.
    if (contactProfile.id && email) {
      const { data: pending } = await supabase
        .from('contacts')
        .select('id, contact_user_id')
        .eq('owner_id', ownerProfile.id)
        .ilike('email', email)
        .is('contact_user_id', null)
        .maybeSingle()

      if (pending) {
        await supabase
          .from('contacts')
          .update({ contact_user_id: contactProfile.id, status: 'active' })
          .eq('id', pending.id)
        return  // ya upgradado — no insertar duplicado
      }
    }

    // ── 3. Upsert con dedup en DB por (owner_id, contact_user_id) ─────────
    // ignoreDuplicates: si ya existe ese par, no hace nada (preserva alias).
    const { error } = await supabase
      .from('contacts')
      .upsert(
        {
          owner_id:        ownerProfile.id,
          contact_user_id: contactProfile.id,
          email,
          full_name:       fullName ?? '',
          type:            'collaborator',
          status:          'active',
        },
        { onConflict: 'owner_id,contact_user_id', ignoreDuplicates: true }
      )

    if (error) {
      console.warn('[Contacts] createContactOneWay ⚠',
        ownerProfile.id, '→', contactProfile.id, ':', error.message)
    }
  } catch (e) {
    console.warn('[Contacts] createContactOneWay exception ⚠', e?.message)
  }
}

/**
 * Crea contactos bidireccionales al agregar un usuario a un proyecto.
 *
 * A → B:  owner_id=A, contact_user_id=B, email=B.email (desde profiles)
 * B → A:  owner_id=B, contact_user_id=A, email=A.email (desde profiles)
 *
 * Email siempre se obtiene desde profiles — nunca queda vacío.
 * Cada dirección es independiente: si una falla la otra continúa.
 * No bloquea ni lanza.
 *
 * @param {string} userIdA — owner del proyecto (quien invita)
 * @param {string} userIdB — usuario recién agregado a project_members
 */
async function syncContactsAfterMembership(userIdA, userIdB) {
  if (!userIdA || !userIdB || userIdA === userIdB) return

  // Fetch de perfiles en paralelo — el email vendrá de aquí
  const [resA, resB] = await Promise.all([
    supabase.from('profiles').select('id, email, full_name').eq('id', userIdA).maybeSingle(),
    supabase.from('profiles').select('id, email, full_name').eq('id', userIdB).maybeSingle(),
  ])

  const pA = resA.data ?? { id: userIdA }  // al menos el id para el lookup secundario
  const pB = resB.data ?? { id: userIdB }

  // Ambas direcciones en paralelo; allSettled garantiza que un fallo no cancela la otra
  await Promise.allSettled([
    createContactOneWay(pA, pB),  // A → B
    createContactOneWay(pB, pA),  // B → A  (puede fallar por RLS; reintento vía syncIncomingContacts)
  ])

  console.log('[Contacts] syncContactsAfterMembership ✅', userIdA, '↔', userIdB)
}

// ─── Workspace member helper ──────────────────────────────────────────────────

/**
 * Inserta al usuario invitado en workspace_members para el workspace del proyecto.
 *
 * Se llama explícitamente al agregar un miembro (addMemberFromContact, inviteByEmail).
 * No se llama en lecturas ni en efectos secundarios de carga.
 *
 * Flujo:
 *   1. Busca workspace_id del proyecto.
 *   2. Verifica si ya existe la fila (workspace_id, user_id) → si existe, no-op.
 *   3. Upsert con ignoreDuplicates como red de seguridad.
 *
 * Errores:
 *   - 409 / 23505 → ignorar (ya existe)
 *   - 23503        → warning (FK no disponible todavía)
 *   - otros        → warning (no bloquea la UI)
 *
 * Nunca lanza.
 */
async function addToWorkspaceMembersIfNeeded(projectId, userId) {
  try {
    // ── 1. Resolver workspace_id ─────────────────────────────────────────
    const { data: project } = await supabase
      .from('projects')
      .select('workspace_id')
      .eq('id', projectId)
      .maybeSingle()

    if (!project?.workspace_id) return

    const workspaceId = project.workspace_id

    // ── 2. Pre-check: ya existe → no-op ─────────────────────────────────
    const { data: existing } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      console.log('[Workspaces] addToWorkspaceMembersIfNeeded: ya existe →', workspaceId, userId)
      return
    }

    // ── 3. Upsert ────────────────────────────────────────────────────────
    const { error } = await supabase
      .from('workspace_members')
      .upsert(
        { workspace_id: workspaceId, user_id: userId, role: 'colaborador' },
        { onConflict: 'workspace_id,user_id', ignoreDuplicates: true }
      )

    if (error) {
      const code = error.code ?? ''
      if (code === '23505' || code === '409') {
        console.log('[Workspaces] addToWorkspaceMembersIfNeeded: duplicate ignorado →', code)
      } else if (code === '23503') {
        console.warn('[Workspaces] addToWorkspaceMembersIfNeeded: FK ⚠ (ignorado):', error.message)
      } else {
        console.warn('[Workspaces] addToWorkspaceMembersIfNeeded ❌', code, error.message)
      }
    } else {
      console.log('[Workspaces] workspace_members ✅', workspaceId, '→', userId)
    }
  } catch (e) {
    console.warn('[Workspaces] addToWorkspaceMembersIfNeeded exception ⚠', e?.message)
  }
}

// ─── Contact-based membership ─────────────────────────────────────────────────

/**
 * Agrega (o registra como pendiente) un contacto en el proyecto.
 *
 * CASO 1 — contact_user_id presente (usuario registrado):
 *   - Verifica que no sea el owner ni un miembro duplicado.
 *   - Inserta en project_members con user_id = contact_user_id.
 *   - Retorna { type: 'added', member }
 *
 * CASO 2 — contact_user_id null (sin cuenta):
 *   - No toca project_members — solo usuarios reales aparecen como miembros.
 *   - Retorna { type: 'pending', contact }
 *
 * La validación de permiso (solo el owner puede invitar) se hace en el hook.
 *
 * @param {string} projectId
 * @param {object} contact  — { contact_user_id, email, full_name, ... }
 * @param {string} role     — 'collaborator' | 'client'
 * @param {string} ownerId  — projects.created_by
 * @returns {Promise<{ type: 'added', member } | { type: 'pending', contact }>}
 */
export async function addMemberFromContact(projectId, contact, role, ownerId) {
  const label = contact?.full_name ?? contact?.email ?? 'desconocido'

  // ── CASO 2: sin cuenta → no insertar, devolver pending ──────────────────
  if (!contact?.contact_user_id) {
    console.log('[Members] addMemberFromContact → pending (sin cuenta):', contact?.email)
    return { type: 'pending', contact }
  }

  // ── CASO 1: con cuenta ───────────────────────────────────────────────────

  // Guard: el owner ya tiene acceso vía projects.created_by
  if (ownerId && contact.contact_user_id === ownerId) {
    throw new Error('El owner del proyecto ya tiene acceso completo. No necesita ser agregado como miembro.')
  }

  // Dedup: ya existe membresía activa para este user_id
  const { data: existing, error: dupErr } = await supabase
    .from('project_members')
    .select('user_id, status')
    .eq('project_id', projectId)
    .eq('user_id', contact.contact_user_id)
    .maybeSingle()

  if (dupErr) throw new Error(`addMemberFromContact (dup check): ${dupErr.message}`)
  if (existing) {
    const statusLabel = existing.status === 'pending' ? 'invitación pendiente' : 'membresía activa'
    throw new Error(`${label} ya tiene una ${statusLabel} en este proyecto.`)
  }

  // Insertar en project_members
  const member = await insertMembership(projectId, contact.contact_user_id, role)
  console.log('[Members] addMemberFromContact ✅ added:', label, '→', member?.user_id)

  // Backfill workspace_members para el usuario invitado (no bloquea)
  addToWorkspaceMembersIfNeeded(projectId, contact.contact_user_id).catch(() => {})

  // Sincronizar contactos en ambos sentidos (no bloquea si falla)
  syncContactsAfterMembership(ownerId, contact.contact_user_id).catch((e) =>
    console.warn('[Contacts] sync post-addMemberFromContact ⚠', e?.message)
  )

  return { type: 'added', member }
}

/**
 * Devuelve los contactos del owner que aún NO están en el proyecto.
 *
 * Un contacto se considera "ya en el proyecto" cuando su contact_user_id coincide con
 * un user_id en project_members, O cuando es el propio owner (acceso vía created_by).
 *
 * Los contactos sin contact_user_id se incluyen en la lista pero con `canAdd: false`,
 * para que la UI pueda mostrarlos desactivados con un tooltip de "sin cuenta".
 *
 * @param {string} projectId
 * @param {string} ownerId  — auth.uid() del dueño del proyecto (contacts.owner_id)
 * @returns {Promise<Array<contact & { canAdd: boolean }>>}
 */
export async function getAvailableContactsForProject(projectId, ownerId, currentUserEmail = null) {
  if (!projectId || !ownerId) return []

  // ── 1. Obtener todas las filas del proyecto: user_id Y email ────────────
  // Necesitamos ambas columnas para excluir:
  //   a) miembros activos  → por user_id  (contact.contact_user_id ∈ alreadyInByUserId)
  //   b) invitaciones pend → por email    (contact.email ∈ alreadyInByEmail)
  const { data: memberRows, error: memberErr } = await supabase
    .from('project_members')
    .select('user_id, email')
    .eq('project_id', projectId)

  if (memberErr) throw new Error(`getAvailableContactsForProject (members): ${memberErr.message}`)

  // Set de user_ids ya en el proyecto (incluye ownerId — acceso via created_by)
  const alreadyInByUserId = new Set([
    ownerId,
    ...(memberRows ?? []).map((r) => r.user_id).filter(Boolean),
  ])

  // Set de emails con invitación pendiente (user_id = null, email presente)
  const alreadyInByEmail = new Set(
    (memberRows ?? [])
      .filter((r) => !r.user_id && r.email)
      .map((r) => r.email.toLowerCase())
  )

  // ── 2. Obtener todos los contactos del owner (excluyendo autocontacto a nivel DB) ──
  const { data: contacts, error: contactErr } = await supabase
    .from('contacts')
    .select('id, contact_user_id, email, full_name, type, status')
    .eq('owner_id', ownerId)
    // Excluir filas donde contact_user_id = ownerId (autocontacto).
    // .neq excluye también NULL, así que se usa .or para conservar los pending.
    .or(`contact_user_id.is.null,contact_user_id.neq.${ownerId}`)
    .order('full_name', { ascending: true })

  if (contactErr) throw new Error(`getAvailableContactsForProject (contacts): ${contactErr.message}`)

  // ── 3. Filtrar y anotar canAdd ───────────────────────────────────────────
  const normalizedOwnerEmail = currentUserEmail?.trim().toLowerCase() ?? null

  return (contacts ?? [])
    .filter((c) => {
      // Excluir por email (cubre pending cuyo email coincide con el owner)
      if (normalizedOwnerEmail && c.email?.toLowerCase() === normalizedOwnerEmail) return false
      // Excluir si ya es miembro activo (tiene cuenta y está en el proyecto)
      if (c.contact_user_id && alreadyInByUserId.has(c.contact_user_id)) return false
      // Excluir si ya tiene invitación pendiente por email
      if (c.email && alreadyInByEmail.has(c.email.toLowerCase())) return false
      return true
    })
    .map((c) => ({
      ...c,
      // canAdd: tiene cuenta registrada (contact_user_id) — sin ella no se puede crear la membresía
      canAdd: Boolean(c.contact_user_id),
    }))
}

/**
 * Invita un usuario por email.
 *
 * Flujo:
 *   A) Email encontrado en profiles → inserta en project_members con user_id, status='active'
 *   B) Email NO encontrado          → inserta en project_members con user_id=null,
 *                                     email=normalizedEmail, status='pending'
 *
 * Resultado (retorno):
 *   { type: 'added',   member, profile }  — perfil existía; fila activa creada
 *   { type: 'pending', member, email }    — sin cuenta; fila pendiente creada
 *
 * Errores lanzados (para la UI):
 *   — email del owner
 *   — ya es miembro activo (por user_id)
 *   — ya tiene invitación pendiente (por email)
 *   — error de DB
 *
 * La validación de permiso (!isOwner) se hace en el hook, no aquí.
 *
 * @param {string} projectId
 * @param {string} email
 * @param {string} role     — 'collaborator' | 'client'
 * @param {string} ownerId  — projects.created_by (para validación anti-owner)
 */
export async function inviteByEmail(projectId, email, role, ownerId) {
  const normalizedEmail = email.trim().toLowerCase()

  // ── 1. ¿Existe ya un perfil con ese email? ───────────────────────────────
  const profile = await findUserByEmail(normalizedEmail)

  if (profile) {
    // ── A. Tiene cuenta: validar y agregar directamente ───────────────────

    // No se puede re-invitar al owner
    if (profile.id === ownerId) {
      throw new Error('Este email pertenece al owner del proyecto, que ya tiene acceso completo.')
    }

    // No se puede duplicar una membresía activa
    const { data: existing, error: dupErr } = await supabase
      .from('project_members')
      .select('user_id, status')
      .eq('project_id', projectId)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (dupErr) throw new Error(`inviteByEmail (dup check): ${dupErr.message}`)
    if (existing) {
      const label = existing.status === 'pending' ? 'invitación pendiente' : 'membresía activa'
      throw new Error(`${normalizedEmail} ya tiene una ${label} en este proyecto.`)
    }

    // Insertar fila activa
    const { data: member, error: insertErr } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: profile.id, role, status: 'active' })
      .select()
      .single()

    if (insertErr) throw new Error(`inviteByEmail (insert active): ${insertErr.message}`)
    console.log('[Members] inviteByEmail ✅ added:', normalizedEmail, '→', member.user_id)

    // Backfill workspace_members para el usuario invitado (no bloquea)
    addToWorkspaceMembersIfNeeded(projectId, profile.id).catch(() => {})

    // Sincronizar contactos en ambos sentidos (no bloquea si falla)
    syncContactsAfterMembership(ownerId, profile.id).catch((e) =>
      console.warn('[Contacts] sync post-inviteByEmail ⚠', e?.message)
    )

    return { type: 'added', member, profile }
  }

  // ── B. Sin cuenta: insertar fila pendiente directamente en project_members ─
  // No consultamos contacts — la invitación vive en project_members.

  // Evitar invitación duplicada para el mismo email en el mismo proyecto
  const { data: existingPending, error: pendingCheckErr } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .ilike('email', normalizedEmail)
    .maybeSingle()

  if (pendingCheckErr) throw new Error(`inviteByEmail (pending check): ${pendingCheckErr.message}`)
  if (existingPending) {
    throw new Error(`Ya existe una invitación pendiente para ${normalizedEmail} en este proyecto.`)
  }

  // Insertar fila pendiente — user_id es null, email es el identificador
  const { data: member, error: insertErr } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: null, email: normalizedEmail, role, status: 'pending' })
    .select()
    .single()

  if (insertErr) throw new Error(`inviteByEmail (insert pending): ${insertErr.message}`)
  console.log('[Members] inviteByEmail ✅ pending:', normalizedEmail)
  return { type: 'pending', member, email: normalizedEmail }
}

/**
 * Busca un usuario registrado por email.
 * Devuelve { id, email, full_name } o null si no existe.
 *
 * profiles.id = auth.uid() — sin columna auth_id.
 * El id devuelto se usa directamente en project_members.user_id.
 */
export async function findUserByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .ilike('email', email.trim())
      .maybeSingle()

    if (error) {
      console.warn('[Members] findUserByEmail error:', error.message)
      return null
    }
    if (!data) return null

    return {
      id:        data.id,
      email:     data.email,
      full_name: data.full_name,
    }
  } catch (e) {
    console.warn('[Members] findUserByEmail exception:', e?.message)
    return null
  }
}

// ─── Permission helpers ───────────────────────────────────────────────────────
// Per-project role: 'owner' | 'collaborator' | 'client' | null (no membership)
//   owner       — project creator; full admin access
//   collaborator — can create / edit / delete tasks
//   client      — read-only (view tasks and status only)

export const ROLE_LABELS = {
  owner:        'Owner',
  collaborator: 'Colaborador',
  client:       'Cliente',
}

/** Can the user see the project at all? */
export function canViewProject(role)   { return role !== null }

/** Can the user create / edit task content (name, description, dates)? */
export function canEditTask(role)      { return role === 'owner' || role === 'collaborator' }

/** Can the user delete tasks? */
export function canDeleteTask(role)    { return role === 'owner' || role === 'collaborator' }

/** Can the user change a task's status? (All members can.) */
export function canChangeStatus(role)  { return role !== null }

/** Can the user edit the project's own fields (name, description, due date)? */
export function canEditProject(role)   { return role === 'owner' }

/** Can the user delete the project? */
export function canDeleteProject(role) { return role === 'owner' }

/** Can the user see the Quotes tab? */
export function canViewQuotes(role)    { return role === 'owner' || role === 'collaborator' }

/** Can the user manage project members (invite / change role / remove)? */
export function canManageMembers(role) { return role === 'owner' }

// ─── Brief permissions ────────────────────────────────────────────────────────

/**
 * Can the user edit `responses_json`?
 * All authenticated members can fill in the brief answers.
 */
export function canEditBriefResponses(role) { return role !== null }

/**
 * Can the user edit `template_json`?
 * Only the owner can modify the brief's structure/questions.
 */
export function canEditBriefTemplate(role)  { return role === 'owner' }

/**
 * Can the user change the brief's status (draft → in_progress → completed)?
 * Only the owner controls the lifecycle.
 */
export function canChangeBriefStatus(role)  { return role === 'owner' }
