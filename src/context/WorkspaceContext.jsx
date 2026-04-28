import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchUserWorkspaces,
  createWorkspace as createWorkspaceInDB,
} from '../modules/workspaces/services/workspacesSupabase';

// ─── Context ──────────────────────────────────────────────────────────────────
const WorkspaceContext = createContext(null);

const LS_KEY = 'activeWorkspaceId';

// ─── Provider ─────────────────────────────────────────────────────────────────
export function WorkspaceProvider({ children }) {
  // user viene de AuthContext — nunca es null aquí porque AppGate ya lo
  // garantizó antes de montar WorkspaceProvider.
  const { user } = useAuth()

  const [workspaces,         setWorkspaces]         = useState([]);
  const [activeWorkspaceId,  setActiveWorkspaceId]  = useState(() => localStorage.getItem(LS_KEY) ?? null);
  const [wsLoading,          setWsLoading]          = useState(true);

  // ── Cargar workspaces cuando cambia el usuario autenticado ───────────────────
  // Depende de user.id — se re-ejecuta solo si cambia la cuenta.
  // No usa onAuthStateChange ni getUser() — AuthContext ya gestiona eso.
  useEffect(() => {
    if (!user?.id) return

    let cancelled = false
    setWsLoading(true)

    console.log('[Workspaces] Cargando para user:', user.id)

    fetchUserWorkspaces(user.id)
      .then((list) => {
        if (cancelled) return

        console.log('[Workspaces] Cargados:', list.length, 'workspace(s)')
        setWorkspaces(list)

        // Restaurar o inicializar activeWorkspaceId desde localStorage
        const stored = localStorage.getItem(LS_KEY)
        const valid  = stored && list.some((w) => w.id === stored)

        if (!valid) {
          const owned = list.find((w) => w.role === 'host') ?? list[0]
          const newId = owned?.id ?? null
          setActiveWorkspaceId(newId)
          if (newId) localStorage.setItem(LS_KEY, newId)
          else       localStorage.removeItem(LS_KEY)
        }
      })
      .catch((err) => console.error('[Workspaces] load error:', err))
      .finally(() => { if (!cancelled) setWsLoading(false) })

    return () => { cancelled = true }
  }, [user?.id])

  // ── setActiveWorkspace ────────────────────────────────────────────────────────
  function setActiveWorkspace(id) {
    setActiveWorkspaceId(id)
    if (id) localStorage.setItem(LS_KEY, id)
    else    localStorage.removeItem(LS_KEY)
  }

  // ── createWorkspace ───────────────────────────────────────────────────────────
  async function createWorkspace(name) {
    if (!user) throw new Error('No autenticado')
    const ws = await createWorkspaceInDB(name, user.id)
    setWorkspaces((prev) => [...prev, ws])
    setActiveWorkspace(ws.id)
    return ws
  }

  // ── refreshWorkspaces ─────────────────────────────────────────────────────────
  const refreshWorkspaces = useCallback(async () => {
    if (!user?.id) return
    try {
      const list = await fetchUserWorkspaces(user.id)
      setWorkspaces(list)
    } catch (err) {
      console.error('[Workspaces] refreshWorkspaces error:', err)
    }
  }, [user?.id])

  // ── Derived ───────────────────────────────────────────────────────────────────
  const activeWorkspace   = workspaces.find((w) => w.id === activeWorkspaceId) ?? null
  const myWorkspaces      = workspaces.filter((w) => w.role === 'host')
  const sharedWorkspaces  = workspaces.filter((w) => w.role !== 'host')

  // All workspace IDs the user belongs to (for cross-workspace project fetching)
  const allWorkspaceIds   = workspaces.map((w) => w.id)
  // IDs of workspaces the user owns
  const myWorkspaceIds    = myWorkspaces.map((w) => w.id)

  const value = {
    workspaces,
    myWorkspaces,
    sharedWorkspaces,
    activeWorkspaceId,
    activeWorkspace,
    allWorkspaceIds,
    myWorkspaceIds,
    wsLoading,
    setActiveWorkspace,
    createWorkspace,
    refreshWorkspaces,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside <WorkspaceProvider>');
  return ctx;
}
