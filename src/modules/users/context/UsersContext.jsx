import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth }      from '../../../context/AuthContext';
import { MOCK_USERS }   from '../services/users.mock';
import { load, save }   from '../../../utils/storage';
import {
  fetchContacts,
  createContact,
  updateContact,
  deleteContact,
  syncContactStatuses,
  syncIncomingContacts,
} from '../services/usersSupabase';

// ─── Role / type config ────────────────────────────────────────────────────────
// Usado por ContactPickerModal, UserCard, UserFormModal, MeetingsPage.
// Claves: 'owner' | 'collaborator' | 'client'
//   owner       — solo para display de miembros de proyecto (no aparece en Contactos)
//   collaborator — contacto que puede ser invitado como colaborador
//   client       — contacto que puede ser invitado como cliente
export const ROLES = {
  owner:        { label: 'Owner',       bg: '#f9f5ff', text: '#6941c6', border: '#e9d7fe', dot: '#9e77ed' },
  collaborator: { label: 'Colaborador', bg: '#eff8ff', text: '#175cd3', border: '#b2ddff', dot: '#2e90fa' },
  client:       { label: 'Cliente',     bg: '#ecfdf3', text: '#027a48', border: '#abefc6', dot: '#17b26a' },
};

// ─── Context ──────────────────────────────────────────────────────────────────
const UsersContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
/**
 * Gestiona la lista de contactos del usuario autenticado.
 *
 * La fuente de verdad es la tabla `contacts` filtrada por owner_id = auth.uid().
 * Los contactos son personas externas — nunca incluyen al propio usuario autenticado.
 *
 * API pública (se mantiene igual para no romper consumidores existentes):
 *   users         — lista de contactos
 *   usersLoading  — carga inicial
 *   addUser       — crea contacto
 *   updateUser    — actualiza contacto
 *   deleteUser    — elimina contacto
 *   authUserProfile — null (ya no se gestiona aquí; MainLayout usa authUser directamente)
 */
export function UsersProvider({ children }) {
  const { user: authUser } = useAuth();

  const [users,        setUsers]        = useState(() => load('users', MOCK_USERS));
  const [usersLoading, setUsersLoading] = useState(false);

  // ── Carga inicial desde Supabase ─────────────────────────────────────────────
  // Se ejecuta cuando el usuario se autentica — carga sus contactos.
  useEffect(() => {
    if (!authUser?.id) return

    console.log('[Contacts] Cargando contactos para owner:', authUser.id)
    setUsersLoading(true)

    fetchContacts(authUser.id, authUser.email)
      .then((contacts) => {
        console.log('[Contacts] ✅ Cargados', contacts.length, 'contactos')
        setUsers(contacts)
        save('users', contacts)

        // ── Background sync — no bloquea la UI ──────────────────────────────
        // 1. Corregir status (active/pending) de contactos existentes
        syncContactStatuses(authUser.id).catch((err) =>
          console.warn('[Contacts] syncContactStatuses ⚠', err?.message)
        )

        // 2. Crear contactos para owners de proyectos donde este usuario es miembro
        //    (resuelve la dirección B→A que no se puede crear cuando auth.uid() = A)
        syncIncomingContacts(authUser.id, authUser.email)
          .then(() => {
            // Si se agregaron contactos nuevos, recargar la lista para mostrarlos
            fetchContacts(authUser.id, authUser.email)
              .then((refreshed) => {
                if (refreshed.length !== contacts.length) {
                  console.log('[Contacts] ↺ Lista actualizada tras syncIncoming:', refreshed.length, 'contactos')
                  setUsers(refreshed)
                  save('users', refreshed)
                }
              })
              .catch(() => {/* silencioso — ya tenemos la lista inicial */})
          })
          .catch((err) =>
            console.warn('[Contacts] syncIncomingContacts ⚠', err?.message)
          )
      })
      .catch((err) => {
        console.warn('[Contacts] ⚠ No se pudo cargar desde Supabase:', err?.message ?? err)
        // Fallback: conservar datos de localStorage
      })
      .finally(() => setUsersLoading(false))
  }, [authUser?.id])

  // Sincronizar localStorage en cada cambio local
  useEffect(() => { save('users', users) }, [users])

  // ── addUser ───────────────────────────────────────────────────────────────────
  // DB-first: lanza si falla; el caller (UserFormModal) muestra el error inline.
  async function addUser(user) {
    if (!authUser?.id) throw new Error('Sin usuario autenticado.')

    const saved = await createContact(user, authUser.id)
    setUsers((prev) => [...prev, saved])
    return saved
  }

  // ── updateUser ────────────────────────────────────────────────────────────────
  async function updateUser(id, changes) {
    const snapshot = users.find((u) => u.id === id)

    // Actualización optimista
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...changes } : u)))

    try {
      const merged = snapshot ? { ...snapshot, ...changes } : { id, ...changes }
      const saved  = await updateContact(merged)
      if (saved) setUsers((prev) => prev.map((u) => (u.id === id ? saved : u)))
      console.log('[Contacts] ✅ Contacto actualizado:', id)
    } catch (err) {
      console.error('[Contacts] ❌ Error al actualizar:', err?.message ?? err)
      if (snapshot) setUsers((prev) => prev.map((u) => (u.id === id ? snapshot : u)))
    }
  }

  // ── deleteUser ────────────────────────────────────────────────────────────────
  async function deleteUser(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id))

    try {
      await deleteContact(id)
      console.log('[Contacts] ✅ Contacto eliminado:', id)
    } catch (err) {
      console.error('[Contacts] ❌ Error al eliminar:', err?.message ?? err)
      // No revertir — operación destructiva
    }
  }

  const value = {
    users,
    usersLoading,
    // authUserProfile ya no se gestiona aquí — MainLayout cae en el fallback de authUser.email
    authUserProfile: null,
    authUserRole:    null,
    addUser,
    updateUser,
    deleteUser,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useUsersContext() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsersContext must be used inside <UsersProvider>');
  return ctx;
}
