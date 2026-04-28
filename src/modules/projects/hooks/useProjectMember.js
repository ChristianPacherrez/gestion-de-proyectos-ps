import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import {
  getUserProjectRole,
  fetchProjectMembers,
  insertMembership,
  updateMemberRole          as updateMemberRoleInDB,
  removeMember              as removeMemberFromDB,
  leaveProject              as leaveProjectInDB,
  addMemberFromContact      as addMemberFromContactInDB,
  inviteByEmail             as inviteByEmailInDB,
  getAvailableContactsForProject,
  findUserByEmail,
} from '../services/membersSupabase'

/**
 * Hook de membresía de proyecto.
 *
 * projectId — UUID del proyecto
 * createdBy — projects.created_by (el creador). El hook no corre hasta tenerlo.
 *             ProjectDetail pasa project?.createdBy y guarda su render con
 *             "if (!project) return <loading>", así createdBy siempre es un UUID real.
 *
 * Retorna:
 *   role          — 'owner' | 'collaborator' | 'client' | null
 *                   undefined mientras carga
 *   roleLoading   — true durante la carga inicial
 *   members       — [{ userId, role, email, fullName, createdAt }]
 *   currentUserId — auth.uid() del usuario activo
 *
 * El rol se determina ÚNICAMENTE desde projects.created_by y project_members.
 * No se consulta profiles.role ni supabase.auth.getUser().
 */
