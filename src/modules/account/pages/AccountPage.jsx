import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import {
  fetchAccountProfile,
  updateFullName,
  updatePassword,
} from '../services/accountSupabase'

// ─── Shared styles ────────────────────────────────────────────────────────────

function card(extra = {}) {
  return {
    backgroundColor: '#fff',
    borderRadius:    '12px',
    border:          '1px solid #eaecf0',
    padding:         '28px 28px 24px',
    display:         'flex',
    flexDirection:   'column',
    gap:             '20px',
    ...extra,
  }
}

function sectionTitle(text) {
  return (
    <div>
      <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#101828' }}>{text}</h2>
      <div style={{ height: '1px', backgroundColor: '#f2f4f7', marginTop: '14px' }} />
    </div>
  )
}

function inputStyle(hasError = false, readOnly = false) {
  return {
    width:           '100%',
    padding:         '9px 13px',
    fontSize:        '14px',
    color:           readOnly ? '#667085' : '#101828',
    backgroundColor: readOnly ? '#f9fafb' : '#fff',
    border:          `1px solid ${hasError ? '#f04438' : '#d0d5dd'}`,
    borderRadius:    '8px',
    outline:         'none',
    boxSizing:       'border-box',
    fontFamily:      'inherit',
    cursor:          readOnly ? 'default' : 'text',
    transition:      'border-color 0.15s, box-shadow 0.15s',
  }
}

const FOCUS_ON  = { borderColor: '#7f56d9', boxShadow: '0 0 0 3px rgba(127,86,217,0.12)' }
const FOCUS_OFF = { borderColor: '#d0d5dd', boxShadow: 'none' }
const ERR_OFF   = { borderColor: '#f04438', boxShadow: 'none' }

function Field({ label, required, error, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500, color: '#344054' }}>
        {label}
        {required && <span style={{ color: '#f04438', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {hint  && !error && <span style={{ fontSize: '12px', color: '#98a2b3' }}>{hint}</span>}
      {error && <span style={{ fontSize: '12px', color: '#f04438' }}>{error}</span>}
    </div>
  )
}

function SaveButton({ saving, disabled, label = 'Guardar cambios', labelSaving = 'Guardando…' }) {
  return (
    <button
      type="submit"
      disabled={saving || disabled}
      style={{
        alignSelf:       'flex-start',
        display:         'inline-flex',
        alignItems:      'center',
        gap:             '7px',
        padding:         '8px 18px',
        borderRadius:    '8px',
        border:          '1px solid #6941c6',
        backgroundColor: saving || disabled ? '#a78bfa' : '#7f56d9',
        color:           '#fff',
        fontSize:        '13px',
        fontWeight:      500,
        cursor:          saving || disabled ? 'not-allowed' : 'pointer',
        transition:      'background-color 0.15s',
      }}
      onMouseEnter={(e) => { if (!saving && !disabled) e.currentTarget.style.backgroundColor = '#6941c6' }}
      onMouseLeave={(e) => { if (!saving && !disabled) e.currentTarget.style.backgroundColor = '#7f56d9' }}
    >
      {saving && (
        <span style={{
          display: 'inline-block', width: '11px', height: '11px',
          borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)',
          borderTopColor: '#fff', animation: 'spin 0.7s linear infinite',
        }} />
      )}
      {saving ? labelSaving : label}
    </button>
  )
}

