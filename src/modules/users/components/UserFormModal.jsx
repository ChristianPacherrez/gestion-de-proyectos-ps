import { useEffect, useRef, useState } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Shared input styles ──────────────────────────────────────────────────────

function inputStyle(hasError = false, disabled = false) {
  return {
    width: '100%', padding: '9px 13px', fontSize: '14px',
    color: disabled ? '#667085' : '#101828',
    backgroundColor: disabled ? '#f9fafb' : '#fff',
    border: `1px solid ${hasError ? '#f04438' : '#d0d5dd'}`,
    borderRadius: '8px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    cursor: disabled ? 'default' : 'text',
  };
}

const FOCUS_ON  = { borderColor: '#7f56d9', boxShadow: '0 0 0 3px rgba(127,86,217,0.12)' };
const FOCUS_OFF = { borderColor: '#d0d5dd', boxShadow: 'none' };
const ERR_OFF   = { borderColor: '#f04438', boxShadow: 'none' };

function Field({ label, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#344054' }}>{label}</label>
        {hint && <span style={{ fontSize: '11px', color: '#98a2b3' }}>{hint}</span>}
      </div>
      {children}
      {error && <span style={{ fontSize: '12px', color: '#f04438' }}>{error}</span>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Dual-mode modal para contactos.
 *
 * CREATE — campos: email (obligatorio) + alias (opcional)
 * EDIT   — muestra email como referencia no editable + alias (editable)
 *
 * El email no puede cambiarse en edición: es el identificador del contacto.
 */
export default function UserFormModal({ initialUser = null, onClose, onSubmit }) {
  const isEdit = initialUser !== null;

  // Estado del formulario
  const [email,       setEmail]       = useState(isEdit ? (initialUser.email ?? '') : '');
  const [alias,       setAlias]       = useState(isEdit ? (initialUser.name  ?? '') : '');
  const [emailError,  setEmailError]  = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');

  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function validate() {
    if (!isEdit) {
      if (!email.trim())         return { email: 'El email es obligatorio.' };
      if (!isValidEmail(email))  return { email: 'Introduce un email válido.' };
    }
    return {};
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();

    if (errs.email) { setEmailError(errs.email); return; }

    setSubmitting(true);
    setSubmitError('');

    // Construir el objeto que irá al servicio
    const payload = isEdit
      ? { ...initialUser, name: alias.trim() || '' }
      : { id: crypto.randomUUID(), email: email.trim(), name: alias.trim() || '' };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const msg = err?.message ?? 'Error desconocido al guardar el contacto.';
      console.error('[ContactModal] onSubmit error:', msg);
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog" aria-modal="true"
      aria-label={isEdit ? 'Editar contacto' : 'Invitar contacto'}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
        width: '100%', maxWidth: '400px', overflow: 'hidden',
      }}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 0' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#101828' }}>
              {isEdit ? 'Editar contacto' : 'Invitar contacto'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#475467' }}>
              {isEdit
                ? 'Cambia el alias. El email no se puede modificar.'
                : 'Introduce el email para invitar. El alias es opcional.'}
            </p>
          </div>
          <button
            onClick={onClose} aria-label="Cerrar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#98a2b3', fontSize: '18px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <div style={{ height: '1px', backgroundColor: '#eaecf0', margin: '16px 0 0' }} />

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' }}>

            {/* Email */}
            {isEdit ? (
              /* En edición: email bloqueado, solo referencia visual */
              <Field label="Email">
                <div style={{
                  padding: '9px 13px', fontSize: '14px', color: '#667085',
                  backgroundColor: '#f9fafb', border: '1px solid #eaecf0',
                  borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '7px',
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#98a2b3" strokeWidth="2" style={{ flexShrink: 0 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {initialUser.email}
                  </span>
                </div>
              </Field>
            ) : (
              /* En creación: input editable y obligatorio */
              <Field label="Email" hint="obligatorio" error={emailError}>
                <input
                  ref={firstRef}
                  type="email"
                  placeholder="correo@empresa.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  disabled={submitting}
                  style={inputStyle(!!emailError)}
                  onFocus={(e) => { if (!emailError) Object.assign(e.target.style, FOCUS_ON); }}
                  onBlur={(e)  => Object.assign(e.target.style, emailError ? ERR_OFF : FOCUS_OFF)}
                />
              </Field>
            )}

            {/* Alias */}
            <Field label="Alias" hint="opcional">
              <input
                ref={isEdit ? firstRef : null}
                type="text"
                placeholder="Ej. María (Diseño)"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                disabled={submitting}
                maxLength={80}
                style={inputStyle(false)}
                onFocus={(e) => Object.assign(e.target.style, FOCUS_ON)}
                onBlur={(e)  => Object.assign(e.target.style, FOCUS_OFF)}
              />
            </Field>

          </div>

          {/* Error banner */}
          {submitError && (
            <div style={{
              margin: '0 24px 16px',
              padding: '10px 14px', borderRadius: '8px',
              backgroundColor: '#fff3f2', border: '1px solid #fecdca',
              fontSize: '13px', color: '#b42318', lineHeight: 1.5,
            }}>
              ⚠ {submitError}
            </div>
          )}

          {/* ── Footer ────────────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '10px',
            padding: '14px 24px', borderTop: '1px solid #eaecf0', backgroundColor: '#f9fafb',
          }}>
            <button
              type="button" onClick={onClose} disabled={submitting}
              style={{
                padding: '8px 16px', borderRadius: '8px',
                border: '1px solid #d0d5dd', backgroundColor: '#fff',
                color: '#344054', fontSize: '13px', fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={submitting}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '8px 16px', borderRadius: '8px',
                border: '1px solid #6941c6',
                backgroundColor: submitting ? '#a78bfa' : '#7f56d9',
                color: '#fff', fontSize: '13px', fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#6941c6'; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = '#7f56d9'; }}
            >
              {submitting && (
                <span style={{
                  display: 'inline-block', width: '11px', height: '11px',
                  borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff', animation: 'uf-spin 0.7s linear infinite',
                }} />
              )}
              {submitting ? 'Invitando…' : (isEdit ? 'Guardar cambios' : 'Invitar')}
            </button>
          </div>

          <style>{`@keyframes uf-spin { to { transform: rotate(360deg); } }`}</style>
        </form>
      </div>
    </div>
  );
}
