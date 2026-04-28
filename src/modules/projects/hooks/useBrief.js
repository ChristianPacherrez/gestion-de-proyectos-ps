import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import {
  fetchBriefByProject,
  createBriefForProject,
  updateBriefResponses,
  updateBriefTemplate,
  updateBriefStatus,
  updateBriefMessages,
  generatePublicToken,
  BRIEF_STATUS,
  BRIEF_STATUS_TRANSITIONS,
} from '../../../lib/supabase/briefSupabase'
import {
  canEditBriefResponses,
  canEditBriefTemplate,
  canChangeBriefStatus,
} from '../services/membersSupabase'

// ─── useBrief ──────────────────────────────────────────────────────────────────
/**
 * Hook para leer y escribir el brief de un proyecto.
 *
 * Estado:
 *   brief         — objeto normalizado { id, projectId, templateJson,
 *                   responsesJson, status, createdBy, createdAt } | null
 *   loading       — true mientras carga la primera vez
 *   error         — string con el mensaje de error, o null
 *   saving        — true mientras una operación de escritura está en curso
 *
 * Permisos derivados (calculados desde el rol):
 *   canRespond    — todos los miembros pueden completar respuestas
 *   canTemplate   — solo el owner puede modificar la estructura
 *   canStatus     — solo el owner puede cambiar el estado
 *
 * Acciones:
 *   loadBrief()                    — recarga desde DB
 *   saveResponses(responses)       — guarda responses_json completo
 *   mergeResponses(partial)        — merge de un subset de respuestas
 *   saveTemplate(template)         — reemplaza template_json (owner only)
 *   changeStatus(status)           — transiciona el estado (owner only)
 *   nextStatus()                   — avanza al siguiente estado válido
 *
 * Utilidades:
 *   getResponse(fieldId, def?)     — lee un campo de responsesJson con fallback
 *   validTransitions               — lista de estados a los que se puede ir
 *   BRIEF_STATUS                   — re-exportado para uso en componentes
 *
 * @param {string}             projectId
 * @param {'owner'|'collaborator'|'client'|null} role
 */
