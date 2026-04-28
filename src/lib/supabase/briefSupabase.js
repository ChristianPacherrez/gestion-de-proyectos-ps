import { supabase }               from '../supabaseClient'
import { DEFAULT_BRIEF_TEMPLATE } from '../../constants/briefTemplate'

// ─── Status constants ─────────────────────────────────────────────────────────
/**
 * Estados posibles de un brief.
 * Úsalos siempre desde aquí para evitar strings dispersos.
 */
export const BRIEF_STATUS = {
  DRAFT:       'draft',
  IN_PROGRESS: 'in_progress',
  COMPLETED:   'completed',
  CLOSED:      'closed',
}

/**
 * Transiciones válidas por estado.
 * Útil para validar acciones en el hook antes de llamar a DB.
 *   draft       → in_progress
 *   in_progress → draft | completed
 *   completed   → in_progress          (reabrir)
 *   closed      → (ninguna)            (estado terminal)
 */
export const BRIEF_STATUS_TRANSITIONS = {
  [BRIEF_STATUS.DRAFT]:       [BRIEF_STATUS.IN_PROGRESS],
  [BRIEF_STATUS.IN_PROGRESS]: [BRIEF_STATUS.DRAFT, BRIEF_STATUS.COMPLETED],
  [BRIEF_STATUS.COMPLETED]:   [BRIEF_STATUS.IN_PROGRESS],
  [BRIEF_STATUS.CLOSED]:      [],
}

// ─── Mapper DB → app ──────────────────────────────────────────────────────────
/**
 * Normaliza una fila de `project_briefs` al formato que usa la app.
 * Garantiza que templateJson y responsesJson siempre sean objetos/arrays,
 * nunca null.
 */
function toApp(row) {
  return {
    id:                 row.id,
    projectId:          row.project_id,
    templateJson:       row.template_json   ?? DEFAULT_BRIEF_TEMPLATE,
    responsesJson:      row.responses_json  ?? {},
    status:             row.status          ?? BRIEF_STATUS.DRAFT,
    createdBy:          row.created_by      ?? null,
    createdAt:          row.created_at      ?? null,
    publicToken:        row.public_token    ?? null,
    // ── Personalización de mensajes (intro + celebración) ──────────────────
    welcomeTitle:       row.welcome_title       ?? 'Bienvenido al brief',
    welcomeDescription: row.welcome_description ?? 'Queremos conocerte mejor para construir este proyecto contigo.',
    successTitle:       row.success_title       ?? '¡Gracias por completar el brief!',
    successMessage:     row.success_message     ?? 'Hemos recibido toda tu información. Estamos listos para empezar contigo 🚀',
  }
}

// ─── fetchBriefByProject ──────────────────────────────────────────────────────
/**
 * Devuelve el brief de un proyecto, o null si todavía no existe.
 *
 * @param {string} projectId
 * @returns {Promise<object|null>}
 */
export async function fetchBriefByProject(projectId) {
  if (!projectId) return null

  console.log('[Brief] fetchBriefByProject →', projectId)

  const { data, error } = await supabase
    .from('project_briefs')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()          // no lanza error si no hay fila

  if (error) {
    console.error('[Brief] fetchBriefByProject ❌', error.message)
    throw error
  }

  if (!data) {
    console.log('[Brief] fetchBriefByProject → sin brief para este proyecto')
    return null
  }

  console.log('[Brief] fetchBriefByProject ✅', data.id)
  return toApp(data)
}

// ─── createBriefForProject ────────────────────────────────────────────────────
/**
 * Inserta un brief con la plantilla por defecto para un proyecto.
 * Si ya existe un brief para ese `project_id`, lo devuelve sin duplicar.
 *
 * Diseño de errores:
 *   Lanza el error para que el llamador (createProjectWithOwner)
 *   lo capture y solo loguee — nunca bloquea la creación del proyecto.
 *
 * @param {string} projectId
 * @param {string} userId     — auth.uid() del creador del proyecto
 * @returns {Promise<object>} Brief en formato app
 */
