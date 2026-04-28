import { supabase } from '../../../lib/supabaseClient'

// ─── Constants ────────────────────────────────────────────────────────────────

export const TASK_STATUSES   = ['todo', 'in_progress', 'done']
export const TASK_PRIORITIES = ['low', 'medium', 'high']

/** Ciclo de estado para toggleTaskStatus: todo → in_progress → done → todo */
export const STATUS_CYCLE = { todo: 'in_progress', in_progress: 'done', done: 'todo' }

// ─── Mappers ──────────────────────────────────────────────────────────────────

/**
 * DB row → objeto de la app.
 *
 * `name` es un alias de `title` para que los componentes existentes
 * (KanbanCard, TaskFormModal) no necesiten ser reescritos en el mismo paso.
 *
 * Columnas DB esperadas tras la migración:
 *   id, project_id, title, description, status, priority,
 *   assigned_to, created_by, due_date, sort_order, depends_on,
 *   created_at
 *
 * Columnas legacy (pueden no existir en el nuevo esquema):
 *   start_date, estimated_time, estimated_unit
 */
function toApp(row) {
  const title = row.title ?? ''
  return {
    id:            row.id,
    projectId:     row.project_id,

    // Campo canónico nuevo
    title,
    // Alias para componentes legacy (KanbanCard, TaskFormModal)
    name:          title,

    description:   row.description    ?? '',
    status:        row.status         ?? 'todo',
    priority:      row.priority       ?? 'medium',
    assignedTo:    row.assigned_to    ?? null,
    createdBy:     row.created_by     ?? null,
    dueDate:       row.due_date       ?? null,
    sortOrder:     row.sort_order     ?? 0,
    dependsOn:     row.depends_on     ?? null,
    createdAt:     row.created_at     ?? null,

    // Campos legacy — pueden ser null si no existen en la tabla nueva
    startDate:     row.start_date     ?? null,
    estimatedTime: row.estimated_time ?? null,
    estimatedUnit: row.estimated_unit ?? 'hours',
  }
}

/**
 * Updates del app → columnas de la DB.
 * Solo envía los campos que el objeto updates define explícitamente.
 * Soporta tanto los nombres nuevos (title, assignedTo) como los legacy (name).
 */
function changesToDB(updates) {
  const row = {}

  // Campo canónico: title — también acepta "name" por compat con TaskFormModal
  if (updates.title         !== undefined) row.title          = updates.title?.trim() ?? ''
  if (updates.name          !== undefined) row.title          = updates.name?.trim()  ?? ''

  if (updates.description   !== undefined) row.description    = updates.description   ?? ''
  if (updates.status        !== undefined) row.status         = updates.status
  if (updates.priority      !== undefined) row.priority       = updates.priority
  if (updates.assignedTo    !== undefined) row.assigned_to    = updates.assignedTo    ?? null
  if (updates.dueDate       !== undefined) row.due_date       = updates.dueDate       || null
  if (updates.sortOrder     !== undefined) row.sort_order     = updates.sortOrder
  if (updates.dependsOn     !== undefined) row.depends_on     = updates.dependsOn     ?? null

  // Legacy
  if (updates.startDate     !== undefined) row.start_date     = updates.startDate     || null
  if (updates.estimatedTime !== undefined) row.estimated_time = updates.estimatedTime != null
    ? Number(updates.estimatedTime) : null
  if (updates.estimatedUnit !== undefined) row.estimated_unit = updates.estimatedUnit

  return row
}

// ─── fetchTasksByProject ──────────────────────────────────────────────────────

/**
 * Obtiene todas las tareas de un proyecto ordenadas por sort_order + created_at.
 *
 * El orden de columnas (todo → in_progress → done) se aplica en cliente porque
 * Supabase JS no soporta ORDER BY CASE en su query builder.
 *
 * @param {string} projectId
 * @param {object} [filters]
 * @param {string} [filters.assignedTo] — filtrar por usuario asignado
 * @param {string} [filters.status]     — filtrar por estado concreto
 */
export async function fetchTasksByProject(projectId, filters = {}) {
  if (!projectId) return []

  console.log('[Tasks] fetchTasksByProject →', projectId, filters)

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at',  { ascending: true })

  if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo)
  if (filters.status)     query = query.eq('status',      filters.status)

  const { data, error } = await query

  if (error) {
    console.error('[Tasks] fetchTasksByProject ❌', error.code, error.message)
    throw error
  }

  console.log('[Tasks] fetchTasksByProject ✅', (data ?? []).length, 'tareas')
  return (data ?? []).map(toApp)
}

// Alias — no rompe imports existentes que usen fetchTasks
export const fetchTasks = fetchTasksByProject

// ─── createTask ───────────────────────────────────────────────────────────────

/**
 * Crea una nueva tarea.
 *
 * @param {object} taskData
 * @param {string} taskData.projectId   — obligatorio
 * @param {string} taskData.createdBy   — auth.uid(), obligatorio
 * @param {string} taskData.title       — obligatorio (acepta .name para compat)
 * @param {string} [taskData.description]
 * @param {string} [taskData.status]    — default 'todo'
 * @param {string} [taskData.priority]  — default 'medium'
 * @param {string} [taskData.assignedTo]
 * @param {string} [taskData.dueDate]
 * @param {number} [taskData.sortOrder]
 * @param {string} [taskData.dependsOn]
 */