export function useBrief(projectId, role) {
  const { user }  = useAuth()

  const [brief,   setBrief]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [saving,  setSaving]  = useState(false)

  // ── Permisos derivados del rol ──────────────────────────────────────────────
  const canRespond  = canEditBriefResponses(role)
  const canTemplate = canEditBriefTemplate(role)
  const canStatus   = canChangeBriefStatus(role)
  /** Solo el owner puede crear el brief manualmente */
  const canCreate   = role === 'owner'

  // ── loadBrief ───────────────────────────────────────────────────────────────
  const loadBrief = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)

    try {
      const data = await fetchBriefByProject(projectId)
      setBrief(data)
    } catch (err) {
      console.error('[useBrief] loadBrief ❌', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadBrief()
  }, [loadBrief])

  // ── saveResponses ───────────────────────────────────────────────────────────
  /**
   * Reemplaza responses_json completo.
   * Disponible para cualquier miembro (canRespond).
   */
  async function saveResponses(responses) {
    if (!brief)       throw new Error('Brief no cargado')
    if (!canRespond)  throw new Error('Sin permiso para editar respuestas')

    const snapshot = brief
    setSaving(true)
    setError(null)

    // Actualización optimista
    setBrief((prev) => prev ? { ...prev, responsesJson: responses } : prev)

    try {
      const confirmed = await updateBriefResponses(brief.id, responses)
      setBrief(confirmed)
      return confirmed
    } catch (err) {
      setBrief(snapshot)   // rollback
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  // ── mergeResponses ──────────────────────────────────────────────────────────
  /**
   * Merge de un subconjunto de respuestas sin perder las existentes.
   * Útil para guardar un campo individual sin esperar a que el formulario
   * esté completo.
   */
  async function mergeResponses(partial) {
    const merged = { ...(brief?.responsesJson ?? {}), ...partial }
    return saveResponses(merged)
  }

  // ── saveTemplate ────────────────────────────────────────────────────────────
  /**
   * Reemplaza template_json completo.
   * Solo disponible para el owner (canTemplate).
   */
  async function saveTemplate(template) {
    if (!brief)       throw new Error('Brief no cargado')
    if (!canTemplate) throw new Error('Solo el owner puede editar la plantilla')

    const snapshot = brief
    setSaving(true)
    setError(null)

    setBrief((prev) => prev ? { ...prev, templateJson: template } : prev)

    try {
      const confirmed = await updateBriefTemplate(brief.id, template)
      setBrief(confirmed)
      return confirmed
    } catch (err) {
      setBrief(snapshot)
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  // ── changeStatus ────────────────────────────────────────────────────────────
  /**
   * Cambia el estado del brief.
   * Valida que la transición sea permitida antes de llamar a DB.
   * Solo disponible para el owner (canStatus).
   */
  async function changeStatus(newStatus) {
    if (!brief)      throw new Error('Brief no cargado')
    if (!canStatus)  throw new Error('Solo el owner puede cambiar el estado')

    const allowed = BRIEF_STATUS_TRANSITIONS[brief.status] ?? []
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Transición inválida: ${brief.status} → ${newStatus}. ` +
        `Permitidas: ${allowed.join(', ') || 'ninguna'}`
      )
    }

    const snapshot = brief
    setSaving(true)
    setError(null)

    setBrief((prev) => prev ? { ...prev, status: newStatus } : prev)

    try {
      const confirmed = await updateBriefStatus(brief.id, newStatus)
      setBrief(confirmed)
      return confirmed
    } catch (err) {
      setBrief(snapshot)
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  // ── nextStatus ──────────────────────────────────────────────────────────────
  /**
   * Avanza al primer estado válido de la transición actual.
   * Útil para un botón "Siguiente estado" genérico.
   */
  async function nextStatus() {
    const transitions = BRIEF_STATUS_TRANSITIONS[brief?.status] ?? []
    if (transitions.length === 0) {
      throw new Error(`El estado "${brief?.status}" no admite transición`)
    }
    return changeStatus(transitions[0])
  }

  // ── initializeBrief ─────────────────────────────────────────────────────────
  /**
   * Crea el brief para el proyecto con la plantilla elegida por el owner.
   * Solo disponible cuando no existe brief (brief === null) y role === 'owner'.
   *
   * @param {object} template — objeto { sections: [...] } del template elegido
   * @returns {Promise<object>} Brief creado en formato app
   */
  async function initializeBrief(template) {
    if (!canCreate)    throw new Error('Solo el owner puede crear el brief')
    if (brief)         throw new Error('El brief ya existe')
    if (!user?.id)     throw new Error('Usuario no autenticado')

    setSaving(true)
    setError(null)

    try {
      const created = await createBriefForProject(projectId, user.id, template)
      setBrief(created)
      return created
    } catch (err) {
      console.error('[useBrief] initializeBrief ❌', err.message)
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  // ── changeTemplate ──────────────────────────────────────────────────────────
  /**
   * Cambia la plantilla del brief y resetea las respuestas a vacío.
   * Solo disponible en estado 'draft' y para el owner (canTemplate).
   *
   * La operación es optimista: actualiza el estado local de inmediato y hace
   * rollback si alguna de las dos escrituras falla.
   *
   * @param {object} newTemplate — objeto { sections: [...] } elegido por el owner
   * @returns {Promise<object>} Brief actualizado en formato app
   */
  async function changeTemplate(newTemplate) {
    if (!brief)
      throw new Error('Brief no cargado')
    if (!canTemplate)
      throw new Error('Solo el owner puede cambiar la plantilla')
    if (brief.status !== 'draft')
      throw new Error('La plantilla solo puede cambiarse cuando el brief está en borrador')

    const snapshot = brief
    setSaving(true)
    setError(null)

    // Optimistic: nuevo template + respuestas vacías
    setBrief((prev) =>
      prev ? { ...prev, templateJson: newTemplate, responsesJson: {} } : prev
    )

    try {
      await updateBriefTemplate(brief.id, newTemplate)
      const confirmed = await updateBriefResponses(brief.id, {})
      setBrief(confirmed)
      return confirmed
    } catch (err) {
      setBrief(snapshot)
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  // ── saveMessages ─────────────────────────────────────────────────────────────
  /**
   * Guarda los mensajes personalizados (intro + celebración).
   * Solo disponible para el owner (canTemplate).
   *
   * @param {{ welcomeTitle, welcomeDescription, successTitle, successMessage }} messages
   * @returns {Promise<object>} Brief actualizado en formato app
   */
  async function saveMessages(messages) {
    if (!brief)       throw new Error('Brief no cargado')
    if (!canTemplate) throw new Error('Solo el owner puede editar los mensajes del brief')

    const snapshot = brief
    setSaving(true)
    setError(null)

    // Actualización optimista
    setBrief((prev) => prev ? { ...prev, ...messages } : prev)

    try {
      const confirmed = await updateBriefMessages(brief.id, messages)
      setBrief(confirmed)
      return confirmed
    } catch (err) {
      setBrief(snapshot)
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  // ── ensurePublicToken ────────────────────────────────────────────────────────
  /**
   * Retorna el public_token del brief. Si no existe, lo genera y guarda.
   * Solo para owner (canTemplate).
   *
   * @returns {Promise<string>} El token público
   */
  async function ensurePublicToken() {
    if (!canTemplate) throw new Error('Solo el owner puede generar el link público')
    if (!brief?.id)   throw new Error('Brief no cargado')

    // Already has a token — return it immediately
    if (brief.publicToken) return brief.publicToken

    // Generate lazily for briefs created before public_token column was added
    const token = await generatePublicToken(brief.id)
    setBrief((prev) => prev ? { ...prev, publicToken: token } : prev)
    return token
  }

  // ── getResponse ─────────────────────────────────────────────────────────────
  /**
   * Lee el valor de un campo de las respuestas.
   * @param {string} fieldId
   * @param {*}      defaultValue
   */
  function getResponse(fieldId, defaultValue = '') {
    return brief?.responsesJson?.[fieldId] ?? defaultValue
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const validTransitions = brief
    ? (BRIEF_STATUS_TRANSITIONS[brief.status] ?? [])
    : []

  // Calcular si el brief está completado: todas las secciones tienen al menos
  // un campo requerido respondido (o no hay campos requeridos).
  const isComplete = (() => {
    if (!brief) return false
    const sections = brief.templateJson?.sections ?? []
    const required = sections
      .flatMap((s) => s.fields ?? [])
      .filter((f) => f.required)

    if (required.length === 0) return false  // sin campos obligatorios → no se puede "completar"
    return required.every((f) => {
      const val = brief.responsesJson?.[f.id]
      return val !== undefined && val !== null && String(val).trim() !== ''
    })
  })()

  return {
    // ── Estado ──────────────────────────────────────────────────────────────
    brief,
    loading,
    error,
    saving,
    clearError: () => setError(null),

    // ── Permisos ─────────────────────────────────────────────────────────────
    canRespond,
    canTemplate,
    canStatus,
    canCreate,

    // ── Acciones ─────────────────────────────────────────────────────────────
    loadBrief,
    initializeBrief,
    saveResponses,
    mergeResponses,
    saveTemplate,
    changeTemplate,
    saveMessages,
    changeStatus,
    nextStatus,
    ensurePublicToken,

    // ── Utilidades ────────────────────────────────────────────────────────────
    getResponse,
    validTransitions,
    isComplete,

    // ── Constantes re-exportadas (evita imports extras en componentes) ────────
    BRIEF_STATUS,
  }
}
