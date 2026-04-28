import { useState } from 'react';
import { BRIEF_TEMPLATES } from '../../../constants/briefTemplate';

// ─── TemplateCard ─────────────────────────────────────────────────────────────
function TemplateCard({ tpl, selected, onSelect, disabled }) {
  const [hovered, setHovered] = useState(false);

  const isSelected = selected === tpl.id;
  const borderColor = isSelected
    ? 'var(--color-brand-600, #7f56d9)'
    : hovered
    ? 'var(--color-brand-300, #d6bbfb)'
    : 'var(--color-border-primary, #eaecf0)';
  const bg = isSelected
    ? 'var(--color-bg-brand-primary, #f9f5ff)'
    : hovered
    ? 'var(--color-bg-secondary, #f9fafb)'
    : 'var(--color-bg-primary, #fff)';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(tpl.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'flex-start',
        gap:             '8px',
        padding:         '16px',
        borderRadius:    'var(--radius-xl, 12px)',
        borderWidth:     '2px',
        borderStyle:     'solid',
        borderColor,
        backgroundColor: bg,
        cursor:          disabled ? 'not-allowed' : 'pointer',
        textAlign:       'left',
        fontFamily:      'inherit',
        transition:      'border-color 0.15s ease, background-color 0.15s ease',
        boxShadow:       isSelected
          ? '0 0 0 3px var(--color-brand-100, #f4ebff)'
          : hovered
          ? 'var(--shadow-xs, 0px 1px 2px rgba(0,0,0,0.05))'
          : 'none',
        opacity:         disabled ? 0.6 : 1,
        position:        'relative',
      }}
      aria-pressed={isSelected}
    >
      {/* Selection indicator */}
      {isSelected && (
        <span style={{
          position:        'absolute',
          top:             '10px',
          right:           '12px',
          width:           '18px',
          height:          '18px',
          borderRadius:    '50%',
          backgroundColor: 'var(--color-brand-600, #7f56d9)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}

      {/* Icon */}
      <span style={{ fontSize: '28px', lineHeight: 1 }} aria-hidden="true">
        {tpl.icon}
      </span>

      {/* Text */}
      <div>
        <p style={{
          margin:     0,
          fontSize:   '14px',
          fontWeight: 600,
          color:      isSelected
            ? 'var(--color-fg-brand-primary, #6941c6)'
            : 'var(--color-text-primary, #101828)',
          lineHeight: 1.4,
        }}>
          {tpl.name}
        </p>
        <p style={{
          margin:     '4px 0 0',
          fontSize:   '12px',
          color:      'var(--color-text-tertiary, #667085)',
          lineHeight: 1.5,
        }}>
          {tpl.description}
        </p>
      </div>
    </button>
  );
}

// ─── SpinnerIcon ──────────────────────────────────────────────────────────────
function SpinnerIcon() {
  return (
    <>
      <style>{`@keyframes bts-spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{
        display:        'inline-block',
        width:          '14px',
        height:         '14px',
        borderRadius:   '50%',
        borderWidth:    '2px',
        borderStyle:    'solid',
        borderColor:    'rgba(255,255,255,0.35)',
        borderTopColor: '#fff',
        animation:      'bts-spin 0.7s linear infinite',
        flexShrink:     0,
      }} />
    </>
  );
}

// ─── BriefTemplateSelector ────────────────────────────────────────────────────
/**
 * Pantalla de selección de plantilla. Se muestra cuando el brief no existe
 * y el usuario es owner.
 *
 * Props:
 *   onSelect   (template: object) => Promise<void>  — called with the chosen template object
 *   disabled   boolean (optional)                   — disables all interactions
 */
export default function BriefTemplateSelector({ onSelect, disabled = false }) {
  const [selected, setSelected]   = useState(null);
  const [creating, setCreating]   = useState(false);
  const [error,    setError]      = useState(null);

  const [btnHovered, setBtnHovered] = useState(false);

  const templates = Object.values(BRIEF_TEMPLATES);
  const canConfirm = selected !== null && !creating && !disabled;

  async function handleConfirm() {
    if (!canConfirm) return;
    const tpl = BRIEF_TEMPLATES[selected];
    if (!tpl) return;

    setCreating(true);
    setError(null);

    try {
      await onSelect(tpl.template);
    } catch (err) {
      setError(err.message ?? 'Error al crear el brief');
      setCreating(false);
    }
    // On success the parent (ProjectBrief) will receive the new brief
    // and unmount this selector, so no need to reset state.
  }

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            '32px',
      padding:        '48px 24px',
      maxWidth:       '680px',
      margin:         '0 auto',
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width:           '56px',
          height:          '56px',
          borderRadius:    'var(--radius-xl, 12px)',
          backgroundColor: 'var(--color-bg-brand-primary, #f9f5ff)',
          borderWidth:     '1px',
          borderStyle:     'solid',
          borderColor:     'var(--color-brand-200, #e9d7fe)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          margin:          '0 auto 16px',
          fontSize:        '24px',
        }}>
          📋
        </div>
        <h2 style={{
          margin:     '0 0 8px',
          fontSize:   '18px',
          fontWeight: 700,
          color:      'var(--color-text-primary, #101828)',
        }}>
          Elige una plantilla para el brief
        </h2>
        <p style={{
          margin:    0,
          fontSize:  '14px',
          color:     'var(--color-text-tertiary, #667085)',
          maxWidth:  '440px',
        }}>
          La plantilla define la estructura del formulario que completará el cliente.
          Puedes editarla después.
        </p>
      </div>

      {/* Template grid */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
        gap:                 '12px',
        width:               '100%',
      }}>
        {templates.map((tpl) => (
          <TemplateCard
            key={tpl.id}
            tpl={tpl}
            selected={selected}
            onSelect={(id) => { setSelected(id); setError(null); }}
            disabled={creating || disabled}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          width:           '100%',
          padding:         '10px 16px',
          borderRadius:    'var(--radius-lg, 8px)',
          backgroundColor: 'var(--color-bg-error-primary, #fef3f2)',
          borderWidth:     '1px',
          borderStyle:     'solid',
          borderColor:     '#fecdca',
          fontSize:        '13px',
          color:           'var(--color-text-error-primary, #b42318)',
          textAlign:       'center',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Confirm button */}
      <button
        type="button"
        disabled={!canConfirm}
        onClick={handleConfirm}
        onMouseEnter={() => setBtnHovered(true)}
        onMouseLeave={() => setBtnHovered(false)}
        style={{
          display:         'inline-flex',
          alignItems:      'center',
          gap:             '8px',
          padding:         '10px 24px',
          borderRadius:    'var(--radius-lg, 8px)',
          borderWidth:     '1px',
          borderStyle:     'solid',
          borderColor:     canConfirm && btnHovered ? '#6941c6' : '#7f56d9',
          backgroundColor: !canConfirm
            ? 'var(--color-bg-disabled, #f2f4f7)'
            : creating
            ? '#6941c6'
            : btnHovered
            ? '#6941c6'
            : '#7f56d9',
          color:           !canConfirm ? 'var(--color-text-disabled, #98a2b3)' : '#fff',
          fontSize:        '14px',
          fontWeight:      600,
          cursor:          !canConfirm ? 'not-allowed' : 'pointer',
          boxShadow:       canConfirm ? 'var(--shadow-xs, 0px 1px 2px rgba(0,0,0,0.05))' : 'none',
          fontFamily:      'inherit',
          transition:      'background-color 0.15s ease, border-color 0.15s ease',
        }}
      >
        {creating ? (
          <>
            <SpinnerIcon />
            Creando brief…
          </>
        ) : (
          'Usar esta plantilla'
        )}
      </button>
    </div>
  );
}