export async function createBriefForProject(projectId, userId, template = DEFAULT_BRIEF_TEMPLATE) {
  console.log('[Brief] createBriefForProject →', { projectId, userId })

  // ── De-duplicación: verificar si ya existe antes de insertar ─────────────
  const existing = await fetchBriefByProject(projectId)
  if (existing) {
    console.log('[Brief] createBriefForProject → ya existe, devolviendo existente:', existing.id)
    return existing
  }

  // Generate a unique public token for the shareable link
  const publicToken = crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

  const { data, error } = await supabase
    .from('project_briefs')
    .insert({
      project_id:     projectId,
      template_json:  template,
      responses_json: {},
      status:         BRIEF_STATUS.DRAFT,
      created_by:     userId,
      public_token:   publicToken,
    })
    .select()
    .single()

  if (error) {
    console.error('[Brief] createBriefForProject ❌', error.message)
    throw error
  }

  console.log('[Brief] createBriefForProject ✅', data.id)
  return toApp(data)
}

// ─── updateBriefResponses ─────────────────────────────────────────────────────
/**
 * Actualiza `responses_json` (respuestas del formulario).
 * Disponible para todos los miembros del proyecto.
 *
 * Hace un merge de las respuestas nuevas con las existentes para que
 * guardar un campo no borre los demás.
 *
 * @param {string} briefId
 * @param {object} responses — objeto plano { fieldId: value, … }
 * @returns {Promise<object>} Brief actualizado en formato app
 */
export async function updateBriefResponses(briefId, responses) {
  console.log('[Brief] updateBriefResponses →', briefId)

  const { data, error } = await supabase
    .from('project_briefs')
    .update({ responses_json: responses })
    .eq('id', briefId)
    .select()
    .single()

  if (error) {
    console.error('[Brief] updateBriefResponses ❌', error.message)
    throw error
  }

  console.log('[Brief] updateBriefResponses ✅')
  return toApp(data)
}

// ─── updateBriefTemplate ──────────────────────────────────────────────────────
/**
 * Actualiza `template_json` (estructura del formulario).
 * Solo disponible para el OWNER del proyecto.
 * La restricción se aplica en el hook (useBrief) antes de llegar aquí.
 *
 * @param {string} briefId
 * @param {object} template — objeto con formato { sections: [...] }
 * @returns {Promise<object>} Brief actualizado en formato app
 */
export async function updateBriefTemplate(briefId, template) {
  console.log('[Brief] updateBriefTemplate →', briefId)

  const { data, error } = await supabase
    .from('project_briefs')
    .update({ template_json: template })
    .eq('id', briefId)
    .select()
    .single()

  if (error) {
    console.error('[Brief] updateBriefTemplate ❌', error.message)
    throw error
  }

  console.log('[Brief] updateBriefTemplate ✅')
  return toApp(data)
}

// ─── updateBriefStatus ────────────────────────────────────────────────────────
/**
 * Actualiza el estado del brief.
 * Solo disponible para el OWNER del proyecto.
 * El hook valida que la transición sea permitida antes de llamar aquí.
 *
 * @param {string} briefId
 * @param {string} status — uno de BRIEF_STATUS.*
 * @returns {Promise<object>} Brief actualizado en formato app
 */
export async function updateBriefStatus(briefId, status) {
  console.log('[Brief] updateBriefStatus →', briefId, '→', status)

  const { data, error } = await supabase
    .from('project_briefs')
    .update({ status })
    .eq('id', briefId)
    .select()
    .single()

  if (error) {
    console.error('[Brief] updateBriefStatus ❌', error.message)
    throw error
  }

  console.log('[Brief] updateBriefStatus ✅', data.status)
  return toApp(data)
}

// ─── Backward-compat alias ────────────────────────────────────────────────────
// projectsSupabase.js ya importaba `createProjectBrief` antes de este refactor.
// Se mantiene como alias para no romper esa integración.
export const createProjectBrief = createBriefForProject

