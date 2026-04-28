/**
 * ForgotPasswordPage — "Recupera tu contraseña"
 *
 * Solicita el email del usuario y llama a Supabase
 * resetPasswordForEmail(). Por seguridad, siempre muestra el mismo
 * mensaje de éxito sin revelar si el correo existe o no.
 *
 * Ruta: /forgot-password
 * Renderizado: fuera del auth gate (App.jsx), sin AuthProvider.
 */

import { useState }          from 'react';
import { supabase }          from '../lib/supabaseClient';
import { Input }             from '../components/ui/Input';
import { Button }            from '../components/ui/Button';
import { APP_NAME }          from '../config/app';

// ─── Back to login ────────────────────────────────────────────────────────────
function BackToLogin() {
  return (
    <button
      type="button"
      onClick={() => { window.location.href = '/'; }}
      style={{
        display:     'inline-flex',
        alignItems:  'center',
        gap:         '6px',
        background:  'none',
        border:      'none',
        padding:     0,
        fontSize:    '13px',
        fontWeight:  500,
        color:       '#667085',
        cursor:      'pointer',
        fontFamily:  'inherit',
        transition:  'color 0.12s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#344054'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#667085'; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Volver al inicio de sesión
    </button>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────
function SuccessState() {
  return (
    <div style={{
      padding:    '24px 32px 32px',
      display:    'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap:        '16px',
      textAlign:  'center',
    }}>
      {/* Envelope illustration */}
      <div style={{
        width:           '56px',
        height:          '56px',
        borderRadius:    '14px',
        backgroundColor: '#f9f5ff',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        fontSize:        '26px',
      }}>
        📩
      </div>

      <div>
        <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#101828' }}>
          Revisa tu correo
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: '#667085', lineHeight: '20px' }}>
          Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
        </p>
      </div>

      <p style={{ margin: 0, fontSize: '12px', color: '#98a2b3', lineHeight: '18px' }}>
        ¿No llegó? Revisa tu carpeta de spam o{' '}
        <button
          type="button"
          onClick={() => { window.location.href = '/forgot-password'; }}
          style={{
            background: 'none', border: 'none', padding: 0,
            color: '#6941c6', fontWeight: 600, fontSize: '12px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          vuelve a intentarlo
        </button>
        .
      </p>

      <div style={{ width: '100%', marginTop: '4px' }}>
        <Button
          color="secondary"
          size="md"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => { window.location.href = '/'; }}
        >
          Volver al inicio de sesión
        </Button>
      </div>
    </div>
  );
}

// ─── ForgotPasswordPage ───────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('El correo electrónico es obligatorio.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo },
    );

    setLoading(false);

    if (err) {
      // Only surface non-security errors (rate limit, network, etc.)
      // Never expose "email not found"
      if (err.status === 429) {
        setError('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
      } else if (!err.message?.toLowerCase().includes('not found')) {
        setError('Ocurrió un error. Por favor, inténtalo de nuevo.');
      } else {
        // Email not found → show success anyway (security)
        setSent(true);
      }
    } else {
      setSent(true);
    }
  }

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
          {/* Logo */}
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
            Recupera tu contraseña
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#667085', lineHeight: '20px' }}>
            Ingresa tu correo y te enviaremos un enlace para restablecerla
          </p>
        </div>

        {/* ── Content ── */}
        {sent ? (
          <SuccessState />
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="nombre@empresa.com"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              isRequired
              isInvalid={!!error}
              hint={error || undefined}
              autoFocus
            />

            <Button
              type="submit"
              color="primary"
              size="md"
              isLoading={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Enviar enlace
            </Button>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <BackToLogin />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
