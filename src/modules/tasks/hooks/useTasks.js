import { useState, useEffect, useCallback } from 'react'
import { arrayMove }          from '@dnd-kit/sortable'
import { supabase }           from '../../../lib/supabaseClient'
import { useAuth }            from '../../../context/AuthContext'
import { useProjectsContext } from '../../projects/context/ProjectsContext'
import {
  fetchTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  syncProjectProgress,
  STATUS_CYCLE,
} from '../services/tasksSupabase'

// ─── useTasks ─────────────────────────────────────────────────────────────────

/**
 * Hook de tareas para un proyecto concreto.
 *
 * Estado:
 *   tasks    — array completo (todos los estados)
 *   loading  — true mientras carga la primera vez o al recargar
 *   error    — string con el mensaje de error, o null
 *
 * Funciones (nueva API):
 *   loadTasks(filters?)      — recarga desde DB (acepta filtros opcionales)
 *   addTask(data)            — crea tarea con actualización optimista
 *   editTask(id, updates)    — actualiza tarea con rollback en error
 *   removeTask(id)           — elimina tarea con rollback en error
 *   toggleTaskStatus(id)     — cicla: todo → in_progress → done → todo
 *
 * Funciones legacy (backward compat — no eliminar hasta actualizar todos los callers):
 *   updateTask               — alias de editTask
 *   deleteTask               — alias de removeTask
 *   toggleDone               — alterna solo done ↔ todo (sin pasar por in_progress)
 *   moveTask(id, dir)        — reordena con botones arriba/abajo
 *   reorderTask(...)         — reordena por drag & drop (KanbanBoard)
 *
 * Derived (nueva API):
 *   todoTasks, inProgressTasks, doneTasks
 *   tasksByStatus            — { todo, in_progress, done }
 *   progress                 — 0–100 calculado desde el estado local
 *
 * Derived legacy:
 *   pendingTasks             — alias de todoTasks
 *   completedTasks           — alias de doneTasks
 *   observedTasks            — [] (eliminado del nuevo esquema)
 *
 * @param {string} projectId
 */
