import { supabase } from '../supabaseClient'

// ─── Mappers ──────────────────────────────────────────────────────────────────

function projectToApp(row) {
  return {
    id:                row.id,
    name:              row.name,
    description:       row.description       ?? '',
    status:            row.status            ?? 'active',
    progress:          row.progress          ?? 0,
    tasksTotal:        row.tasks_total       ?? 0,
    tasksDone:         row.tasks_done        ?? 0,
    dueDate:           row.due_date          ?? null,
    ganttShareToken:   row.gantt_share_token ?? null,
    ganttShareEnabled: row.gantt_share_enabled ?? false,
    createdAt:         row.created_at        ?? null,
    updatedAt:         row.updated_at        ?? null,
  }
}

function taskToApp(row) {
  const title = row.title ?? ''
  return {
    id:            row.id,
    projectId:     row.project_id,
    title,
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
    startDate:     row.start_date     ?? null,
    estimatedTime: row.estimated_time ?? null,
    estimatedUnit: row.estimated_unit ?? 'hours',
  }
}

// ─── Public read (no auth required) ──────────────────────────────────────────

/**
 * Fetches project + tasks via share token.
 * Requires RLS policies: "public_gantt_project_select" and "public_gantt_tasks_select".
 *
 * @param {string} token — gantt_share_token UUID
 * @returns {Promise<{ project, tasks } | null>}
 */
export async function fetchPublicGantt(token) {
  if (!token) return null

  console.log('[GanttShare] fetchPublicGantt →', token)

  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .select('*')
    .eq('gantt_share_token', token)
    .eq('gantt_share_enabled', true)
    .maybeSingle()

  if (projectErr) {
    console.error('[GanttShare] fetchPublicGantt project ❌', projectErr.message)
    throw projectErr
  }

  if (!project) {
    console.log('[GanttShare] fetchPublicGantt → not found / disabled')
    return null
  }

  const { data: tasks, error: tasksErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', project.id)
    .order('sort_order', { ascending: true })
    .order('created_at',  { ascending: true })

  if (tasksErr) {
    console.error('[GanttShare] fetchPublicGantt tasks ❌', tasksErr.message)
    throw tasksErr
  }

  console.log('[GanttShare] fetchPublicGantt ✅', project.id, (tasks ?? []).length, 'tasks')

  return {
    project: projectToApp(project),
    tasks:   (tasks ?? []).map(taskToApp),
  }
}

// ─── Owner actions (auth required) ───────────────────────────────────────────

/**
 * Returns current share state for a project.
 */
export async function fetchGanttShareState(projectId) {
  if (!projectId) return { token: null, enabled: false }

  const { data, error } = await supabase
    .from('projects')
    .select('gantt_share_token, gantt_share_enabled')
    .eq('id', projectId)
    .single()

  if (error) {
    console.error('[GanttShare] fetchGanttShareState ❌', error.message)
    throw error
  }

  return {
    token:   data.gantt_share_token   ?? null,
    enabled: data.gantt_share_enabled ?? false,
  }
}

function genToken() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

/**
 * Activates sharing. Generates a token if none exists yet.
 * Returns { token, enabled: true }.
 */
export async function enableGanttShare(projectId) {
  const token = genToken()

  const { data, error } = await supabase
    .from('projects')
    .update({ gantt_share_token: token, gantt_share_enabled: true })
    .eq('id', projectId)
    .select('gantt_share_token, gantt_share_enabled')
    .single()

  if (error) {
    console.error('[GanttShare] enableGanttShare ❌', error.message)
    throw error
  }

  console.log('[GanttShare] enableGanttShare ✅')
  return { token: data.gantt_share_token, enabled: data.gantt_share_enabled }
}

/**
 * Disables sharing without deleting the token.
 * The existing token is preserved so it can be re-enabled without changing the URL.
 */
export async function disableGanttShare(projectId) {
  const { error } = await supabase
    .from('projects')
    .update({ gantt_share_enabled: false })
    .eq('id', projectId)

  if (error) {
    console.error('[GanttShare] disableGanttShare ❌', error.message)
    throw error
  }

  console.log('[GanttShare] disableGanttShare ✅')
}

/**
 * Generates a brand-new token, invalidating the previous URL.
 * Returns the new token string.
 */
export async function regenerateGanttToken(projectId) {
  const token = genToken()

  const { data, error } = await supabase
    .from('projects')
    .update({ gantt_share_token: token, gantt_share_enabled: true })
    .eq('id', projectId)
    .select('gantt_share_token')
    .single()

  if (error) {
    console.error('[GanttShare] regenerateGanttToken ❌', error.message)
    throw error
  }

  console.log('[GanttShare] regenerateGanttToken ✅')
  return data.gantt_share_token
}
