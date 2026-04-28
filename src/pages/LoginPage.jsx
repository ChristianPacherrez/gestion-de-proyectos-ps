import { useState }         from 'react';
import { useAuth }           from '../context/AuthContext';
import { APP_NAME }          from '../config/app';
import { Input }             from '../components/ui/Input';
import { PasswordInput }     from '../components/ui/PasswordInput';
import { Button }            from '../components/ui/Button';

// ─── Password rules ───────────────────────────────────────────────────────────
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

function checkPassword(value) {
  return Object.fromEntries(
    PASSWORD_RULES.map((r) => [r.key, r.test(value)])
  );
}

function isPasswordValid(value) {
  return PASSWORD_RULES.every((r) => r.test(value));
}

// ─── PasswordChecklist ────────────────────────────────────────────────────────
function CheckIcon({ ok }) {
  return ok ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#17b26a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#d0d5dd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="4" fill="#d0d5dd" stroke="none" />
    </svg>
  );
}

function PasswordChecklist({ value }) {
  if (!value) return null;
  const checks = checkPassword(value);

  return (
    <div
      role="list"
      aria-label="Requisitos de contraseña"
      style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}
    >
      {PASSWORD_RULES.map((rule) => {
        const ok = checks[rule.key];
        return (
          <div
            key={rule.key}
            role="listitem"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <CheckIcon ok={ok} />
            <span style={{
              fontSize:   '13px',
              lineHeight: '18px',
              color:      ok ? '#344054' : '#98a2b3',
              transition: 'color 0.15s ease',
              fontWeight: ok ? 500 : 400,
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
    error: {
      backgroundColor: '#fff3f2',
      borderColor:     '#fecdca',
      color:           '#b42318',
    },
    success: {
      backgroundColor: '#f0fdf4',
      borderColor:     '#bbf7d0',
      color:           '#15803d',
    },
  };
  const s = styles[type] ?? styles.error;

  return (
    <div style={{
      display:         'flex',
      alignItems:      'flex-start',
      gap:             '10px',
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

// ─── LoginPage ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { signIn, signUp } = useAuth();

  const [mode,     setMode]     = useState('login');   // 'login' | 'register'
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState('');

  // Show checklist after first keystroke in register
  const [pwTouched, setPwTouched] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const next = {};

    if (!email.trim())
      next.email = 'El correo electrónico es obligatorio.';
    else if (!/\S+@\S+\.\S+/.test(email))
      next.email = 'Ingresa un correo electrónico válido.';

    if (!password)
      next.password = 'La contraseña es obligatoria.';
    else if (mode === 'register' && !isPasswordValid(password))
      next.password = 'La contraseña no cumple con los requisitos.';
    else if (mode === 'login' && password.length < 6)
      next.password = 'La contraseña debe tener al menos 6 caracteres.';

    return next;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    setSuccess('');

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setApiError(error.message);
    } else {
      const metadata = name.trim() ? { full_name: name.trim() } : {};
      const { error } = await signUp(email, password, metadata);
      if (error) {
        setApiError(error.message);
      } else {
        setSuccess('¡Cuenta creada! Revisa tu correo para confirmar el registro.');
        setName('');
        setEmail('');
        setPassword('');
        setPwTouched(false);
      }
    }
    setLoading(false);
  }

  // ── Mode switch ─────────────────────────────────────────────────────────────
  function switchMode(next) {
    setMode(next);
    setErrors({});
    setApiError('');
    setSuccess('');
    setPwTouched(false);
  }

  // ── Derived ─────────────────────────────────────────────────────────────────
  const isLogin    = mode === 'login';
  const isRegister = mode === 'register';
  const showChecklist = isRegister && pwTouched;

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
          padding:     '32px 32px 24px',
          borderBottom: '1px solid #f2f4f7',
          textAlign:   'center',
        }}>
          {/* Logo mark */}
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
            {APP_NAME}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#667085', lineHeight: '20px' }}>
            {isLogin
              ? 'Bienvenido de nuevo'
              : 'Crea tu cuenta y comienza a gestionar tus proyectos'}
          </p>
        </div>

        {/* ── Tab toggle ── */}
        <div style={{
          display:         'flex',
          gap:             '2px',
          backgroundColor: '#f2f4f7',
          margin:          '20px 32px 0',
          borderRadius:    '10px',
          padding:         '3px',
        }}>
          {[
            { id: 'login',    label: 'Iniciar sesión' },
            { id: 'register', label: 'Crear cuenta'   },
          ].map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchMode(tab.id)}
                style={{
                  flex:            1,
                  padding:         '7px 0',
                  borderRadius:    '8px',
                  border:          'none',
                  cursor:          'pointer',
                  fontSize:        '13px',
                  fontWeight:      active ? 600 : 400,
                  color:           active ? '#344054' : '#667085',
                  backgroundColor: active ? '#fff' : 'transparent',
                  boxShadow:       active ? '0px 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition:      'all 0.12s ease',
                  fontFamily:      'inherit',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >

          {/* Name (register only) */}
          {isRegister && (
            <Input
              label="Nombre completo"
              placeholder="Tu nombre"
              value={name}
              onChange={setName}
              autoComplete="name"
              hint="Opcional — aparecerá en tu perfil"
            />
          )}

          {/* Email */}
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="nombre@empresa.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            isRequired
            isInvalid={!!errors.email}
            hint={errors.email}
            autoFocus
          />

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <PasswordInput
              label="Contraseña"
              placeholder={isRegister ? 'Mínimo 8 caracteres' : '••••••••'}
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (isRegister && !pwTouched && v.length > 0) setPwTouched(true);
              }}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              isRequired
              isInvalid={!!errors.password}
              hint={errors.password}
            />

            {/* Password checklist (register only) */}
            {showChecklist && (
              <PasswordChecklist value={password} />
            )}
          </div>

          {/* Forgot password (login only) */}
          {isLogin && (
            <div style={{ marginTop: '-4px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => { window.location.href = '/forgot-password'; }}
                style={{
                  background:    'none',
                  border:        'none',
                  padding:       0,
                  fontSize:      '13px',
                  fontWeight:    500,
                  color:         '#6941c6',
                  cursor:        'pointer',
                  fontFamily:    'inherit',
                  transition:    'color 0.12s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#53389e'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#6941c6'; }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* API error */}
          {apiError && (
            <AlertBanner type="error">{apiError}</AlertBanner>
          )}

          {/* Success */}
          {success && (
            <AlertBanner type="success">{success}</AlertBanner>
          )}

          {/* Submit */}
          <Button
            type="submit"
            color="primary"
            size="md"
            isLoading={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
          >
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>

          {/* Footer copy */}
          <p style={{
            margin:     0,
            fontSize:   '13px',
            color:      '#667085',
            textAlign:  'center',
            lineHeight: '20px',
          }}>
            {isLogin ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  style={{
                    background:  'none',
                    border:      'none',
                    padding:     0,
                    color:       '#6941c6',
                    fontWeight:  600,
                    fontSize:    '13px',
                    cursor:      'pointer',
                    fontFamily:  'inherit',
                  }}
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{
                    background:  'none',
                    border:      'none',
                    padding:     0,
                    color:       '#6941c6',
                    fontWeight:  600,
                    fontSize:    '13px',
                    cursor:      'pointer',
                    fontFamily:  'inherit',
                  }}
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