export function useTasks(projectId) {
  const { user }               = useAuth()
  const { setProjectProgress } = useProjectsContext()

  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // ── loadTasks ──────────────────────────────────────────────────────────────
  const loadTasks = useCallback(async (filters = {}) => {
    if (!projectId) return
    setLoading(true)
    setError(null)

    try {
      const data = await fetchTasksByProject(projectId, filters)
      setTasks(data)
    } catch (err) {
      console.error('[useTasks] loadTasks ❌', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // ── syncProgress ───────────────────────────────────────────────────────────
  // Recalcula progress en DB y sincroniza el estado React local.
  // El trigger SQL lo hace automáticamente; esto es el fallback para entornos
  // donde el trigger no está disponible.
  function syncProgress() {
    if (!projectId) return
    syncProjectProgress(projectId)
      .then((confirmed) => {
        if (typeof confirmed === 'number') setProjectProgress(projectId, confirmed)
      })
      .catch((err) => console.warn('[useTasks] syncProgress ⚠', err.message))
  }

  // ── addTask ────────────────────────────────────────────────────────────────
  async function addTask(taskData) {
    if (!user) return
    setError(null)

    // Optimistic: insertar con id temporal antes de la confirmación de DB
    const tempId     = `temp_${Date.now()}`
    const taskTitle  = (taskData.title ?? taskData.name ?? '').trim()
    const optimistic = {
      id:            tempId,
      projectId,
      title:         taskTitle,
      name:          taskTitle,          // alias backward compat
      description:   taskData.description    ?? '',
      status:        taskData.status         ?? 'todo',
      priority:      taskData.priority       ?? 'medium',
      assignedTo:    taskData.assignedTo     ?? null,
      createdBy:     user.id,
      dueDate:       taskData.dueDate        ?? null,
      sortOrder:     tasks.length,
      dependsOn:     taskData.dependsOn      ?? null,
      createdAt:     new Date().toISOString(),
      // Legacy
      startDate:     taskData.startDate      ?? null,
      estimatedTime: taskData.estimatedTime  ?? null,
      estimatedUnit: taskData.estimatedUnit  ?? 'hours',
    }

    setTasks((prev) => [...prev, optimistic])

    try {
      const confirmed = await createTask({
        ...taskData,
        projectId,
        createdBy:  user.id,
        sortOrder:  tasks.length,
      })
      // Reemplazar entrada temporal con dato real de DB
      setTasks((prev) => prev.map((t) => (t.id === tempId ? confirmed : t)))
      syncProgress()
      return confirmed
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId))   // rollback
      setError(err.message)
      throw err
    }
  }

  // ── editTask ───────────────────────────────────────────────────────────────
  async function editTask(taskId, updates) {
    const snapshot = tasks.find((t) => t.id === taskId)
    setError(null)

    // Optimistic: aplica cambio en UI de inmediato
    setTasks((prev) => prev.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    ))

    try {
      const confirmed = await updateTask(taskId, updates)
      // Reconciliar con la fila real devuelta por Supabase
      if (confirmed) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? confirmed : t)))
      }
      if (updates.status !== undefined) syncProgress()
      return confirmed
    } catch (err) {
      // Rollback al estado anterior
      if (snapshot) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? snapshot : t)))
      }
      setError(err.message)
      throw err
    }
  }

  // ── removeTask ─────────────────────────────────────────────────────────────
  async function removeTask(taskId) {
    const snapshot = tasks.find((t) => t.id === taskId)
    setError(null)

    setTasks((prev) => prev.filter((t) => t.id !== taskId))   // optimistic

    try {
      await deleteTask(taskId)
      syncProgress()
    } catch (err) {
      // Rollback: reinsertar respetando sortOrder original
      if (snapshot) {
        setTasks((prev) => {
          const without = prev.filter((t) => t.id !== taskId)
          const idx     = without.findIndex((t) => t.sortOrder > snapshot.sortOrder)
          if (idx === -1) return [...without, snapshot]
          const next = [...without]
          next.splice(idx, 0, snapshot)
          return next
        })
      }
      setError(err.message)
      throw err
    }
  }

  // ── toggleTaskStatus ───────────────────────────────────────────────────────
  // Ciclo completo: todo → in_progress → done → todo
  async function toggleTaskStatus(taskId) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    const nextStatus = STATUS_CYCLE[task.status] ?? 'todo'
    return editTask(taskId, { status: nextStatus })
  }

  // ── toggleDone (backward compat) ───────────────────────────────────────────
  // Solo alterna done ↔ todo; usado por componentes legacy
  async function toggleDone(taskId) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    const nextStatus = task.status === 'done' ? 'todo' : 'done'
    return editTask(taskId, { status: nextStatus })
  }

  // ── moveTask (botones arriba / abajo) ──────────────────────────────────────
  async function moveTask(taskId, direction) {
    const idx     = tasks.findIndex((t) => t.id === taskId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (idx === -1 || swapIdx < 0 || swapIdx >= tasks.length) return

    const next      = [...tasks]
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    const withOrder = next.map((t, i) => ({ ...t, sortOrder: i }))

    setTasks(withOrder)   // optimistic

    try {
      for (const t of withOrder) {
        await supabase
          .from('tasks')
          .update({ sort_order: t.sortOrder })
          .eq('id', t.id)
      }
    } catch (err) {
      console.error('[useTasks] moveTask ❌ recargando desde DB:', err.message)
      loadTasks()
    }
  }

  // ── reorderTask (drag & drop — KanbanBoard) ────────────────────────────────
  async function reorderTask(activeId, overId, targetStatus, overIsColumn) {
    const activeIdx = tasks.findIndex((t) => t.id === activeId)
    if (activeIdx === -1) return

    // 1. Aplicar nuevo status al item arrastrado
    let next = tasks.map((t) =>
      t.id === activeId ? { ...t, status: targetStatus } : t
    )

    // 2. Reordenar si se soltó sobre una card (no sobre la columna vacía)
    if (!overIsColumn) {
      const overIdx      = next.findIndex((t) => t.id === overId)
      const newActiveIdx = next.findIndex((t) => t.id === activeId)
      if (overIdx !== -1 && newActiveIdx !== -1) {
        next = arrayMove(next, newActiveIdx, overIdx)
      }
    }

    setTasks(next)   // optimistic

    // 3. Persistir status — crítico, bloquear hasta confirmar
    try {
      await updateTask(activeId, { status: targetStatus })
      syncProgress()
    } catch (err) {
      console.error('[useTasks] reorderTask: status ❌ recargando:', err.message)
      loadTasks()
      return   // no persistir sort_order si el status falló
    }

    // 4. Persistir sort_order — no bloquea la UI (fallo es recuperable)
    const withOrder = next.map((t, i) => ({ ...t, sortOrder: i }))
    setTasks(withOrder)

    try {
      for (const t of withOrder) {
        await supabase
          .from('tasks')
          .update({ sort_order: t.sortOrder })
          .eq('id', t.id)
      }
    } catch (err) {
      console.warn('[useTasks] reorderTask: sort_order ⚠ recargando:', err.message)
      loadTasks()
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const todoTasks       = tasks.filter((t) => t.status === 'todo')
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress')
  const doneTasks       = tasks.filter((t) => t.status === 'done')

  const progress = tasks.length === 0
    ? 0
    : Math.round((doneTasks.length / tasks.length) * 100)

  return {
    // ── Estado ────────────────────────────────────────────────────────────
    tasks,
    loading,
    error,
    clearError: () => setError(null),

    // ── Acciones (nueva API) ───────────────────────────────────────────────
    loadTasks,
    addTask,
    editTask,
    removeTask,
    toggleTaskStatus,

    // ── Acciones (backward compat) ─────────────────────────────────────────
    updateTask:  editTask,
    deleteTask:  removeTask,
    toggleDone,
    moveTask,
    reorderTask,

    // ── Derived (nueva API) ────────────────────────────────────────────────
    tasksByStatus: { todo: todoTasks, in_progress: inProgressTasks, done: doneTasks },
    progress,
    todoTasks,
    inProgressTasks,
    doneTasks,

    // ── Derived (backward compat) ──────────────────────────────────────────
    pendingTasks:    todoTasks,
    completedTasks:  doneTasks,
    observedTasks:   [],        // eliminado — vacío para no romper destructuring
  }
}
