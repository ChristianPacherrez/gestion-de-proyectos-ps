/**
 * ResetPasswordPage — "Crea una nueva contraseña"
 *
 * Se abre desde el link de recuperación que Supabase envía por correo.
 * El SDK procesa automáticamente el hash en la URL (access_token + type=recovery)
 * y establece una sesión temporal. Llamamos a supabase.auth.updateUser()
 * para persistir la nueva contraseña.
 *
 * Ruta:   /reset-password
 * Render: fuera del auth gate (App.jsx), sin AuthProvider.
 *
 * Flujo:
 *   1. Usuario llega con el link → SDK establece sesión de recovery
 *   2. Ingresa + confirma la nueva contraseña
 *   3. supabase.auth.updateUser({ password })
 *   4. Éxito → sign out → "Ir al inicio de sesión"
 */

import { useState, useEffect }  from 'react';
import { supabase }              from '../lib/supabaseClient';
import { PasswordInput }         from '../components/ui/PasswordInput';
import { Button }                from '../components/ui/Button';
import { APP_NAME }              from '../config/app';

// ─── Password rules (same as LoginPage / Register) ────────────────────────────
const PASSWORD_RULES = [
  {
    key:   'length',
    label: '8 a 16 caracteres',
    test:  (v) => v.length >= 8 && v.length <= 16,
  },
  {
    key:   'letter',
    label: 'Al menos una letra',
    test:  (v) => /[A-Za-z]/.test(v),
  },
  {
    key:   'number',
    label: 'Al menos un número',
    test:  (v) => /[0-9]/.test(v),
  },
  {
    key:   'special',
    label: 'Al menos un carácter especial: !"@*?¿#/()',
    test:  (v) => /[!"@*?¿#\\/()]/.test(v),
  },
];

function isPasswordValid(value) {
  return PASSWORD_RULES.every((r) => r.test(value));
}

// ─── CheckIcon ────────────────────────────────────────────────────────────────
function CheckIcon({ ok }) {
  return ok ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#17b26a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="4" fill="#d0d5dd" />
    </svg>
  );
}

// ─── PasswordChecklist ────────────────────────────────────────────────────────
function PasswordChecklist({ value }) {
  if (!value) return null;
  return (
    <div role="list" aria-label="Requisitos de contraseña"
      style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <div key={rule.key} role="listitem"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckIcon ok={ok} />
            <span style={{
              fontSize:   '13px',
              lineHeight: '18px',
              color:      ok ? '#344054' : '#98a2b3',
              fontWeight: ok ? 500 : 400,
              transition: 'color 0.15s ease',
            }}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── AlertBanner ──────────────────────────────────────────────────────────────
function AlertBanner({ type, children }) {
  const styles = {
    error: { backgroundColor: '#fff3f2', borderColor: '#fecdca', color: '#b42318' },
    success: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' },
  };
  const s = styles[type] ?? styles.error;
  return (
    <div style={{
      padding:         '10px 14px',
      borderRadius:    '8px',
      backgroundColor: s.backgroundColor,
      borderWidth:     '1px',
      borderStyle:     'solid',
      borderColor:     s.borderColor,
      fontSize:        '13px',
      lineHeight:      '20px',
      color:           s.color,
      fontWeight:      500,
    }}>
      {children}
    </div>
  );
}

// ─── InvalidTokenState ────────────────────────────────────────────────────────
function InvalidTokenState() {
  return (
    <div style={{
      padding:       '24px 32px 32px',
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      gap:           '16px',
      textAlign:     'center',
    }}>
      <div style={{
        width:  '56px', height: '56px', borderRadius: '14px',
        backgroundColor: '#fff3f2',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '26px',
      }}>
        ⚠️
      </div>

      <div>
        <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#101828' }}>
          Enlace inválido o expirado
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: '#667085', lineHeight: '20px' }}>
          Este enlace de recuperación ya no es válido. Puede haber expirado o ya haber sido utilizado.
        </p>
      </div>

      <Button
        color="primary"
        size="md"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => { window.location.href = '/forgot-password'; }}
      >
        Solicitar nuevo enlace
      </Button>

      <button
        type="button"
        onClick={() => { window.location.href = '/'; }}
        style={{
          background: 'none', border: 'none', padding: 0,
          fontSize: '13px', fontWeight: 500, color: '#667085',
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'color 0.12s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#344054'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#667085'; }}
      >
        Volver al inicio de sesión
      </button>
    </div>
  );
}

// ─── SuccessState ─────────────────────────────────────────────────────────────
function SuccessState() {
  return (
    <div style={{
      padding:       '24px 32px 32px',
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      gap:           '16px',
      textAlign:     'center',
    }}>
      <div style={{
        width:  '56px', height: '56px', borderRadius: '14px',
        backgroundColor: '#ecfdf3',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '26px',
      }}>
        🎉
      </div>

      <div>
        <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#101828' }}>
          Contraseña actualizada
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: '#667085', lineHeight: '20px' }}>
          Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
      </div>

      <Button
        color="primary"
        size="md"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => { window.location.href = '/'; }}
      >
        Ir al inicio de sesión
      </Button>
    </div>
  );
}

