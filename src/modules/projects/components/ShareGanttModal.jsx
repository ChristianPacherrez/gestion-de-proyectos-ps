import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import {
  fetchGanttShareState,
  enableGanttShare,
  disableGanttShare,
  regenerateGanttToken,
} from '../../../lib/supabase/ganttShareSupabase';

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 14 }) {
  return (
    <span style={{
      display:        'inline-block',
      width:          `${size}px`,
      height:         `${size}px`,
      borderRadius:   '50%',
      border:         '2px solid #e9d7fe',
      borderTopColor: '#7f56d9',
      animation:      'sgm-spin 0.7s linear infinite',
      flexShrink:     0,
    }} />
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position:        'relative',
        display:         'inline-flex',
        alignItems:      'center',
        width:           '44px',
        height:          '24px',
        borderRadius:    '9999px',
        backgroundColor: checked ? '#7f56d9' : '#d0d5dd',
        border:          'none',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        transition:      'background-color 0.2s ease',
        flexShrink:      0,
        opacity:         disabled ? 0.6 : 1,
        padding:         0,
      }}
    >
      <span style={{
        position:        'absolute',
        left:            checked ? '22px' : '2px',
        width:           '20px',
        height:          '20px',
        borderRadius:    '50%',
        backgroundColor: '#fff',
        boxShadow:       '0 1px 3px rgba(0,0,0,0.2)',
        transition:      'left 0.2s ease',
      }} />
    </button>
  );
}

// ─── CopyButton ───────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copiar enlace"
      style={{
        display:         'inline-flex',
        alignItems:      'center',
        gap:             '5px',
        padding:         '7px 14px',
        borderRadius:    '8px',
        border:          `1px solid ${copied ? '#abefc6' : '#d0d5dd'}`,
        backgroundColor: copied ? '#ecfdf3' : '#fff',
        color:           copied ? '#027a48' : '#344054',
        fontSize:        '13px',
        fontWeight:      500,
        cursor:          'pointer',
        flexShrink:      0,
        transition:      'all 0.15s ease',
        fontFamily:      'inherit',
      }}
    >
      {copied ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copiado
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copiar
        </>
      )}
    </button>
  );
}

// ─── ShareGanttModal ──────────────────────────────────────────────────────────
/**
 * Props:
 *   projectId  string   — used to fetch/update share state
 *   isOpen     boolean
 *   onClose    () => void
 */
export default function ShareGanttModal({ projectId, isOpen, onClose }) {
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [token,        setToken]        = useState(null);
  const [enabled,      setEnabled]      = useState(false);
  const [error,        setError]        = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  // Build public URL from current token
  const publicUrl = token
    ? `${window.location.origin}/share/gantt/${token}`
    : null;

  // Load state when modal opens
  useEffect(() => {
    if (!isOpen || !projectId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const state = await fetchGanttShareState(projectId);
        if (!cancelled) {
          setToken(state.token);
          setEnabled(state.enabled);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isOpen, projectId]);

  async function handleToggle(newEnabled) {
    setSaving(true);
    setError(null);
    try {
      if (newEnabled) {
        const result = await enableGanttShare(projectId);
        setToken(result.token);
        setEnabled(true);
      } else {
        await disableGanttShare(projectId);
        setEnabled(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    if (!window.confirm('¿Regenerar el enlace? El enlace anterior dejará de funcionar.')) return;
    setRegenerating(true);
    setError(null);
    try {
      const newToken = await regenerateGanttToken(projectId);
      setToken(newToken);
      setEnabled(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compartir Gantt"
      description="Genera un enlace público de solo lectura para el cronograma."
      maxWidth="480px"
    >
      <style>{`@keyframes sgm-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Loading state */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <Spinner size={20} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding:         '10px 14px',
            borderRadius:    '8px',
            backgroundColor: '#fef3f2',
            border:          '1px solid #fecdca',
            fontSize:        '13px',
            color:           '#b42318',
          }}>
            {error}
          </div>
        )}

        {/* Toggle row */}
        {!loading && (
          <div style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'space-between',
            padding:         '14px 16px',
            borderRadius:    '10px',
            border:          '1px solid #eaecf0',
            backgroundColor: enabled ? '#fafaf8' : '#f9fafb',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#101828' }}>
                {enabled ? 'Enlace público activo' : 'Enlace público desactivado'}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#667085' }}>
                {enabled
                  ? 'Cualquiera con el enlace puede ver el cronograma.'
                  : 'Activa el enlace para compartir el cronograma.'}
              </p>
            </div>
            {saving ? <Spinner size={18} /> : (
              <Toggle checked={enabled} onChange={handleToggle} disabled={saving} />
            )}
          </div>
        )}

        {/* URL section — only when enabled */}
        {!loading && enabled && publicUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* URL display + actions */}
            <div style={{
              display:         'flex',
              alignItems:      'center',
              gap:             '8px',
              padding:         '10px 12px',
              borderRadius:    '8px',
              border:          '1px solid #d0d5dd',
              backgroundColor: '#f9fafb',
            }}>
              <span style={{
                flex:          1,
                fontSize:      '12px',
                color:         '#344054',
                fontFamily:    'monospace',
                overflow:      'hidden',
                textOverflow:  'ellipsis',
                whiteSpace:    'nowrap',
              }}>
                {publicUrl}
              </span>
            </div>

            {/* Action buttons row */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <CopyButton text={publicUrl} />

              {/* Open in new tab */}
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:         'inline-flex',
                  alignItems:      'center',
                  gap:             '5px',
                  padding:         '7px 14px',
                  borderRadius:    '8px',
                  border:          '1px solid #d0d5dd',
                  backgroundColor: '#fff',
                  color:           '#344054',
                  fontSize:        '13px',
                  fontWeight:      500,
                  cursor:          'pointer',
                  textDecoration:  'none',
                  flexShrink:      0,
                  fontFamily:      'inherit',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Abrir
              </a>

              {/* Regenerate */}
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                style={{
                  display:         'inline-flex',
                  alignItems:      'center',
                  gap:             '5px',
                  padding:         '7px 14px',
                  borderRadius:    '8px',
                  border:          '1px solid #eaecf0',
                  backgroundColor: '#fff',
                  color:           '#667085',
                  fontSize:        '13px',
                  fontWeight:      500,
                  cursor:          regenerating ? 'not-allowed' : 'pointer',
                  flexShrink:      0,
                  fontFamily:      'inherit',
                  transition:      'all 0.15s ease',
                }}
              >
                {regenerating ? <Spinner size={12} /> : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                )}
                {regenerating ? 'Regenerando…' : 'Regenerar enlace'}
              </button>
            </div>
          </div>
        )}

        {/* Info notice */}
        <div style={{
          display:         'flex',
          gap:             '10px',
          padding:         '12px 14px',
          borderRadius:    '8px',
          backgroundColor: '#f4f3ff',
          border:          '1px solid #d9d6fe',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5925dc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8"  x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ margin: 0, fontSize: '12px', color: '#5925dc', lineHeight: 1.55 }}>
            Cualquier persona con este enlace podrá visualizar el cronograma del proyecto, pero no podrá realizar modificaciones.
          </p>
        </div>

      </div>

      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding:         '8px 16px',
            borderRadius:    '8px',
            border:          '1px solid #d0d5dd',
            backgroundColor: '#fff',
            color:           '#344054',
            fontSize:        '14px',
            fontWeight:      500,
            cursor:          'pointer',
            fontFamily:      'inherit',
          }}
        >
          Cerrar
        </button>
      </Modal.Footer>
    </Modal>
  );
}
