import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth }          from '../../../context/AuthContext';
import { useWorkspace }     from '../../../context/WorkspaceContext';
import { MOCK_PROJECTS }    from '../services/projects.mock';
import { load, save }       from '../../../utils/storage';
import {
  createProjectWithOwner,
  fetchMyProjects,
  fetchSharedProjects,
  fetchProjectById,
  updateProjectInDB,
  deleteProjectFromDB,
} from '../services/projectsSupabase';
// Los miembros se gestionan desde la vista del proyecto — no en la creación.

// ─── Context ──────────────────────────────────────────────────────────────────
const ProjectsContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ProjectsProvider({ children }) {
  const { user: authUser }       = useAuth();
  const { activeWorkspaceId }    = useWorkspace();   // solo necesitamos esto para crear proyectos

  const [projects,  setProjects]  = useState(() => load('projects', MOCK_PROJECTS));
  const [dbLoading, setDbLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // ── Helper: carga todos los proyectos del usuario ────────────────────────────
  //
  // "Mis proyectos"       → projects.created_by = userId
  // "Compartidos conmigo" → project_members.user_id = userId AND created_by != userId
  //
  // Las dos queries son independientes y garantizan cero solapamiento.
  // No se consulta profiles.role.
  //
  async function loadProjects(userId) {
    if (!userId) return []

    console.log('[Projects] loadProjects → user:', userId)

    const [mine, shared] = await Promise.all([
      fetchMyProjects(userId),
      fetchSharedProjects(userId),
    ])

    console.log('[Projects] loadProjects ✅ mine:', mine.length, '| shared:', shared.length)
    return [...mine, ...shared]
  }

  // ── Re-fetch cuando cambia el usuario autenticado ────────────────────────────
  useEffect(() => {
    if (!authUser?.id) return

    setDbLoading(true)
    console.log('[Projects] Cargando proyectos para user:', authUser.id)

    loadProjects(authUser.id)
      .then((data) => {
        setProjects(data)
        save('projects', data)
        console.log('[Projects] ✅', data.length, 'proyectos cargados')
      })
      .catch((err) => {
        console.error('[Projects] ❌ Error al cargar:', err)
        // Fallback: mantener datos de localStorage
      })
      .finally(() => setDbLoading(false))
  }, [authUser?.id])  // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar localStorage con cada cambio local
  useEffect(() => {
    save('projects', projects)
  }, [projects])

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async function addProject(newProject) {
    setSaveError(null)

    // authUser ya viene de useAuth() — no llamamos getUser() de nuevo
    const user = authUser
    if (!user) {
      setSaveError('Sin usuario autenticado')
      return
    }

    // ── 1. Crear proyecto + owner membership ─────────────────────────────────
    let saved
    try {
      saved = await createProjectWithOwner(newProject, activeWorkspaceId, user.id)
    } catch (err) {
      console.error('[Projects] ❌ createProjectWithOwner:', err.message)
      setSaveError(err.message)
      return
    }

    // Actualización optimista — el proyecto aparece de inmediato en la UI
    setProjects((prev) => [saved, ...prev])
    console.log('[Projects] ✅ Proyecto creado:', saved.id)

    // ── 2. Re-fetch en background para reconciliar con DB ────────────────────
    loadProjects(user.id)
      .then((fresh) => {
        setProjects(fresh)
        save('projects', fresh)
        console.log('[Projects] 🔄 Re-fetch post-insert ✅', fresh.length, 'proyectos')
      })
      .catch((err) => {
        console.warn('[Projects] Re-fetch post-insert falló (datos optimistas en uso):', err)
      })
  }

  async function updateProject(id, changes) {
    const snapshot = projects.find((p) => p.id === id)

    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)))
    setSaveError(null)

    if (!authUser) return

    try {
      const confirmed = await updateProjectInDB(id, changes)

      if (confirmed) {
        setProjects((prev) => prev.map((p) =>
          p.id === id
            ? {
                ...p,
                name:        confirmed.name,
                description: confirmed.description,
                status:      confirmed.status,
                dueDate:     confirmed.dueDate,
                progress:    confirmed.progress,
              }
            : p
        ))
        console.log('[Projects] ✅ Reconciliado con DB:', id, '→ progress:', confirmed.progress, '%')
      }
    } catch (err) {
      console.error('[Projects] ❌ updateProject falló, revirtiendo:', err)
      setSaveError(err?.message ?? 'Error al actualizar en Supabase')

      if (snapshot) {
        setProjects((prev) => prev.map((p) => (p.id === id ? snapshot : p)))
      }

      fetchProjectById(id)
        .then((fresh) => {
          if (!fresh) return
          setProjects((prev) => prev.map((p) =>
            p.id === id
              ? { ...p, name: fresh.name, description: fresh.description,
                  status: fresh.status, dueDate: fresh.dueDate, progress: fresh.progress }
              : p
          ))
          console.log('[Projects] 🔄 Estado restaurado desde DB:', id)
        })
        .catch((fetchErr) => console.error('[Projects] ❌ Re-fetch post-rollback falló:', fetchErr))
    }
  }

  async function deleteProject(id) {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setSaveError(null)

    if (!authUser) return

    try {
      await deleteProjectFromDB(id)
      console.log('[Projects] ✅ Eliminado en Supabase:', id)
    } catch (err) {
      console.log('[Projects] ❌ Error al eliminar en Supabase:', err)
      setSaveError(err?.message ?? 'Error al eliminar en Supabase')
    }
  }

  function clearSaveError() { setSaveError(null) }

  function setProjectProgress(id, progress) {
    setProjects((prev) => prev.map((p) =>
      p.id === id ? { ...p, progress } : p
    ))
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  //
  // myProjects     — proyectos donde el usuario autenticado es el creador
  // sharedProjects — proyectos en los que participa pero NO creó
  //
  // Guard: si no hay authUid todavía, ambas listas son vacías.
  // Evita que los datos mock (createdBy: 'u1') contaminen las vistas
  // antes de que Supabase devuelva los proyectos reales del usuario.
  const authUid        = authUser?.id ?? null
  const myProjects     = authUid ? projects.filter((p) => p.createdBy === authUid)  : []
  const sharedProjects = authUid ? projects.filter((p) => p.createdBy !== authUid)  : []

  const value = {
    projects,
    myProjects,
    sharedProjects,
    dbLoading,
    saveError,
    clearSaveError,
    addProject,
    updateProject,
    deleteProject,
    setProjectProgress,
    activeProjects:    projects.filter((p) => p.status === 'active'),
    pausedProjects:    projects.filter((p) => p.status === 'paused'),
    completedProjects: projects.filter((p) => p.status === 'completed'),
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useProjectsContext() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjectsContext must be used inside <ProjectsProvider>');
  return ctx;
}