export async function createTask(taskData) {
  // Acepta tanto .title como .name (compat con TaskFormModal que usa .name)
  const title = (taskData.title ?? taskData.name ?? '').trim()

  if (!title)              throw new Error('El título de la tarea es obligatorio.')
  if (!taskData.projectId) throw new Error('createTask: projectId es obligatorio.')
  if (!taskData.createdBy) throw new Error('createTask: createdBy es obligatorio.')

  const row = {
    project_id:  taskData.projectId,
    title,
    description: taskData.description?.trim() ?? '',
    status:      taskData.status      ?? 'todo',
    priority:    taskData.priority    ?? 'medium',
    assigned_to: taskData.assignedTo  ?? null,
    created_by:  taskData.createdBy,
    due_date:    taskData.dueDate     || null,
    sort_order:  taskData.sortOrder   ?? 0,
    depends_on:  taskData.dependsOn   ?? null,
  }

  console.log('[Tasks] createTask →', { title, projectId: taskData.projectId })

  const { data, error } = await supabase
    .from('tasks')
    .insert(row)
    .select()
    .single()

  if (error) {
    console.error('[Tasks] createTask ❌', error.code, error.message)
    throw new Error(`Error al crear la tarea: ${error.message}`)
  }

  console.log('[Tasks] createTask ✅', data.id)
  return toApp(data)
}

/**
 * Alias legacy — mantiene la firma antigua:
 *   insertTask(task, projectId, userId, sortOrder)
 */
export async function insertTask(task, projectId, userId, sortOrder = 0) {
  return createTask({ ...task, projectId, createdBy: userId, sortOrder })
}

// ─── updateTask ───────────────────────────────────────────────────────────────

/**
 * Actualiza solo los campos presentes en `updates`.
 * Retorna null si no hay cambios para enviar a la DB.
 *
 * @param {string} taskId
 * @param {object} updates — subset de campos (camelCase)
 */
export async function updateTask(taskId, updates) {
  const row = changesToDB(updates)

  if (Object.keys(row).length === 0) {
    console.warn('[Tasks] updateTask: sin cambios →', taskId)
    return null
  }

  console.log('[Tasks] updateTask →', taskId, row)

  const { data, error } = await supabase
    .from('tasks')
    .update(row)
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('[Tasks] updateTask ❌', error.code, error.message)
    throw new Error(`Error al actualizar la tarea: ${error.message}`)
  }

  console.log('[Tasks] updateTask ✅', data.id)
  return toApp(data)
}

// Alias legacy
export const updateTaskInDB = updateTask

// ─── deleteTask ───────────────────────────────────────────────────────────────

/**
 * Elimina una tarea.
 *
 * El trigger `trg_update_project_progress` recalcula automáticamente
 * `projects.progress` tras el DELETE (si el trigger está activo en Supabase).
 * RLS garantiza que solo el owner del proyecto puede borrar.
 *
 * @param {string} taskId
 */
export async function deleteTask(taskId) {
  console.log('[Tasks] deleteTask →', taskId)

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('[Tasks] deleteTask ❌', error.code, error.message)
    throw new Error(`Error al eliminar la tarea: ${error.message}`)
  }

  console.log('[Tasks] deleteTask ✅', taskId)
}

// Alias legacy
export const deleteTaskFromDB = deleteTask

// ─── syncProjectProgress ─────────────────────────────────────────────────────

/**
 * Recalcula y persiste `projects.progress` manualmente.
 *
 * Cuándo usar esto:
 *   Solo si el trigger `trg_update_project_progress` NO está activo
 *   (p.ej. entornos de desarrollo sin la migración SQL aplicada).
 *   En producción, el trigger lo hace automáticamente en cada
 *   INSERT / UPDATE OF status / DELETE sobre `tasks`.
 *
 * @param {string} projectId
 * @returns {Promise<number|null>} progreso (0–100) o null si falla
 */
export async function syncProjectProgress(projectId) {
  if (!projectId) return 0

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('status')
    .eq('project_id', projectId)

  if (error) {
    console.error('[Tasks] syncProjectProgress ❌', error.message)
    return null
  }

  const total    = tasks?.length ?? 0
  const done     = (tasks ?? []).filter((t) => t.status === 'done').length
  const progress = total === 0 ? 0 : Math.round((done / total) * 100)

  console.log(`[Tasks] syncProjectProgress: ${done}/${total} = ${progress}%`)

  const { error: updateErr } = await supabase
    .from('projects')
    .update({ progress })
    .eq('id', projectId)

  if (updateErr) {
    console.warn('[Tasks] syncProjectProgress: no se pudo guardar:', updateErr.message)
  } else {
    console.log('[Tasks] syncProjectProgress ✅', progress, '%')
  }

  return progress
}
