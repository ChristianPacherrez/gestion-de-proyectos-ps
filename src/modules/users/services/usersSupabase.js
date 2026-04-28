import { supabase } from '../../../lib/supabaseClient'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeInitials(name) {
  if (!name?.trim()) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

// ─── Mapper DB → app ──────────────────────────────────────────────────────────
// contacts: id, owner_id, full_name, email, type, status, contact_user_id, created_at
//
// `role` = `type` — se expone como `role` para que todos los consumidores
// existentes (MeetingsPage, ROLES config) sigan funcionando sin cambios.
function toApp(row) {
  const name = row.full_name ?? ''
  return {
    id:               row.id,
    name,
    initials:         computeInitials(name),
    email:            row.email            ?? '',
    type:             row.type             ?? 'collaborator',
    role:             row.type             ?? 'collaborator',   // alias para consumidores legacy
    status:           row.status           ?? 'active',
    contact_user_id:  row.contact_user_id  ?? null,
  }
}

// ─── fetchContacts ────────────────────────────────────────────────────────────
/**
 * Carga los contactos del usuario autenticado, excluyendo al propio usuario.
 *
 * El owner nunca debe aparecer en su propia lista de contactos.
 * Se excluye por contact_user_id O por email (cubre contactos con o sin cuenta).
 *
 * @param {string} ownerId           — auth.uid()
 * @param {string} currentUserEmail  — auth email del usuario activo
 */
export async function fetchContacts(ownerId, currentUserEmail = null) {
  console.log('[Contacts] fetchContacts → ownerId:', ownerId)

  const { data, error } = await supabase
    .from('contacts')
    .select('id, full_name, email, type, status, contact_user_id, created_at')
    .eq('owner_id', ownerId)
    // Excluir autocontacto a nivel de DB.
    // .neq solo excluye no-null, por eso se usa .or para conservar los pending (contact_user_id null).
    .or(`contact_user_id.is.null,contact_user_id.neq.${ownerId}`)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('[Contacts] fetchContacts ❌', error.code, error.message)
    throw error
  }

  // Excluir también por email (cubre contactos sin contact_user_id cuyo email coincide con el owner)
  const normalizedOwnerEmail = currentUserEmail?.trim().toLowerCase() ?? null
  const filtered = (data ?? []).filter((row) => {
    if (normalizedOwnerEmail && row.email?.toLowerCase() === normalizedOwnerEmail) return false
    return true
  })

  // Enriquecer email desde profiles para filas que tienen contact_user_id pero email vacío.
  // Ocurre cuando el contacto fue sincronizado antes de que se guardara el email en la fila.
  const needsEmail = filtered.filter((r) => !r.email?.trim() && r.contact_user_id)
  if (needsEmail.length) {
    const ids = needsEmail.map((r) => r.contact_user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', ids)

    if (profiles?.length) {
      const emailById = Object.fromEntries(profiles.map((p) => [p.id, p.email]))
      needsEmail.forEach((r) => {
        const resolved = emailById[r.contact_user_id]
        if (resolved) r.email = resolved
      })
    }
  }

  console.log('[Contacts] fetchContacts ✅', filtered.length, 'contactos (sin owner)')
  return filtered.map(toApp)
}

// ─── inviteContact ────────────────────────────────────────────────────────────
/**
 * Invita a un contacto por email.
 *
 * Flujo:
 *   1. Valida que el email no esté ya en los contactos del owner.
 *   2. Busca el email en `profiles`.
 *      - Encontrado → contact_user_id = profile.id, status = 'active'
 *      - No encontrado → contact_user_id = null,    status = 'pending'
 *   3. Inserta en contacts.
 *
 * El email no puede modificarse después de la creación.
 * No crea perfiles — solo registra la relación de contacto.
 *
 * @param {object} contact  — { id, name (alias, optional), email }
 * @param {string} ownerId  — auth.uid()
 * @returns {Promise<object>} — contacto creado (formato app)
 */
export async function inviteContact(contact, ownerId) {
  const normalizedEmail = contact.email?.trim().toLowerCase()
  console.log('[Contacts] inviteContact →', { email: normalizedEmail, alias: contact.name, ownerId })

  // ── 0. Email obligatorio ─────────────────────────────────────────────────
  if (!normalizedEmail) {
    throw new Error('El email es obligatorio para invitar un contacto.')
  }

  // ── 1. Dedup: ya existe este email para este owner ───────────────────────
  const { data: dup, error: dupErr } = await supabase
    .from('contacts')
    .select('id')
    .eq('owner_id', ownerId)
    .ilike('email', normalizedEmail)
    .maybeSingle()

  if (dupErr) throw new Error(`Error al verificar duplicados: ${dupErr.message}`)
  if (dup)    throw new Error(`Ya tienes un contacto con el email "${normalizedEmail}".`)

  // ── 2. Buscar perfil registrado ──────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', normalizedEmail)
    .maybeSingle()
  // No lanzamos si falla — si no hay perfil simplemente queda pending

  const contactUserId = profile?.id ?? null
  const status        = contactUserId ? 'active' : 'pending'

  console.log('[Contacts] inviteContact profile lookup →',
    contactUserId ? `found (${contactUserId})` : 'not found → pending')

  // ── 3. Insertar ──────────────────────────────────────────────────────────
  const row = {
    id:              contact.id,
    owner_id:        ownerId,
    full_name:       contact.name?.trim() ?? '',
    email:           normalizedEmail,
    type:            'collaborator',
    contact_user_id: contactUserId,
    status,
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert(row)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Ya existe un contacto con ese email o ID.')
    throw new Error(`Error al invitar contacto: ${error.message}`)
  }

  console.log('[Contacts] inviteContact ✅', data.id, '→ status:', status)
  return toApp(data)
}

// Alias mantenido para no romper imports existentes que aún usen createContact
export const createContact = inviteContact

// ─── updateContact ────────────────────────────────────────────────────────────
/**
 * Actualiza SOLO el alias (full_name) de un contacto.
 * El email es el identificador del contacto y no se puede cambiar desde la UI.
 * @param {object} contact — { id, name }
 */
export async function updateContact(contact) {
  const row = {
    full_name: contact.name?.trim() ?? '',
  }

  console.log('[Contacts] updateContact →', { id: contact.id, ...row })

  const { data, error } = await supabase
    .from('contacts')
    .update(row)
    .eq('id', contact.id)
    .select()
    .single()

  if (error) {
    console.error('[Contacts] updateContact ❌', error.code, error.message)
    throw new Error(`Error al actualizar contacto: ${error.message}`)
  }

  console.log('[Contacts] updateContact ✅', data.id)
  return toApp(data)
}

// ─── deleteContact ────────────────────────────────────────────────────────────
/**
 * Elimina un contacto.
 * No elimina project_members porque el contacto puede tener membresías activas
 * en proyectos — esas se gestionan desde la vista del proyecto.
 */
export async function deleteContact(id) {
  console.log('[Contacts] deleteContact →', id)

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[Contacts] deleteContact ❌', error.code, error.message)
    throw new Error(`Error al eliminar contacto: ${error.message}`)
  }

  console.log('[Contacts] deleteContact ✅', id)
}