// ─── ResetPasswordPage ────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});
  const [apiError,    setApiError]    = useState('');

  // 'checking' | 'ready' | 'invalid' | 'success'
  const [stage, setStage] = useState('checking');

  // Show checklist after first keystroke
  const [pwTouched, setPwTouched] = useState(false);

  // ── Verify recovery session on mount ────────────────────────────────────────
  // Supabase processes the URL hash automatically; we wait for onAuthStateChange
  // to confirm we have a PASSWORD_RECOVERY session.
  useEffect(() => {
    // Listen for the recovery event from the URL hash token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStage('ready');
      } else if (event === 'SIGNED_IN' && stage === 'checking') {
        // Also accept SIGNED_IN if recovery flow completed
        setStage('ready');
      }
    });

    // Fallback: check for an existing session (hash already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && stage === 'checking') {
        setStage('ready');
      } else if (!session) {
        // No session and no recovery event → invalid/expired token
        // Give onAuthStateChange 2s to fire before marking invalid
        const timer = setTimeout(() => {
          setStage((current) => current === 'checking' ? 'invalid' : current);
        }, 2000);
        return () => clearTimeout(timer);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const next = {};
    if (!password) {
      next.password = 'La contraseña es obligatoria.';
    } else if (!isPasswordValid(password)) {
      next.password = 'La contraseña no cumple con los requisitos.';
    }
    if (!confirm) {
      next.confirm = 'Debes confirmar tu contraseña.';
    } else if (password && confirm !== password) {
      next.confirm = 'Las contraseñas no coinciden.';
    }
    return next;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setApiError('No se pudo actualizar la contraseña. Intenta nuevamente.');
      setLoading(false);
      return;
    }

    // Sign out to clear the recovery session — user will log in fresh
    await supabase.auth.signOut();
    setStage('success');
    setLoading(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:       '100vh',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      backgroundColor: '#f9fafb',
      padding:         '24px',
    }}>
      <div style={{
        width:           '100%',
        maxWidth:        '400px',
        backgroundColor: '#fff',
        borderRadius:    '20px',
        borderWidth:     '1px',
        borderStyle:     'solid',
        borderColor:     '#eaecf0',
        boxShadow:       '0px 8px 24px -4px rgba(16,24,40,0.08), 0px 2px 6px -2px rgba(16,24,40,0.04)',
        overflow:        'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding:      '32px 32px 24px',
          borderBottom: '1px solid #f2f4f7',
          textAlign:    'center',
        }}>
          <div style={{
            width:           '48px',
            height:          '48px',
            borderRadius:    '12px',
            background:      'linear-gradient(135deg, #7f56d9 0%, #9e77ed 100%)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            margin:          '0 auto 16px',
            fontSize:        '22px',
            boxShadow:       '0 4px 12px rgba(127,86,217,0.28)',
          }}>
            ◫
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#101828' }}>
            {stage === 'success'  ? 'Contraseña actualizada'  :
             stage === 'invalid'  ? 'Enlace inválido'         :
                                    'Crea una nueva contraseña'}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#667085', lineHeight: '20px' }}>
            {stage === 'success'  ? 'Ya puedes iniciar sesión con tu nueva contraseña' :
             stage === 'invalid'  ? 'Este enlace ya no es válido'                       :
             stage === 'checking' ? 'Verificando tu enlace de recuperación…'            :
                                    'Elige una contraseña segura para tu cuenta'}
          </p>
        </div>

        {/* ── Content (based on stage) ── */}
        {stage === 'checking' && (
          <div style={{
            padding: '40px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '50%',
              border: '3px solid #ede9fe',
              borderTopColor: '#7f56d9',
              animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {stage === 'invalid'  && <InvalidTokenState />}
        {stage === 'success'  && <SuccessState />}

        {stage === 'ready' && (
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* New password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <PasswordInput
                label="Nueva contraseña"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(v) => {
                  setPassword(v);
                  if (!pwTouched && v.length > 0) setPwTouched(true);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                autoComplete="new-password"
                isRequired
                isInvalid={!!errors.password}
                hint={errors.password}
                autoFocus
              />
              {pwTouched && <PasswordChecklist value={password} />}
            </div>

            {/* Confirm password */}
            <PasswordInput
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }));
              }}
              autoComplete="new-password"
              isRequired
              isInvalid={!!errors.confirm}
              hint={errors.confirm}
            />

            {/* Match indicator (inline, no error state) */}
            {confirm.length > 0 && !errors.confirm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '-6px' }}>
                {confirm === password ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="#17b26a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span style={{ fontSize: '12px', color: '#17b26a', fontWeight: 500 }}>
                      Las contraseñas coinciden
                    </span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="#f79009" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span style={{ fontSize: '12px', color: '#b54708', fontWeight: 500 }}>
                      Las contraseñas no coinciden
                    </span>
                  </>
                )}
              </div>
            )}

            {/* API error */}
            {apiError && <AlertBanner type="error">{apiError}</AlertBanner>}

            {/* Submit */}
            <Button
              type="submit"
              color="primary"
              size="md"
              isLoading={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
            >
              Guardar contraseña
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
