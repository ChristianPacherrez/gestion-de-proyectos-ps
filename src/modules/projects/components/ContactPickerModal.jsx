import { useEffect, useRef, useState } from 'react'
import { ROLES } from '../../users/context/UsersContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const MEMBER_ROLES = [
  { value: 'collaborator', label: 'Colaborador' },
  { value: 'client',       label: 'Cliente'     },
]

const SELECT_BASE = {
  appearance:         'none',
  backgroundImage:    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat:   'no-repeat',
  backgroundPosition: 'right 8px center',
  paddingRight:       '26px',
  cursor:             'pointer',
  outline:            'none',
  fontFamily:         'inherit',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function getInitials(name) {
  if (!name?.trim()) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, size = 34 }) {
  const palettes = [
    { bg: '#f9f5ff', text: '#6941c6', border: '#e9d7fe' },
    { bg: '#eff8ff', text: '#175cd3', border: '#b2ddff' },
    { bg: '#ecfdf3', text: '#027a48', border: '#abefc6' },
    { bg: '#fff4ed', text: '#b93815', border: '#f9dbaf' },
    { bg: '#fdf2fa', text: '#c11574', border: '#fcceee' },
  ]
  const p = palettes[(name?.charCodeAt(0) ?? 0) % palettes.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      backgroundColor: p.bg, border: `1.5px solid ${p.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: p.text, userSelect: 'none',
    }}>
      {getInitials(name)}
    </div>
  )
}

// ─── RoleSelect ───────────────────────────────────────────────────────────────

function RoleSelect({ value, onChange, disabled }) {
  const cfg = ROLES[value] ?? ROLES.collaborator
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        ...SELECT_BASE,
        padding:         '4px 26px 4px 10px',
        fontSize:        '12px',
        fontWeight:      500,
        color:           cfg.text,
        backgroundColor: cfg.bg,
        border:          `1px solid ${cfg.border}`,
        borderRadius:    '9999px',
        opacity:         disabled ? 0.6 : 1,
      }}
    >
      {MEMBER_ROLES.map(({ value: v, label }) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ size = 13, color = '#fff' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      borderRadius: '50%', border: `2px solid ${color}44`,
      borderTopColor: color, animation: 'cp-spin 0.65s linear infinite', flexShrink: 0,
    }} />
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type = 'success', onHide }) {
  useEffect(() => {
    const t = setTimeout(onHide, 3500)
    return () => clearTimeout(t)
  }, [onHide])

  const bg = type === 'success' ? '#101828' : '#027a48'

  return (
    <div style={{
      position: 'fixed', bottom: '28px', left: '50%',
      transform: 'translateX(-50%)', zIndex: 1100,
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      padding: '10px 18px', borderRadius: '10px',
      backgroundColor: bg, color: '#fff',
      fontSize: '13px', fontWeight: 500,
      boxShadow: '0 4px 16px rgba(0,0,0,0.22)', whiteSpace: 'nowrap',
      pointerEvents: 'none', animation: 'cp-fadein 0.18s ease',
    }}>
      <span style={{ fontSize: '15px' }}>{type === 'pending' ? '📧' : '✓'}</span>
      {message}
    </div>
  )
}

// ─── InviteResult banner (inline, dentro del modal) ───────────────────────────

function InviteResult({ result, onDismiss }) {
  if (!result) return null

  const isPending = result.type === 'pending'
  const styles = isPending
    ? { bg: '#eff8ff', border: '#b2ddff', text: '#175cd3', icon: '📧' }
    : { bg: '#ecfdf3', border: '#abefc6', text: '#027a48', icon: '✓' }

  return (
    <div style={{
      display:         'flex',
      alignItems:      'flex-start',
      gap:             '8px',
      padding:         '10px 14px',
      borderRadius:    '8px',
      backgroundColor: styles.bg,
      border:          `1px solid ${styles.border}`,
      fontSize:        '12px',
      color:           styles.text,
      lineHeight:      1.5,
    }}>
      <span style={{ flexShrink: 0, marginTop: '1px' }}>{styles.icon}</span>
      <span style={{ flex: 1 }}>{result.message}</span>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: styles.text, fontSize: '12px', padding: '0 2px', flexShrink: 0 }}
      >
        ✕
      </button>
    </div>
  )
}

// ─── EmailInviteSection ───────────────────────────────────────────────────────

function EmailInviteSection({ onInvite }) {
  const [email,     setEmail]     = useState('')
  const [role,      setRole]      = useState('collaborator')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [result,    setResult]    = useState(null)   // { type, message }
  const inputRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setResult(null)

    const trimmed = email.trim()
    if (!trimmed) return

    if (!isValidEmail(trimmed)) {
      setError('Introduce un email válido.')
      inputRef.current?.focus()
      return
    }

    setLoading(true)
    try {
      const res = await onInvite(trimmed, role)

      if (res.type === 'added') {
        setResult({
          type:    'added',
          message: `${res.profile?.full_name ?? trimmed} fue agregado al proyecto como ${ROLES[role]?.label ?? role}.`,
        })
      } else {
        setResult({
          type:    'pending',
          message: `${trimmed} aún no tiene cuenta. Se guardó la invitación como pendiente — se activará automáticamente cuando se registre en la plataforma.`,
        })
      }

      setEmail('')  // limpiar input tras éxito
    } catch (err) {
      setError(err?.message ?? 'Error al procesar la invitación.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#98a2b3', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        Invitar por email
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

          {/* Email input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              ref={inputRef}
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); setResult(null) }}
              disabled={loading}
              style={{
                width:           '100%',
                padding:         '8px 12px',
                fontSize:        '13px',
                color:           '#101828',
                backgroundColor: loading ? '#f9fafb' : '#fff',
                border:          `1px solid ${error ? '#f04438' : '#d0d5dd'}`,
                borderRadius:    '8px',
                outline:         'none',
                boxSizing:       'border-box',
                fontFamily:      'inherit',
                transition:      'border-color 0.12s, box-shadow 0.12s',
              }}
              onFocus={(e) => {
                if (!error) Object.assign(e.target.style, { borderColor: '#7f56d9', boxShadow: '0 0 0 3px rgba(127,86,217,0.12)' })
              }}
              onBlur={(e) => {
                if (!error) Object.assign(e.target.style, { borderColor: '#d0d5dd', boxShadow: 'none' })
              }}
            />
          </div>

          {/* Role select */}
          <RoleSelect value={role} onChange={setRole} disabled={loading} />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              gap:             '6px',
              padding:         '8px 14px',
              borderRadius:    '8px',
              border:          '1px solid #6941c6',
              backgroundColor: loading ? '#a78bfa' : (!email.trim() ? '#c4b5fd' : '#7f56d9'),
              color:           '#fff',
              fontSize:        '13px',
              fontWeight:      500,
              cursor:          (loading || !email.trim()) ? 'not-allowed' : 'pointer',
              flexShrink:      0,
              transition:      'background-color 0.12s',
              whiteSpace:      'nowrap',
            }}
            onMouseEnter={(e) => { if (!loading && email.trim()) e.currentTarget.style.backgroundColor = '#6941c6' }}
            onMouseLeave={(e) => { if (!loading && email.trim()) e.currentTarget.style.backgroundColor = '#7f56d9' }}
          >
            {loading && <Spinner size={12} color="#fff" />}
            {loading ? 'Procesando…' : 'Invitar'}
          </button>
        </div>
      </form>

      {/* Error inline */}
      {error && (
        <p style={{ margin: 0, fontSize: '12px', color: '#b42318', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>⚠</span> {error}
        </p>
      )}

      {/* Resultado de la invitación */}
      {result && (
        <InviteResult result={result} onDismiss={() => setResult(null)} />
      )}
    </div>
  )
}

// ─── NoAccountBadge ───────────────────────────────────────────────────────────

function NoAccountBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '9999px',
      fontSize: '11px', fontWeight: 500,
      backgroundColor: '#f2f4f7', color: '#667085', border: '1px solid #eaecf0',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      Sin cuenta
    </span>
  )
}

// ─── ContactRow ───────────────────────────────────────────────────────────────

function ContactRow({ contact, onAdd }) {
  const [role,   setRole]   = useState('collaborator')
  const [adding, setAdding] = useState(false)
  const [rowErr, setRowErr] = useState(null)
  const disabled = !contact.canAdd

  async function handleAdd() {
    if (adding || disabled) return
    setAdding(true)
    setRowErr(null)
    try {
      await onAdd(contact, role)
    } catch (err) {
      setRowErr(err?.message ?? 'Error al agregar')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: '6px',
        padding: '10px 12px', borderRadius: '8px',
        border: '1px solid #f2f4f7',
        backgroundColor: disabled ? '#fafafa' : '#fff',
        opacity: disabled ? 0.55 : 1,
        transition: 'border-color 0.12s',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = '#d0d5dd' }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.borderColor = '#f2f4f7' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Avatar name={contact.full_name ?? contact.email} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contact.full_name || '(sin nombre)'}
          </p>
          <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#667085', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contact.email}
          </p>
        </div>

        {disabled ? (
          <NoAccountBadge />
        ) : (
          <>
            <RoleSelect value={role} onChange={setRole} disabled={adding} />
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '5px 12px', borderRadius: '7px',
                border: '1px solid #6941c6',
                backgroundColor: adding ? '#a78bfa' : '#7f56d9',
                color: '#fff', fontSize: '12px', fontWeight: 500,
                cursor: adding ? 'not-allowed' : 'pointer',
                flexShrink: 0, transition: 'background-color 0.12s',
              }}
              onMouseEnter={(e) => { if (!adding) e.currentTarget.style.backgroundColor = '#6941c6' }}
              onMouseLeave={(e) => { if (!adding) e.currentTarget.style.backgroundColor = '#7f56d9' }}
            >
              {adding && <Spinner size={11} color="#fff" />}
              {adding ? 'Agregando…' : 'Agregar'}
            </button>
          </>
        )}
      </div>

      {rowErr && (
        <p style={{ margin: 0, fontSize: '11px', color: '#b42318', paddingLeft: '44px', lineHeight: 1.4 }}>
          ⚠ {rowErr}
        </p>
      )}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ hasSearch }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 16px', gap: '8px', textAlign: 'center' }}>
      <span style={{ fontSize: '26px' }}>{hasSearch ? '🔍' : '👥'}</span>
      <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#475467' }}>
        {hasSearch ? 'No hay coincidencias' : 'Sin contactos disponibles'}
      </p>
      <p style={{ margin: 0, fontSize: '12px', color: '#98a2b3', lineHeight: 1.5 }}>
        {hasSearch
          ? 'Prueba con otro nombre o email.'
          : 'Todos tus contactos ya son miembros del proyecto.'}
      </p>
    </div>
  )
}

// ─── ContactPickerModal ───────────────────────────────────────────────────────
/**
 * Modal para agregar miembros: sección de invitación por email + lista de contactos.
 *
 * Props:
 *   availableContacts    — del hook (contactos filtrados, con canAdd)
 *   contactsLoading      — true mientras carga la lista
 *   onAdd(contact, role) — async; agrega desde contactos existentes
 *   onInvite(email, role)— async; flujo dual email (added | pending)
 *   onClose()
 *
 * Uso desde el padre:
 *   const { availableContacts, contactsLoading, addMemberFromContact, inviteByEmail, loadAvailableContacts } =
 *     useProjectMember(projectId, project.createdBy)
 *
 *   <ContactPickerModal
 *     availableContacts={availableContacts}
 *     contactsLoading={contactsLoading}
 *     onAdd={addMemberFromContact}
 *     onInvite={inviteByEmail}
 *     onClose={() => setShowPicker(false)}
 *   />
 */
export default function ContactPickerModal({
  availableContacts = [],
  contactsLoading   = false,
  onAdd,
  onInvite,
  onClose,
}) {
  const [search, setSearch] = useState('')
  const [toast,  setToast]  = useState(null)
  const searchRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const query    = search.trim().toLowerCase()
  const filtered = query
    ? availableContacts.filter((c) =>
        c.full_name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
      )
    : availableContacts

  const withAccount    = filtered.filter((c) =>  c.canAdd)
  const withoutAccount = filtered.filter((c) => !c.canAdd)
  const ordered        = [...withAccount, ...withoutAccount]

  async function handleAdd(contact, role) {
    const result = await onAdd(contact, role)
    const label  = contact.full_name ?? contact.email

    if (result?.type === 'pending') {
      setToast(`${label} aún no tiene cuenta — quedará como invitación pendiente.`)
    } else {
      setToast(`${label} agregado al proyecto.`)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Agregar miembro al proyecto"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(16,24,40,0.5)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '16px',
        }}
      >
        <div style={{
          backgroundColor: '#fff', borderRadius: '16px',
          boxShadow: '0px 24px 48px -12px rgba(0,0,0,0.18)',
          width: '100%', maxWidth: '520px',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 48px)',
        }}>

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#101828' }}>
                  Agregar miembro
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#475467' }}>
                  Invita por email o elige desde tus contactos.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px 4px', borderRadius: '6px',
                  color: '#98a2b3', fontSize: '18px', lineHeight: 1, flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* ── Sección email ──────────────────────────────────────────── */}
            <div style={{ marginTop: '16px' }}>
              <EmailInviteSection onInvite={onInvite} />
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: '#eaecf0', margin: '16px 0 0', flexShrink: 0 }} />

          {/* ── Sección contactos ──────────────────────────────────────────── */}
          <div style={{ padding: '14px 24px 0', flexShrink: 0 }}>
            <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 600, color: '#98a2b3', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Desde contactos
            </p>

            {/* Buscador */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#98a2b3', pointerEvents: 'none' }}>
                🔍
              </span>
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar contacto…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '7px 32px 7px 32px',
                  fontSize: '13px', color: '#101828',
                  backgroundColor: '#f9fafb', border: '1px solid #eaecf0',
                  borderRadius: '8px', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                  transition: 'border-color 0.12s, box-shadow 0.12s',
                }}
                onFocus={(e) => Object.assign(e.target.style, { borderColor: '#7f56d9', boxShadow: '0 0 0 3px rgba(127,86,217,0.12)', backgroundColor: '#fff' })}
                onBlur={(e)  => Object.assign(e.target.style, { borderColor: '#eaecf0', boxShadow: 'none', backgroundColor: '#f9fafb' })}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#98a2b3', fontSize: '12px', padding: '2px', lineHeight: 1 }}
                >✕</button>
              )}
            </div>

            {/* Contador */}
            {!contactsLoading && availableContacts.length > 0 && (
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#98a2b3' }}>
                {withAccount.length} disponible{withAccount.length !== 1 ? 's' : ''}
                {withoutAccount.length > 0 && ` · ${withoutAccount.length} sin cuenta`}
              </p>
            )}
          </div>

          {/* ── Lista ────────────────────────────────────────────────────────── */}
          <div style={{
            overflowY: 'auto', padding: '10px 16px',
            flex: 1, display: 'flex', flexDirection: 'column',
            gap: '6px', minHeight: '100px',
          }}>
            {contactsLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} style={{
                  height: '56px', borderRadius: '8px', backgroundColor: '#f2f4f7',
                  animation: 'cp-pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.12}s`,
                }} />
              ))
            ) : ordered.length === 0 ? (
              <EmptyState hasSearch={Boolean(query)} />
            ) : (
              ordered.map((contact) => (
                <ContactRow key={contact.id} contact={contact} onAdd={handleAdd} />
              ))
            )}
          </div>

          {/* ── Footer ───────────────────────────────────────────────────────── */}
          <div style={{
            padding: '14px 24px', borderTop: '1px solid #eaecf0',
            backgroundColor: '#f9fafb', flexShrink: 0,
            display: 'flex', justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: '8px',
                border: '1px solid #d0d5dd', backgroundColor: '#fff',
                color: '#344054', fontSize: '13px', fontWeight: 500,
                cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'background-color 0.12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff' }}
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>

      {/* Toast global (solo para agregar desde contactos) */}
      {toast && <Toast message={toast} onHide={() => setToast(null)} />}

      <style>{`
        @keyframes cp-spin   { to { transform: rotate(360deg); } }
        @keyframes cp-fadein { from { opacity:0; transform:translateX(-50%) translateY(6px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        @keyframes cp-pulse  { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </>
  )
}