// ─── syncIncomingContacts ─────────────────────────────────────────────────────
/**
 * Crea contactos para los owners de proyectos donde este usuario es miembro activo.
 *
 * Resuelve la dirección B→A de syncContactsAfterMembership: cuando A invitó a B,
 * auth.uid()=A bloqueó el INSERT owner_id=B. Esta función corre como B y lo completa.
 *
 * Dedup por (owner_id + contact_user_id):
 *   Fetch batch de contactos existentes → split en toInsert / toFillIn.
 *   toInsert  — no existe ningún contacto con ese contact_user_id → INSERT
 *   toFillIn  — existe pero tiene email o full_name vacíos → UPDATE solo esos campos
 *
 * Idempotente: puede llamarse múltiples veces sin duplicar ni sobreescribir datos.
 * 409 / 23505 tratados como "ok silencioso".
 * No lanza.
 *
 * @param {string} userId           — auth.uid() del usuario logueado
 * @param {string} currentUserEmail — para excluirse a sí mismo por email
 */
export async function syncIncomingContacts(userId, currentUserEmail = null) {
  if (!userId) return

  try {
    // 1. Proyectos donde este usuario es miembro activo
    const { data: memberships } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (!memberships?.length) return

    const projectIds = memberships.map((m) => m.project_id)

    // 2. Owners de esos proyectos (excluir al propio usuario)
    const { data: projects } = await supabase
      .from('projects')
      .select('created_by')
      .in('id', projectIds)
      .not('created_by', 'is', null)
      .neq('created_by', userId)

    if (!projects?.length) return

    const ownerIds = [...new Set(projects.map((p) => p.created_by))]

    // 3. Perfiles de los owners — normalizar y descartar los que no tienen email
    const { data: rawProfiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', ownerIds)

    if (!rawProfiles?.length) return

    const normalizedSelf = currentUserEmail?.trim().toLowerCase() ?? null

    const profiles = rawProfiles
      .map((p) => ({
        id:        p.id,
        email:     p.email?.trim().toLowerCase() || null,
        full_name: p.full_name?.trim()           || null,
      }))
      .filter((p) => {
        if (!p.email) {
          console.warn('[Contacts] syncIncomingContacts: sin email, descartado', p.id)
          return false
        }
        if (normalizedSelf && p.email === normalizedSelf) return false  // no autocontacto
        return true
      })

    if (!profiles.length) return

    // 4. Contactos existentes para este owner — dedup por contact_user_id
    const profileIds = profiles.map((p) => p.id)

    const { data: existing } = await supabase
      .from('contacts')
      .select('id, contact_user_id, email, full_name')
      .eq('owner_id', userId)
      .in('contact_user_id', profileIds)

    const existingMap = new Map((existing ?? []).map((c) => [c.contact_user_id, c]))

    // 5. Clasificar cada perfil
    const toInsert = []   // no existe contacto con ese contact_user_id
    const toFillIn = []   // existe pero tiene email o full_name vacíos

    for (const profile of profiles) {
      const found = existingMap.get(profile.id)

      if (!found) {
        toInsert.push(profile)
      } else {
        // Solo rellenar campos vacíos — nunca sobreescribir datos existentes
        const patch = {}
        if (!found.email?.trim()     && profile.email)     patch.email     = profile.email
        if (!found.full_name?.trim() && profile.full_name) patch.full_name = profile.full_name
        if (Object.keys(patch).length) toFillIn.push({ id: found.id, patch })
      }
    }

    // 6. Upsert de nuevos — ignoreDuplicates como red de seguridad ante race conditions
    //    409 / 23505 son "ok silencioso": la fila ya existe, no hay nada que hacer
    if (toInsert.length) {
      const rows = toInsert.map((p) => ({
        owner_id:        userId,
        contact_user_id: p.id,
        email:           p.email,
        full_name:       p.full_name ?? '',
        type:            'collaborator',
        status:          'active',
      }))

      const { error } = await supabase
        .from('contacts')
        .upsert(rows, { onConflict: 'owner_id,contact_user_id', ignoreDuplicates: true })

      if (error && error.code !== '23505' && error.code !== '409') {
        console.warn('[Contacts] syncIncomingContacts upsert ⚠', error.message)
      }
    }

    // 7. Rellenar campos vacíos en contactos existentes (sin sobreescribir)
    if (toFillIn.length) {
      await Promise.allSettled(
        toFillIn.map(({ id, patch }) =>
          supabase.from('contacts').update(patch).eq('id', id)
        )
      )
    }

    const total = toInsert.length + toFillIn.length
    if (total > 0) {
      console.log('[Contacts] syncIncomingContacts ✅',
        toInsert.length, 'creado(s),', toFillIn.length, 'campo(s) rellenado(s)')
    }
  } catch (e) {
    console.warn('[Contacts] syncIncomingContacts exception ⚠', e?.message)
  }
}

// ─── syncContactStatuses ──────────────────────────────────────────────────────
/**
 * Corrige el campo `status` de todos los contactos del owner según la regla:
 *
 *   contact_user_id != null  →  status = 'active'
 *   contact_user_id IS NULL  →  status = 'pending'
 *
 * Se ejecuta en background después de cargar los contactos — no bloquea la UI.
 * Los dos UPDATEs solo tocan filas donde el status ya es incorrecto.
 *
 * @param {string} ownerId — auth.uid()
 */
export async function syncContactStatuses(ownerId) {
  if (!ownerId) return

  const [resActive, resPending] = await Promise.allSettled([
    // Contactos con cuenta que no están marcados como active
    supabase
      .from('contacts')
      .update({ status: 'active' })
      .eq('owner_id', ownerId)
      .not('contact_user_id', 'is', null)
      .neq('status', 'active'),

    // Contactos sin cuenta que no están marcados como pending
    supabase
      .from('contacts')
      .update({ status: 'pending' })
      .eq('owner_id', ownerId)
      .is('contact_user_id', null)
      .neq('status', 'pending'),
  ])

  if (resActive.status  === 'rejected') console.warn('[Contacts] syncContactStatuses active ⚠', resActive.reason)
  if (resPending.status === 'rejected') console.warn('[Contacts] syncContactStatuses pending ⚠', resPending.reason)

  console.log('[Contacts] syncContactStatuses ✅')
}