// ─── Public-link functions ────────────────────────────────────────────────────
//
// REQUIRED DB migration (run once in Supabase SQL editor):
//   ALTER TABLE project_briefs
//     ADD COLUMN IF NOT EXISTS public_token uuid UNIQUE;
//   UPDATE project_briefs
//     SET public_token = gen_random_uuid()
//     WHERE public_token IS NULL;
//
// REQUIRED RLS policy (to allow unauthenticated response saves):
//   CREATE POLICY "public_brief_responses_update"
//   ON project_briefs FOR UPDATE
//   USING (public_token IS NOT NULL)
//   WITH CHECK (public_token IS NOT NULL);
//
//   CREATE POLICY "public_brief_token_select"
//   ON project_briefs FOR SELECT
//   USING (public_token IS NOT NULL);

/**
 * Busca un brief por su public_token.
 * No requiere autenticación — usado en la vista pública.
 *
 * @param {string} token — UUID guardado en public_token
 * @returns {Promise<object|null>}
 */
export async function fetchBriefByToken(token) {
  if (!token) return null

  console.log('[Brief] fetchBriefByToken →', token)

  const { data, error } = await supabase
    .from('project_briefs')
    .select('*')
    .eq('public_token', token)
    .maybeSingle()

  if (error) {
    console.error('[Brief] fetchBriefByToken ❌', error.message)
    throw error
  }

  if (!data) {
    console.log('[Brief] fetchBriefByToken → no encontrado')
    return null
  }

  console.log('[Brief] fetchBriefByToken ✅', data.id)
  return toApp(data)
}

/**
 * Actualiza responses_json usando el public_token como identificador.
 * No requiere autenticación — la RLS policy debe permitir el UPDATE.
 *
 * @param {string} token     — public_token del brief
 * @param {object} responses — objeto plano { fieldId: value, … }
 * @returns {Promise<object>} Brief actualizado en formato app
 */
export async function updateBriefResponsesByToken(token, responses) {
  if (!token) throw new Error('Token inválido')

  console.log('[Brief] updateBriefResponsesByToken →', token)

  const { data, error } = await supabase
    .from('project_briefs')
    .update({ responses_json: responses })
    .eq('public_token', token)
    .select()
    .single()

  if (error) {
    console.error('[Brief] updateBriefResponsesByToken ❌', error.message)
    throw error
  }

  console.log('[Brief] updateBriefResponsesByToken ✅')
  return toApp(data)
}

/**
 * Actualiza los mensajes personalizados del brief (pantalla intro + celebración).
 * Solo disponible para el OWNER del proyecto.
 * La restricción se aplica en el hook (useBrief) antes de llegar aquí.
 *
 * @param {string} briefId
 * @param {{ welcomeTitle, welcomeDescription, successTitle, successMessage }} messages
 * @returns {Promise<object>} Brief actualizado en formato app
 */
export async function updateBriefMessages(briefId, messages) {
  console.log('[Brief] updateBriefMessages →', briefId)

  const { data, error } = await supabase
    .from('project_briefs')
    .update({
      welcome_title:       messages.welcomeTitle,
      welcome_description: messages.welcomeDescription,
      success_title:       messages.successTitle,
      success_message:     messages.successMessage,
    })
    .eq('id', briefId)
    .select()
    .single()

  if (error) {
    console.error('[Brief] updateBriefMessages ❌', error.message)
    throw error
  }

  console.log('[Brief] updateBriefMessages ✅')
  return toApp(data)
}

/**
 * Genera y guarda un public_token para un brief que no tiene uno aún.
 * Llamado de forma perezosa cuando el owner intenta copiar el link.
 *
 * @param {string} briefId
 * @returns {Promise<string>} El token generado
 */
export async function generatePublicToken(briefId) {
  if (!briefId) throw new Error('briefId requerido')

  const token = crypto.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

  console.log('[Brief] generatePublicToken →', briefId)

  const { error } = await supabase
    .from('project_briefs')
    .update({ public_token: token })
    .eq('id', briefId)

  if (error) {
    console.error('[Brief] generatePublicToken ❌', error.message)
    throw error
  }

  console.log('[Brief] generatePublicToken ✅')
  return token
}