export function useProjectMember(projectId, createdBy = null) {
  // user viene de AuthContext — una sola fuente, sin getUser() extra
  const { user: authUser } = useAuth()
  const currentUserId = authUser?.id ?? null

  const [role,               setRole]               = useState(undefined)
  const [members,            setMembers]            = useState([])
  const [roleLoading,        setRoleLoading]        = useState(true)
  const [availableContacts,  setAvailableContacts]  = useState([])
  const [contactsLoading,    setContactsLoading]    = useState(false)

  // ── Cargar rol — espera projectId, authUser Y createdBy ──────────────────
  useEffect(() => {
    if (!projectId || !authUser?.id || !createdBy) return

    let cancelled = false

    async function load() {
      setRoleLoading(true)

      const userId = authUser.id
      console.log('[Members] getUserProjectRole →', { projectId, userId, createdBy })

      try {
        // Pasa createdBy para evitar query extra a projects
        const resolvedRole = await getUserProjectRole(projectId, userId, createdBy)

        if (cancelled) return

        console.log('[Members] role →', resolvedRole ?? 'null (sin membresía)')
        setRole(resolvedRole)  // null = sin acceso, sin fallback silencioso

        // Cargar lista de miembros solo si tiene acceso al proyecto
        // Pasamos createdBy para que el owner aparezca siempre al inicio
        if (resolvedRole !== null) {
          fetchProjectMembers(projectId, createdBy)
            .then((m) => { if (!cancelled) setMembers(m) })
            .catch((err) => console.warn('[Members] fetchProjectMembers error:', err))
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[Members] Error al cargar rol:', err.message)
          setRole(null)
        }
      } finally {
        if (!cancelled) setRoleLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [projectId, authUser?.id, createdBy])

  // ── refreshMembers ────────────────────────────────────────────────────────
  const refreshMembers = useCallback(async () => {
    if (!projectId) return
    try {
      const m = await fetchProjectMembers(projectId, createdBy)
      setMembers(m)
    } catch (err) {
      console.error('[Members] refreshMembers error:', err)
    }
  }, [projectId, createdBy])

  // ── loadAvailableContacts ─────────────────────────────────────────────────
  // Carga los contactos del owner que aún no están en el proyecto.
  // Solo tiene sentido llamarla cuando isOwner === true (el hook no lo fuerza
  // para no acoplarse — la UI decide cuándo mostrar el selector de contactos).
  const loadAvailableContacts = useCallback(async () => {
    if (!projectId || !createdBy) return
    setContactsLoading(true)
    try {
      const list = await getAvailableContactsForProject(projectId, createdBy, authUser?.email)
      setAvailableContacts(list)
    } catch (err) {
      console.error('[Members] loadAvailableContacts error:', err)
      setAvailableContacts([])
    } finally {
      setContactsLoading(false)
    }
  }, [projectId, createdBy, authUser?.email])

  // ── addMemberFromContact ──────────────────────────────────────────────────
  // Agrega un contacto como miembro del proyecto.
  // Solo el owner puede invitar — la validación de permiso va aquí (en el hook),
  // no en la función de servicio que es agnóstica al usuario activo.
  async function addMemberFromContact(contact, memberRole = 'collaborator') {
    if (!isOwner) {
      throw new Error('Solo el owner puede invitar miembros al proyecto.')
    }

    const result = await addMemberFromContactInDB(projectId, contact, memberRole, createdBy)

    if (result.type === 'added') {
      // Nuevo miembro confirmado → refrescar ambas listas
      await Promise.all([refreshMembers(), loadAvailableContacts()])
    }
    // 'pending': el contacto sigue sin cuenta, no hay nada que refrescar en members

    return result   // propagado al modal para mostrar el feedback correcto
  }

  // ── inviteByEmail ─────────────────────────────────────────────────────────
  // Flujo dual:
  //   · email con cuenta   → agrega directo a project_members, refresca members
  //   · email sin cuenta   → crea contacto con status 'pending', refresca contactos
  // Retorna { type: 'added' | 'pending', ... } para que la UI muestre el mensaje correcto.
  async function inviteByEmail(email, memberRole = 'collaborator') {
    if (!isOwner) {
      throw new Error('Solo el owner puede invitar miembros al proyecto.')
    }

    const result = await inviteByEmailInDB(projectId, email, memberRole, createdBy)

    if (result.type === 'added') {
      // Nuevo miembro confirmado — refrescar lista de miembros y contactos disponibles
      await Promise.all([refreshMembers(), loadAvailableContacts()])
    } else {
      // Contacto pendiente creado — solo refrescar contactos (no hay nuevo miembro aún)
      await loadAvailableContacts()
    }

    return result
  }

  // ── Helpers de permiso ────────────────────────────────────────────────────
  // createdBy es la fuente de verdad del owner — no depende de role (estado async).
  // Usamos currentUserId === createdBy en lugar de role === 'owner' para evitar
  // condiciones de carrera mientras roleLoading === true.
  const isOwner = Boolean(currentUserId && createdBy && currentUserId === createdBy)

  // ── addMember ─────────────────────────────────────────────────────────────
  // Solo el owner puede invitar miembros.
  async function addMember(email, memberRole = 'collaborator') {
    if (!isOwner) {
      throw new Error('Solo el owner puede invitar miembros al proyecto.')
    }

    const found = await findUserByEmail(email)

    if (!found) {
      throw new Error(
        `No se encontró ningún perfil con el email "${email}". ` +
        'Verifica que el email esté escrito correctamente y que el usuario haya sido creado en la sección Usuarios.'
      )
    }

    // El owner ya tiene acceso vía projects.created_by — no necesita fila en project_members
    if (found.id === createdBy) {
      throw new Error('Este usuario es el owner del proyecto y ya tiene acceso completo.')
    }

    const already = members.find((m) => m.userId === found.id)
    if (already) throw new Error('Este usuario ya es miembro del proyecto.')

    await insertMembership(projectId, found.id, memberRole)
    await refreshMembers()
  }

  // ── changeMemberRole ──────────────────────────────────────────────────────
  // Solo el owner puede cambiar roles. El rol del owner no es modificable.
  async function changeMemberRole(userId, newRole) {
    if (!isOwner) {
      throw new Error('Solo el owner puede cambiar roles en este proyecto.')
    }
    // Impedir cambiar el rol del owner — su acceso viene de created_by, no de project_members
    if (userId === createdBy) {
      throw new Error('No se puede cambiar el rol del owner del proyecto.')
    }

    setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, role: newRole } : m))
    try {
      await updateMemberRoleInDB(projectId, userId, newRole)
    } catch (err) {
      console.error('[Members] changeMemberRole error:', err)
      await refreshMembers()
      throw err
    }
  }

  // ── removeMember ──────────────────────────────────────────────────────────
  // Solo el owner puede eliminar miembros. El owner no puede eliminarse a sí mismo.
  async function removeMember(userId) {
    if (!isOwner) {
      throw new Error('Solo el owner puede eliminar miembros del proyecto.')
    }
    // Impedir eliminar al owner — no tiene fila en project_members y el DELETE no haría nada,
    // pero lo rechazamos explícitamente para evitar confusión en la UI.
    if (userId === createdBy) {
      throw new Error('No se puede eliminar al owner del proyecto.')
    }

    setMembers((prev) => prev.filter((m) => m.userId !== userId))
    try {
      await removeMemberFromDB(projectId, userId)
    } catch (err) {
      console.error('[Members] removeMember error:', err)
      await refreshMembers()
      throw err
    }
  }

  // ── leaveProject ──────────────────────────────────────────────────────────
  // Collaborator / client pueden salir voluntariamente.
  // El owner no puede salir — su membresía está en projects.created_by, no en project_members.
  async function leaveProject() {
    if (!currentUserId) throw new Error('Sin usuario autenticado.')

    // Usar createdBy directamente — no depender de role que puede estar cargando
    if (currentUserId === createdBy) {
      throw new Error('El owner no puede abandonar el proyecto. Transfiere la propiedad o elimina el proyecto.')
    }

    // Verificar que realmente tiene membresía antes de intentar salir
    const hasMembership = members.some((m) => m.userId === currentUserId && !m.isOwner)
    if (!hasMembership) {
      throw new Error('No tienes una membresía activa en este proyecto.')
    }

    setMembers((prev) => prev.filter((m) => m.userId !== currentUserId))
    try {
      await leaveProjectInDB(projectId, currentUserId)
      console.log('[Members] leaveProject ✅ — usuario salió del proyecto:', projectId)
    } catch (err) {
      console.error('[Members] leaveProject error:', err)
      await refreshMembers()
      throw err
    }
  }

  return {
    // ── Estado ──────────────────────────────────────────────────────────────
    role,
    roleLoading,
    isOwner,              // currentUserId === createdBy — fuente de verdad sincrónica
    members,
    currentUserId,        // = authUser?.id
    availableContacts,    // contactos del owner que aún no están en el proyecto
    contactsLoading,

    // ── Acciones ─────────────────────────────────────────────────────────────
    addMember,            // invitar por email (flujo legacy — busca en profiles)
    inviteByEmail,        // flujo dual: perfil existente → member | sin perfil → pending contact
    addMemberFromContact, // invitar desde lista de contactos
    loadAvailableContacts,
    changeMemberRole,
    removeMember,
    leaveProject,
    refreshMembers,
  }
}