function SuccessBanner({ message }) {
  return (
    <div style={{
      display:         'flex',
      alignItems:      'center',
      gap:             '8px',
      padding:         '10px 14px',
      borderRadius:    '8px',
      backgroundColor: '#ecfdf3',
      border:          '1px solid #abefc6',
      fontSize:        '13px',
      color:           '#027a48',
      fontWeight:      500,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#17b26a" strokeWidth="2.5">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {message}
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div style={{
      padding:         '10px 14px',
      borderRadius:    '8px',
      backgroundColor: '#fff3f2',
      border:          '1px solid #fecdca',
      fontSize:        '13px',
      color:           '#b42318',
      lineHeight:      1.5,
    }}>
      ⚠ {message}
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, size = 64 }) {
  return (
    <div style={{
      width:           `${size}px`,
      height:          `${size}px`,
      borderRadius:    '50%',
      flexShrink:      0,
      backgroundColor: '#f4f3ff',
      border:          '2px solid #e9d7fe',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      fontSize:        `${size * 0.28}px`,
      fontWeight:      700,
      color:           '#6941c6',
    }}>
      {initials || '?'}
    </div>
  )
}

// ─── Section 1: Información personal ──────────────────────────────────────────

function ProfileSection({ profile, authEmail, onSaved }) {
  const [fullName,  setFullName]  = useState(profile?.full_name ?? '')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const [nameError, setNameError] = useState('')
  const inputRef = useRef(null)

  // Reset local state when external profile changes (e.g. first load)
  useEffect(() => {
    setFullName(profile?.full_name ?? '')
  }, [profile?.full_name])

  function handleChange(v) {
    setFullName(v)
    if (nameError) setNameError('')
    if (success)   setSuccess(false)
    if (error)     setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fullName.trim()) { setNameError('El nombre es obligatorio.'); return }
    if (!profile?.id) {
      setError('No se pudo identificar el perfil. Recarga la página.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const saved = await updateFullName(profile.id, fullName)
      setFullName(saved.full_name)
      setSuccess(true)
      onSaved?.(saved)            // notificar al padre para actualizar initials en avatar
    } catch (err) {
      console.error('[Account] ProfileSection save error:', err?.message ?? err)
      setError(err?.message ?? 'Error desconocido al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const initials = fullName.trim()
    .split(/\s+/).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'

  return (
    <div style={card()}>
      {sectionTitle('Información personal')}

      {/* Avatar preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Avatar initials={initials} size={56} />
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#101828' }}>
            {fullName.trim() || 'Tu nombre'}
          </div>
          <div style={{ fontSize: '13px', color: '#667085', marginTop: '2px' }}>
            {authEmail}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <Field label="Nombre completo" required error={nameError}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ej. María López"
            value={fullName}
            maxLength={80}
            onChange={(e) => handleChange(e.target.value)}
            style={inputStyle(!!nameError)}
            onFocus={(e) => Object.assign(e.target.style, FOCUS_ON)}
            onBlur={(e)  => Object.assign(e.target.style, nameError ? ERR_OFF : FOCUS_OFF)}
          />
        </Field>

        <Field
          label="Correo electrónico"
          hint="El correo está vinculado a tu cuenta de Supabase y no puede cambiarse aquí."
        >
          <input
            type="email"
            value={authEmail}
            readOnly
            style={inputStyle(false, true)}
          />
        </Field>

        {error   && <ErrorBanner   message={error}   />}
        {success && <SuccessBanner message="Nombre guardado correctamente." />}

        <SaveButton saving={saving} />
      </form>
    </div>
  )
}

// ─── Section 2: Seguridad ─────────────────────────────────────────────────────

const MIN_PASSWORD_LENGTH = 6

function SecuritySection() {
  const [newPwd,     setNewPwd]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState(false)
  const [fieldErrs,  setFieldErrs]  = useState({})

  function clearStatus() {
    if (error)   setError('')
    if (success) setSuccess(false)
  }

  function validate() {
    const errs = {}
    if (!newPwd)
      errs.newPwd = 'La contraseña es obligatoria.'
    else if (newPwd.length < MIN_PASSWORD_LENGTH)
      errs.newPwd = `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`
    if (!confirmPwd)
      errs.confirmPwd = 'Confirma la contraseña.'
    else if (newPwd && confirmPwd !== newPwd)
      errs.confirmPwd = 'Las contraseñas no coinciden.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrs(errs); return }

    setSaving(true)
    setError('')
    setSuccess(false)
    setFieldErrs({})

    try {
      await updatePassword(newPwd)
      setSuccess(true)
      setNewPwd('')
      setConfirmPwd('')
    } catch (err) {
      console.error('[Account] SecuritySection save error:', err?.message ?? err)
      setError(err?.message ?? 'Error desconocido al cambiar la contraseña.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={card()}>
      {sectionTitle('Seguridad')}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <Field label="Nueva contraseña" required error={fieldErrs.newPwd}>
          <input
            type="password"
            placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
            value={newPwd}
            maxLength={128}
            onChange={(e) => { setNewPwd(e.target.value); clearStatus(); if (fieldErrs.newPwd) setFieldErrs((p) => ({ ...p, newPwd: '' })) }}
            style={inputStyle(!!fieldErrs.newPwd)}
            onFocus={(e) => Object.assign(e.target.style, FOCUS_ON)}
            onBlur={(e)  => Object.assign(e.target.style, fieldErrs.newPwd ? ERR_OFF : FOCUS_OFF)}
          />
        </Field>

        <Field label="Confirmar contraseña" required error={fieldErrs.confirmPwd}>
          <input
            type="password"
            placeholder="Repite la nueva contraseña"
            value={confirmPwd}
            maxLength={128}
            onChange={(e) => { setConfirmPwd(e.target.value); clearStatus(); if (fieldErrs.confirmPwd) setFieldErrs((p) => ({ ...p, confirmPwd: '' })) }}
            style={inputStyle(!!fieldErrs.confirmPwd)}
            onFocus={(e) => Object.assign(e.target.style, FOCUS_ON)}
            onBlur={(e)  => Object.assign(e.target.style, fieldErrs.confirmPwd ? ERR_OFF : FOCUS_OFF)}
          />
        </Field>

        {error   && <ErrorBanner   message={error}   />}
        {success && <SuccessBanner message="Contraseña actualizada correctamente." />}

        <SaveButton saving={saving} label="Cambiar contraseña" labelSaving="Cambiando…" />
      </form>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton({ width = '100%', height = '16px', radius = '6px' }) {
  return (
    <div style={{
      width, height,
      borderRadius:    radius,
      backgroundColor: '#f2f4f7',
      animation:       'pulse 1.5s ease-in-out infinite',
    }} />
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { user: authUser } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!authUser?.id) return

    console.log('[Account] Cargando perfil para auth.uid:', authUser.id)
    setLoading(true)
    setLoadError('')

    fetchAccountProfile(authUser.id, authUser.email)
      .then((data) => {
        setProfile(data)
        console.log('[Account] Perfil cargado:', data?.id ?? '(sin perfil en DB)')
      })
      .catch((err) => {
        console.error('[Account] Error cargando perfil:', err?.message ?? err)
        setLoadError(err?.message ?? 'No se pudo cargar el perfil.')
      })
      .finally(() => setLoading(false))
  }, [authUser?.id])

  const authEmail = authUser?.email ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* Page header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#101828' }}>Mi cuenta</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#475467' }}>
          Gestiona tu información personal y seguridad.
        </p>
      </div>

      {/* Error de carga */}
      {loadError && <ErrorBanner message={loadError} />}

      {/* Skeleton mientras carga */}
      {loading && (
        <div style={card({ gap: '16px' })}>
          <Skeleton height="14px" width="160px" />
          <div style={{ height: '1px', backgroundColor: '#f2f4f7' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Skeleton width="56px" height="56px" radius="50%" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <Skeleton height="14px" width="180px" />
              <Skeleton height="12px" width="140px" />
            </div>
          </div>
          <Skeleton height="36px" />
          <Skeleton height="36px" />
          <Skeleton height="34px" width="140px" />
        </div>
      )}

      {/* Sección 1: Información personal */}
      {!loading && (
        <ProfileSection
          profile={profile}
          authEmail={authEmail}
          onSaved={(saved) => setProfile((prev) => ({ ...prev, ...saved }))}
        />
      )}

      {/* Sección 2: Seguridad */}
      {!loading && <SecuritySection />}
    </div>
  )
}
