import { useState, useEffect, useRef } from 'react';
import { useBrief }              from '../hooks/useBrief';
import { Badge }                 from '../../../components/ui/Badge';
import { Input }                 from '../../../components/ui/Input';
import { TextArea }              from '../../../components/ui/TextArea';
import { Modal }                 from '../../../components/ui/Modal';
import BriefTemplateSelector     from './BriefTemplateSelector';
import BriefTemplateEditor       from './BriefTemplateEditor';
import RichTextEditor            from './RichTextEditor';
import BriefReadView             from './BriefReadView';

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_CFG = {
  draft:       { color: 'gray',    label: 'Borrador'    },
  in_progress: { color: 'blue',    label: 'En progreso' },
  completed:   { color: 'success', label: 'Completado'  },
  closed:      { color: 'gray',    label: 'Cerrado'     },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function SpinnerIcon({ size = 12, borderColor = 'var(--color-brand-200, #e9d7fe)', topColor = 'var(--color-bg-brand-solid, #7f56d9)' }) {
  return (
    <span style={{
      display:        'inline-block',
      width:          `${size}px`,
      height:         `${size}px`,
      borderRadius:   '50%',
      borderWidth:    '2px',
      borderStyle:    'solid',
      borderColor,
      borderTopColor: topColor,
      animation:      'pb-spin 0.7s linear infinite',
      flexShrink:     0,
    }} />
  );
}

function CheckBigIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function CheckSmallIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── FieldRenderer — maps field.type → bridge component ──────────────────────
function FieldRenderer({ field, value, onChange, onBlur, isDisabled }) {
  const commonProps = {
    label:      field.label,
    value:      value ?? '',
    onChange,
    onBlur,
    isDisabled,
    isRequired: field.required ?? false,
    size:       'sm',
  };

  // ── richtext: WYSIWYG editor (Quill 2, React-19-safe) ──────────────────────
  if (field.type === 'richtext') {
    return (
      <RichTextEditor
        label={field.label}
        value={value ?? ''}
        onChange={onChange}
        onBlur={onBlur}
        isDisabled={isDisabled}
        isRequired={field.required ?? false}
        placeholder={field.placeholder || 'Escribe aquí…'}
        minHeight={140}
      />
    );
  }

  // ── textarea ────────────────────────────────────────────────────────────────
  if (field.type === 'textarea') {
    return (
      <TextArea
        {...commonProps}
        rows={3}
        placeholder={field.placeholder || 'Escribe aquí…'}
      />
    );
  }

  // ── radio: vertical group of native radio inputs ────────────────────────────
  if (field.type === 'radio') {
    const options = field.options ?? [];
    const fieldLabelStyle = {
      display:    'block',
      fontSize:   '14px',
      fontWeight: 500,
      color:      'var(--color-text-secondary, #475467)',
      marginBottom: '8px',
    };

    return (
      <div>
        <label style={fieldLabelStyle}>
          {field.label}
          {field.required && (
            <span style={{ color: 'var(--color-fg-error-primary, #f04438)', marginLeft: '3px' }}>*</span>
          )}
        </label>

        {options.length === 0 ? (
          <p style={{
            margin:    0,
            fontSize:  '13px',
            color:     'var(--color-text-quaternary, #98a2b3)',
            fontStyle: 'italic',
          }}>
            Sin opciones definidas
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {options.map((opt) => (
              <label
                key={opt.id ?? opt.value}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        '8px',
                  cursor:     isDisabled ? 'not-allowed' : 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={(value ?? '') === opt.value}
                  onChange={() => { if (!isDisabled) { onChange(opt.value); onBlur(); } }}
                  disabled={isDisabled}
                  style={{
                    width:       '16px',
                    height:      '16px',
                    accentColor: 'var(--color-brand-600, #7f56d9)',
                    cursor:      isDisabled ? 'not-allowed' : 'pointer',
                    flexShrink:  0,
                  }}
                />
                <span style={{
                  fontSize: '14px',
                  color:    isDisabled
                    ? 'var(--color-text-tertiary, #667085)'
                    : 'var(--color-text-primary, #101828)',
                }}>
                  {opt.label || opt.value}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── default: text / email / date via Input bridge ───────────────────────────
  return (
    <Input
      {...commonProps}
      type={field.type ?? 'text'}
      placeholder={field.type === 'date' ? undefined : (field.placeholder || 'Escribe aquí…')}
    />
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
function SectionCard({ section, values, onFieldChange, onFieldBlur, isDisabled }) {
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-primary, #fff)',
      borderWidth:     '1px',
      borderStyle:     'solid',
      borderColor:     'var(--color-border-primary, #eaecf0)',
      borderRadius:    'var(--radius-xl, 12px)',
      overflow:        'hidden',
      boxShadow:       'var(--shadow-xs, 0px 1px 2px rgba(0,0,0,0.05))',
    }}>
      <div style={{
        padding:           '14px 20px',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'var(--color-border-tertiary, #f2f4f7)',
        backgroundColor:   'var(--color-bg-secondary, #f9fafb)',
      }}>
        <h3 style={{
          margin:        0,
          fontSize:      '13px',
          fontWeight:    600,
          color:         'var(--color-text-secondary, #475467)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {section.title}
        </h3>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {(section.fields ?? []).map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={values[field.id]}
            onChange={(v) => onFieldChange(field.id, v)}
            onBlur={() => onFieldBlur(field.id)}
            isDisabled={isDisabled}
          />
        ))}
      </div>
    </div>
  );
}

// ─── LoadingState ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '12px' }}>
      <SpinnerIcon size={20} />
      <span style={{ fontSize: '14px', color: 'var(--color-text-tertiary, #667085)' }}>
        Cargando brief…
      </span>
    </div>
  );
}

// ─── NonOwnerEmptyState — no brief exists yet ─────────────────────────────────
function NonOwnerEmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '12px', textAlign: 'center' }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: 'var(--radius-xl, 12px)',
        backgroundColor: 'var(--color-bg-secondary, #f9fafb)',
        borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border-primary, #eaecf0)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
      }}>
        ⏳
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary, #101828)' }}>
          El propietario aún no ha configurado el brief
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-tertiary, #667085)', maxWidth: '320px' }}>
          Cuando el propietario del proyecto elija una plantilla, podrás ver y completar el formulario aquí.
        </p>
      </div>
    </div>
  );
}

// ─── DraftPendingNotice — brief exists but owner hasn't confirmed yet ─────────
function DraftPendingNotice() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '12px', textAlign: 'center' }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: 'var(--radius-xl, 12px)',
        backgroundColor: '#fffaeb',
        borderWidth: '1px', borderStyle: 'solid', borderColor: '#fec84b',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
      }}>
        🔧
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary, #101828)' }}>
          El propietario está construyendo el brief
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-tertiary, #667085)', maxWidth: '340px' }}>
          Podrás completar el formulario cuando el propietario confirme la plantilla.
        </p>
      </div>
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      padding: '12px 16px', borderRadius: 'var(--radius-lg, 8px)',
      backgroundColor: 'var(--color-bg-error-primary, #fef3f2)',
      borderWidth: '1px', borderStyle: 'solid', borderColor: '#fecdca',
      fontSize: '13px', color: 'var(--color-text-error-primary, #b42318)',
    }}>
      <span>⚠ {message}</span>
      {onRetry && (
        <button onClick={onRetry} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '12px', fontWeight: 600, textDecoration: 'underline', padding: 0 }}>
          Reintentar
        </button>
      )}
    </div>
  );
}

// ─── getProgress ─────────────────────────────────────────────────────────────
/**
 * Calcula el progreso del brief contando solo campos required.
 *
 * @param {object} templateJson  — { sections: [{ fields: [] }] }
 * @param {object} responses     — { [fieldId]: value }  (puede ser localValues)
 * @returns {{ total: number, completed: number, pct: number }}
 *
 * Reglas:
 *   - Solo se cuentan fields con required: true.
 *   - Un campo se considera completo si su valor NO es null/undefined/"".
 *   - Si no hay campos required (total === 0) → pct = 100 (sin nada obligatorio
 *     el brief puede marcarse completo en cualquier momento).
 */
function getProgress(templateJson, responses) {
  const required = (templateJson?.sections ?? [])
    .flatMap((s) => s.fields ?? [])
    .filter((f) => f.required);

  const total = required.length;

  // Edge case: no hay campos obligatorios → 100 % (nada bloquea el avance)
  if (total === 0) return { total: 0, completed: 0, pct: 100 };

  const completed = required.filter((f) => {
    const v = responses?.[f.id];
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length;

  return {
    total,
    completed,
    pct: Math.round((completed / total) * 100),
  };
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
/**
 * Props:
 *   completed  number — campos requeridos respondidos
 *   total      number — total de campos requeridos
 *   pct        number — 0-100, calculado por getProgress()
 */
function ProgressBar({ completed, total, pct }) {
  const isDone = pct === 100;

  const bg       = isDone ? '#ecfdf3'                              : 'var(--color-bg-secondary, #f9fafb)';
  const border   = isDone ? '#abefc6'                              : 'var(--color-border-primary, #eaecf0)';
  const fill     = isDone ? '#17b26a'                              : 'var(--color-bg-brand-solid, #7f56d9)';
  const track    = isDone ? '#abefc6'                              : 'var(--color-bg-quaternary, #eaecf0)';
  const txtMain  = isDone ? '#027a48'                              : 'var(--color-text-secondary, #475467)';
  const txtCount = isDone ? '#027a48'                              : 'var(--color-text-tertiary, #667085)';

  return (
    <div style={{
      padding:         '14px 16px',
      borderRadius:    'var(--radius-xl, 12px)',
      backgroundColor: bg,
      borderWidth:     '1px',
      borderStyle:     'solid',
      borderColor:     border,
      display:         'flex',
      flexDirection:   'column',
      gap:             '8px',
    }}>

      {/* ── Top row: label + count ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>

        {/* Main label */}
        <span style={{ fontSize: '13px', fontWeight: 600, color: txtMain }}>
          {isDone
            ? '✓ Brief completado'
            : `Progreso del brief: ${pct}% completo`}
        </span>

        {/* "X / Y campos" — omitido cuando no hay campos requeridos */}
        {total > 0 && (
          <span style={{
            fontSize:   '12px',
            color:      txtCount,
            flexShrink: 0,
          }}>
            {completed} / {total} {total === 1 ? 'campo requerido' : 'campos requeridos'}
          </span>
        )}
      </div>

      {/* ── Barra de progreso ──────────────────────────────────────────────── */}
      <div style={{
        height:          '6px',
        borderRadius:    '9999px',
        backgroundColor: track,
        overflow:        'hidden',
      }}>
        <div style={{
          height:          '100%',
          width:           `${pct}%`,
          borderRadius:    '9999px',
          backgroundColor: fill,
          transition:      'width 0.35s ease',
        }} />
      </div>
    </div>
  );
}

// ─── DraftOwnerHeader — "Confirmar plantilla" CTA shown above the editor ──────
function DraftOwnerHeader({ onConfirm, onChangeTemplate, disabled, error }) {
  const [hovered,        setHovered]        = useState(false);
  const [changeHovered,  setChangeHovered]  = useState(false);
  const [busy,           setBusy]           = useState(false);

  async function handle() {
    if (busy || disabled) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      flexWrap:        'wrap',
      gap:             '12px',
      padding:         '16px 20px',
      borderRadius:    'var(--radius-xl, 12px)',
      backgroundColor: '#f9f5ff',
      borderWidth:     '1px',
      borderStyle:     'solid',
      borderColor:     'var(--color-brand-200, #e9d7fe)',
    }}>
      <div>
        <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 600, color: 'var(--color-fg-brand-primary, #6941c6)' }}>
          Paso 1 — Construye la plantilla
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-tertiary, #667085)' }}>
          Revisa las preguntas y cuando estés listo, confirma para activar el formulario.
        </p>
        {error && (
          <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--color-text-error-primary, #b42318)' }}>
            ⚠ {error}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Cambiar plantilla — ghost secondary */}
        <button
          type="button"
          onClick={onChangeTemplate}
          disabled={disabled}
          onMouseEnter={() => setChangeHovered(true)}
          onMouseLeave={() => setChangeHovered(false)}
          style={{
            display:         'inline-flex',
            alignItems:      'center',
            gap:             '6px',
            padding:         '8px 14px',
            borderRadius:    'var(--radius-lg, 8px)',
            borderWidth:     '1px',
            borderStyle:     'solid',
            borderColor:     changeHovered && !disabled ? '#d6bbfb' : 'var(--color-border-primary, #eaecf0)',
            backgroundColor: changeHovered && !disabled ? '#f9f5ff' : 'transparent',
            color:           changeHovered && !disabled ? 'var(--color-fg-brand-primary, #6941c6)' : 'var(--color-text-tertiary, #667085)',
            fontSize:        '13px',
            fontWeight:      500,
            fontFamily:      'inherit',
            cursor:          disabled ? 'not-allowed' : 'pointer',
            opacity:         disabled ? 0.6 : 1,
            transition:      'all 0.15s ease',
            whiteSpace:      'nowrap',
            flexShrink:      0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
          </svg>
          Cambiar plantilla
        </button>

        {/* Confirmar plantilla — primary */}
        <button
          type="button"
          onClick={handle}
          disabled={busy || disabled}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display:         'inline-flex',
            alignItems:      'center',
            gap:             '7px',
            padding:         '9px 18px',
            borderRadius:    'var(--radius-lg, 8px)',
            borderWidth:     '1px',
            borderStyle:     'solid',
            borderColor:     (busy || disabled) ? '#7f56d9' : hovered ? '#6941c6' : '#7f56d9',
            backgroundColor: (busy || disabled) ? '#6941c6' : hovered ? '#6941c6' : '#7f56d9',
            color:           '#fff',
            fontSize:        '14px',
            fontWeight:      600,
            fontFamily:      'inherit',
            cursor:          (busy || disabled) ? 'not-allowed' : 'pointer',
            boxShadow:       'var(--shadow-sm, 0px 1px 3px rgba(0,0,0,0.1))',
            transition:      'background-color 0.15s ease',
            whiteSpace:      'nowrap',
            flexShrink:      0,
          }}
        >
          {busy ? (
            <>
              <SpinnerIcon size={13} borderColor="rgba(255,255,255,0.35)" topColor="#fff" />
              Confirmando…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Confirmar plantilla
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── ConfirmBriefButton ───────────────────────────────────────────────────────
/**
 * Props:
 *   onClick   — handler (siempre llamado; la validación de pct vive en el padre)
 *   disabled  — true mientras statusBusy o saving (spinner en vuelo)
 *   isReady   — true si pct === 100 (todos los campos requeridos completados)
 *
 * Apariencia:
 *   isReady=true  → verde sólido (listo para confirmar)
 *   isReady=false → outline gris neutro (falta completar campos)
 */
function ConfirmBriefButton({ onClick, disabled, isReady }) {
  const [hovered, setHovered] = useState(false);

  // ── Estilos según estado ─────────────────────────────────────────────────
  const borderColor = disabled
    ? (isReady ? '#15a35e' : 'var(--color-border-primary, #eaecf0)')
    : isReady
      ? (hovered ? '#0e9252' : '#15a35e')
      : (hovered ? '#d0d5dd' : 'var(--color-border-primary, #eaecf0)');

  const bgColor = disabled
    ? (isReady ? '#15a35e' : 'var(--color-bg-secondary, #f9fafb)')
    : isReady
      ? (hovered ? '#0e9252' : '#17b26a')
      : (hovered ? 'var(--color-bg-secondary, #f9fafb)' : 'var(--color-bg-primary, #fff)');

  const textColor = isReady ? '#fff' : 'var(--color-text-secondary, #475467)';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:         'inline-flex',
        alignItems:      'center',
        gap:             '6px',
        padding:         '7px 14px',
        borderRadius:    'var(--radius-lg, 8px)',
        borderWidth:     '1px',
        borderStyle:     'solid',
        borderColor,
        backgroundColor: bgColor,
        color:           textColor,
        fontSize:        '13px',
        fontWeight:      600,
        fontFamily:      'inherit',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        opacity:         disabled ? 0.65 : 1,
        boxShadow:       isReady ? 'var(--shadow-xs, 0px 1px 2px rgba(0,0,0,0.05))' : 'none',
        transition:      'all 0.15s ease',
        whiteSpace:      'nowrap',
        flexShrink:      0,
      }}
    >
      <CheckSmallIcon />
      Confirmar brief
    </button>
  );
}

// ─── CompletedView ────────────────────────────────────────────────────────────
/**
 * Pantalla de éxito para el estado 'completed' del brief.
 * Props:
 *   onBack        — volver al proyecto (tab anterior)
 *   onViewSummary — cambiar a la vista read-only del resumen
 */
function CompletedView({ onBack, onViewSummary, onReopen }) {
  const [backHov,    setBackHov]    = useState(false);
  const [summaryHov, setSummaryHov] = useState(false);
  const [reopenHov,  setReopenHov]  = useState(false);

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '72px 24px',
      gap:            '20px',
      textAlign:      'center',
    }}>
      {/* Icon */}
      <div style={{
        width:           '80px',
        height:          '80px',
        borderRadius:    '50%',
        backgroundColor: '#ecfdf3',
        borderWidth:     '2px',
        borderStyle:     'solid',
        borderColor:     '#abefc6',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        color:           '#17b26a',
      }}>
        <CheckBigIcon />
      </div>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary, #101828)', lineHeight: 1.3 }}>
          ¡Brief completado!
        </h2>
        <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-text-secondary, #475467)', lineHeight: 1.6 }}>
          Con esta información podemos iniciar el proyecto con claridad.
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '8px' }}>
        {/* Primary: ver resumen */}
        <button
          type="button"
          onClick={onViewSummary}
          onMouseEnter={() => setSummaryHov(true)}
          onMouseLeave={() => setSummaryHov(false)}
          style={{
            display:         'inline-flex',
            alignItems:      'center',
            gap:             '7px',
            padding:         '10px 20px',
            borderRadius:    'var(--radius-lg, 8px)',
            borderWidth:     '1px',
            borderStyle:     'solid',
            borderColor:     summaryHov ? '#6941c6' : '#7f56d9',
            backgroundColor: summaryHov ? '#6941c6' : '#7f56d9',
            color:           '#fff',
            fontSize:        '14px',
            fontWeight:      600,
            fontFamily:      'inherit',
            cursor:          'pointer',
            boxShadow:       'var(--shadow-sm, 0px 1px 3px rgba(0,0,0,0.1))',
            transition:      'background-color 0.15s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8"  y2="13" />
            <line x1="16" y1="17" x2="8"  y2="17" />
          </svg>
          Ver resumen del brief
        </button>

        {/* Secondary: volver al proyecto */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            onMouseEnter={() => setBackHov(true)}
            onMouseLeave={() => setBackHov(false)}
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              gap:             '6px',
              padding:         '10px 20px',
              borderRadius:    'var(--radius-lg, 8px)',
              borderWidth:     '1px',
              borderStyle:     'solid',
              borderColor:     backHov ? '#d0d5dd' : 'var(--color-border-primary, #eaecf0)',
              backgroundColor: backHov ? 'var(--color-bg-secondary, #f9fafb)' : 'var(--color-bg-primary, #fff)',
              color:           'var(--color-text-secondary, #475467)',
              fontSize:        '14px',
              fontWeight:      500,
              fontFamily:      'inherit',
              cursor:          'pointer',
              transition:      'all 0.15s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Volver al proyecto
          </button>
        )}

        {/* Reabrir brief — owner only */}
        {onReopen && (
          <button
            type="button"
            onClick={onReopen}
            onMouseEnter={() => setReopenHov(true)}
            onMouseLeave={() => setReopenHov(false)}
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              gap:             '6px',
              padding:         '10px 20px',
              borderRadius:    'var(--radius-lg, 8px)',
              borderWidth:     '1px',
              borderStyle:     'solid',
              borderColor:     reopenHov ? '#b54708' : '#f79009',
              backgroundColor: reopenHov ? '#fffaeb' : 'var(--color-bg-primary, #fff)',
              color:           '#b54708',
              fontSize:        '14px',
              fontWeight:      500,
              fontFamily:      'inherit',
              cursor:          'pointer',
              transition:      'all 0.15s ease',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
            </svg>
            Reabrir brief
          </button>
        )}
      </div>
    </div>
  );
}

// ─── CopyLinkButton ───────────────────────────────────────────────────────────
function CopyLinkButton({ state, onClick }) {
  const [hovered, setHovered] = useState(false);

  const isCopying = state === 'copying';
  const isCopied  = state === 'copied';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isCopying}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:         'inline-flex',
        alignItems:      'center',
        gap:             '6px',
        padding:         '7px 12px',
        borderRadius:    'var(--radius-lg, 8px)',
        borderWidth:     '1px',
        borderStyle:     'solid',
        borderColor:     isCopied
          ? '#abefc6'
          : hovered && !isCopying ? '#d0d5dd' : 'var(--color-border-primary, #eaecf0)',
        backgroundColor: isCopied
          ? '#ecfdf3'
          : hovered && !isCopying ? 'var(--color-bg-secondary, #f9fafb)' : 'var(--color-bg-primary, #fff)',
        color:           isCopied
          ? '#027a48'
          : isCopying ? 'var(--color-text-disabled, #98a2b3)' : 'var(--color-text-secondary, #475467)',
        fontSize:        '13px',
        fontWeight:      500,
        fontFamily:      'inherit',
        cursor:          isCopying ? 'not-allowed' : 'pointer',
        boxShadow:       'var(--shadow-xs, 0px 1px 2px rgba(0,0,0,0.05))',
        transition:      'all 0.15s ease',
        flexShrink:      0,
        whiteSpace:      'nowrap',
      }}
    >
      {isCopying && <SpinnerIcon />}
      {isCopied && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {!isCopying && !isCopied && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )}
      {isCopying ? 'Copiando…' : isCopied ? '¡Copiado!' : 'Copiar link'}
    </button>
  );
}

// ─── EditableText — inline editable field (Notion-style) ─────────────────────
/**
 * Texto clicable que se convierte en input/textarea al hacer clic.
 * Guarda automáticamente al perder el foco (blur).
 *
 * Props:
 *   value       string   — valor actual (controlado externamente)
 *   onSave      fn(str)  — async: llamado solo si el valor cambió
 *   multiline   bool     — usa <textarea> en lugar de <input>
 *   style       object   — estilos aplicados al texto + input
 *   placeholder string   — texto gris cuando value está vacío
 *   tag         string   — elemento HTML a renderizar en modo lectura (default 'span')
 */
function EditableText({
  value,
  onSave,
  multiline   = false,
  style       = {},
  placeholder = 'Haz clic para editar…',
  tag: Tag    = 'span',
}) {
  const [editing,    setEditing]    = useState(false);
  const [localValue, setLocalValue] = useState(value ?? '');
  const [saving,     setSaving]     = useState(false);

  // Sync if the parent value changes while not editing (e.g. after an optimistic update)
  useEffect(() => {
    if (!editing) setLocalValue(value ?? '');
  }, [value, editing]);

  async function handleBlur() {
    setEditing(false);
    const trimmed = localValue.trim();
    const original = (value ?? '').trim();
    if (trimmed === original) return; // nothing changed
    setSaving(true);
    try {
      await onSave(trimmed || original); // never save empty — fall back to original
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e) {
    if (!multiline && e.key === 'Enter') { e.preventDefault(); e.target.blur(); return; }
    if (e.key === 'Escape') { setLocalValue(value ?? ''); setEditing(false); }
  }

  // ── Shared base styles ──────────────────────────────────────────────────────
  const baseStyle = {
    fontFamily: 'inherit',
    display:    'block',
    width:      '100%',
    ...style,
  };

  // ── Editing mode ────────────────────────────────────────────────────────────
  if (editing) {
    const inputStyle = {
      ...baseStyle,
      border:        'none',
      outline:       'none',
      background:    'transparent',
      padding:       '2px 6px',
      margin:        '-2px -6px',
      borderRadius:  '5px',
      boxShadow:     '0 0 0 2px var(--color-brand-300, #d6bbfb)',
      resize:        'none',
      lineHeight:    'inherit',
    };
    return multiline ? (
      <textarea
        autoFocus
        value={localValue}
        rows={2}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={inputStyle}
      />
    ) : (
      <input
        autoFocus
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={inputStyle}
      />
    );
  }

  // ── Display mode ────────────────────────────────────────────────────────────
  const isEmpty = !value || String(value).trim() === '';

  return (
    <Tag
      onClick={() => setEditing(true)}
      title="Clic para editar"
      style={{
        ...baseStyle,
        cursor:       'text',
        borderRadius: '5px',
        padding:      '2px 6px',
        margin:       '-2px -6px',
        opacity:      saving ? 0.55 : 1,
        transition:   'background-color 0.12s ease, opacity 0.15s ease',
        whiteSpace:   'pre-wrap',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(127,86,217,0.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {isEmpty
        ? <span style={{ color: 'var(--color-text-placeholder, #c8cdd8)', fontStyle: 'italic', fontWeight: 'normal' }}>{placeholder}</span>
        : value}
    </Tag>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * ProjectBrief
 *
 * 3-stage brief flow:
 *   draft       → Owner builds the template, then confirms it.
 *   in_progress → All members fill in responses. Owner can mark as complete.
 *   completed   → Success screen.
 *
 * Props:
 *   projectId  string
 *   role       'owner' | 'collaborator' | 'client' | null
 *   onBack     () => void   — optional, called from CompletedView's "Volver" button
 */
export default function ProjectBrief({ projectId, role, onBack }) {
  const {
    brief, loading, error, saving,
    canRespond, canStatus, canCreate, canTemplate,
    loadBrief, initializeBrief, mergeResponses, saveTemplate, changeTemplate,
    saveMessages, changeStatus,
    ensurePublicToken,
    clearError,
  } = useBrief(projectId, role);

  // ── Local mirror of responsesJson for instant keystroke feedback ─────────────
  const [localValues,   setLocalValues]   = useState({});
  const [saveStatus,    setSaveStatus]    = useState(null); // null | 'saving' | 'saved' | 'error'
  const [statusBusy,    setStatusBusy]    = useState(false);
  const [confirmError,  setConfirmError]  = useState(null);
  const [linkState,     setLinkState]     = useState(null); // null | 'copying' | 'copied'
  // Two-step completed experience (mirrors PublicBriefPage):
  //   'success' — pantalla de agradecimiento (default)
  //   'read'    — resumen read-only del brief
  const [briefViewMode,    setBriefViewMode]    = useState('success');
  const [reopenToast,      setReopenToast]      = useState(false);
  // confirmValidation: true → muestra aviso "Completa los campos obligatorios"
  const [confirmValidation, setConfirmValidation] = useState(false);
  // ── Messages editor panel (owner only) ────────────────────────────────────
  const [msgPanelOpen, setMsgPanelOpen] = useState(false);

  // ── Change template (draft only) ──────────────────────────────────────────
  // changingTemplate  → true mientras se muestra el selector de plantillas
  // pendingTemplate   → template elegido, pendiente de confirmación en el modal
  // selectorKey       → incrementar fuerza re-mount del selector (reset estado)
  // ctBusy / ctError  → estado local del modal de confirmación
  const [changingTemplate, setChangingTemplate] = useState(false);
  const [pendingTemplate,  setPendingTemplate]  = useState(null);
  const [selectorKey,      setSelectorKey]      = useState(0);
  const [ctBusy,           setCtBusy]           = useState(false);
  const [ctError,          setCtError]          = useState(null);

  const savedTimerRef             = useRef(null);
  const linkTimerRef              = useRef(null);
  const reopenTimerRef            = useRef(null);
  const confirmValidationTimerRef = useRef(null);

  // Seed local values from DB on load (or when brief ID changes)
  useEffect(() => {
    if (brief) setLocalValues(brief.responsesJson ?? {});
  }, [brief?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(savedTimerRef.current);
    clearTimeout(linkTimerRef.current);
    clearTimeout(reopenTimerRef.current);
    clearTimeout(confirmValidationTimerRef.current);
  }, []);

  // ── Field handlers ────────────────────────────────────────────────────────
  function handleFieldChange(fieldId, value) {
    setLocalValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleFieldBlur(fieldId) {
    if (!canRespond) return;
    clearTimeout(savedTimerRef.current);
    setSaveStatus('saving');
    try {
      await mergeResponses({ [fieldId]: localValues[fieldId] ?? '' });
      setSaveStatus('saved');
      savedTimerRef.current = setTimeout(() => setSaveStatus(null), 2000);
    } catch {
      setSaveStatus('error');
      savedTimerRef.current = setTimeout(() => setSaveStatus(null), 3000);
    }
  }

  // ── Status transitions ────────────────────────────────────────────────────
  async function handleChangeStatus(nextStatus) {
    if (!canStatus || statusBusy) return;
    setStatusBusy(true);
    try {
      await changeStatus(nextStatus);
    } catch (err) {
      console.error('[ProjectBrief] changeStatus ❌', err.message);
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleConfirmTemplate() {
    setConfirmError(null);
    try {
      await handleChangeStatus('in_progress');
    } catch (err) {
      setConfirmError(err.message ?? 'Error al confirmar la plantilla');
    }
  }

  async function handleTemplateSave(newTemplate) {
    await saveTemplate(newTemplate);
  }

  // ── Copy public link ───────────────────────────────────────────────────────
  async function handleCopyLink() {
    if (linkState === 'copying') return;
    setLinkState('copying');
    clearTimeout(linkTimerRef.current);
    try {
      const token = await ensurePublicToken();
      const url   = `${window.location.origin}/brief/public/${token}`;
      await navigator.clipboard.writeText(url);
      setLinkState('copied');
      linkTimerRef.current = setTimeout(() => setLinkState(null), 3000);
    } catch (err) {
      console.error('[ProjectBrief] copyLink ❌', err.message);
      setLinkState(null);
    }
  }

  // ── Confirmar brief (owner only, in_progress → completed) ────────────────
  // Solo procede si todos los campos obligatorios están completos (pct === 100).
  // Si no, muestra un aviso de validación por 4 segundos.
  async function handleConfirmBrief() {
    if (!canStatus || statusBusy) return;
    const { pct } = getProgress(brief.templateJson, localValues);
    if (pct < 100) {
      clearTimeout(confirmValidationTimerRef.current);
      setConfirmValidation(true);
      confirmValidationTimerRef.current = setTimeout(() => setConfirmValidation(false), 4000);
      return;
    }
    await handleChangeStatus('completed');
  }

  // ── Reabrir brief (owner only, completed → in_progress) ──────────────────
  async function handleReopen() {
    if (!canStatus || statusBusy) return;
    setStatusBusy(true);
    try {
      await changeStatus('in_progress');
      setBriefViewMode('success'); // reset for next completed cycle
      clearTimeout(reopenTimerRef.current);
      setReopenToast(true);
      reopenTimerRef.current = setTimeout(() => setReopenToast(false), 4000);
    } catch (err) {
      console.error('[ProjectBrief] reopen ❌', err.message);
    } finally {
      setStatusBusy(false);
    }
  }

  // ── Change template handlers ──────────────────────────────────────────────
  /**
   * Usado como `onSelect` de BriefTemplateSelector en modo "cambio de plantilla".
   * Guarda el template elegido y muestra el modal de confirmación.
   * Devuelve una Promise que nunca resuelve: el selector se queda en estado
   * "cargando" mientras el usuario decide en el modal; el éxito o cancelación
   * se gestiona desde los handlers del modal, no desde el selector.
   */
  function handleSelectNewTemplate(newTemplate) {
    setPendingTemplate(newTemplate);
    setCtError(null);
    return new Promise(() => {}); // intencional: el selector espera aquí
  }

  function handleCancelTemplateChange() {
    setPendingTemplate(null);
    setCtError(null);
    setSelectorKey((k) => k + 1); // re-mount para limpiar estado interno del selector
  }

  async function handleConfirmTemplateChange() {
    if (!pendingTemplate || ctBusy) return;
    setCtBusy(true);
    setCtError(null);
    try {
      await changeTemplate(pendingTemplate);
      // Éxito: volver al editor con la nueva plantilla
      setPendingTemplate(null);
      setChangingTemplate(false);
    } catch (err) {
      setCtError(err.message ?? 'Error al cambiar la plantilla');
      // Resetear selector para que el owner pueda intentarlo de nuevo
      setPendingTemplate(null);
      setSelectorKey((k) => k + 1);
    } finally {
      setCtBusy(false);
    }
  }

  // ── Messages panel: simple toggle ────────────────────────────────────────
  function handleToggleMsgPanel() {
    setMsgPanelOpen((prev) => !prev);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div>
      <style>{`@keyframes pb-spin { to { transform: rotate(360deg); } }`}</style>
      <LoadingState />
    </div>
  );

  // ── No brief yet — route by role ──────────────────────────────────────────
  if (!brief) {
    if (canCreate) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <style>{`@keyframes pb-spin { to { transform: rotate(360deg); } }`}</style>
          {error && <ErrorState message={error} onRetry={() => { clearError(); loadBrief(); }} />}
          <BriefTemplateSelector onSelect={initializeBrief} disabled={saving} />
        </div>
      );
    }
    return <NonOwnerEmptyState />;
  }

  const statusCfg = STATUS_CFG[brief.status] ?? STATUS_CFG.draft;

  // ── STAGE 1: draft ────────────────────────────────────────────────────────
  if (brief.status === 'draft') {
    // Non-owner sees a waiting message
    if (!canTemplate) return <DraftPendingNotice />;

    // ── Modo "cambiar plantilla": selector + modal de confirmación ────────────
    if (changingTemplate) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <style>{`@keyframes pb-spin { to { transform: rotate(360deg); } }`}</style>

          {/* Back bar */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '10px',
            padding:        '12px 16px',
            borderRadius:   'var(--radius-xl, 12px)',
            backgroundColor:'var(--color-bg-secondary, #f9fafb)',
            borderWidth:    '1px',
            borderStyle:    'solid',
            borderColor:    'var(--color-border-primary, #eaecf0)',
          }}>
            <button
              type="button"
              onClick={() => { setChangingTemplate(false); setPendingTemplate(null); setCtError(null); setSelectorKey((k) => k + 1); }}
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            '5px',
                padding:        '5px 10px',
                borderRadius:   'var(--radius-md, 6px)',
                border:         'none',
                backgroundColor:'transparent',
                color:          'var(--color-text-tertiary, #667085)',
                fontSize:       '13px',
                fontWeight:     500,
                fontFamily:     'inherit',
                cursor:         'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary, #f2f4f7)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Volver al editor
            </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--color-border-secondary, #f2f4f7)' }} />

            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #101828)' }}>
                Selecciona una nueva plantilla
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary, #667085)' }}>
                Al confirmar, las respuestas actuales se perderán.
              </p>
            </div>
          </div>

          {ctError && (
            <div style={{
              padding:         '10px 16px',
              borderRadius:    'var(--radius-lg, 8px)',
              backgroundColor: '#fef3f2',
              borderWidth:     '1px',
              borderStyle:     'solid',
              borderColor:     '#fecdca',
              fontSize:        '13px',
              color:           '#b42318',
            }}>
              ⚠ {ctError}
            </div>
          )}

          {/* Template selector — key fuerza re-mount al cancelar */}
          <BriefTemplateSelector
            key={selectorKey}
            onSelect={handleSelectNewTemplate}
            disabled={saving}
          />

          {/* Modal de confirmación — se abre en cuanto se elige un template */}
          <Modal
            isOpen={pendingTemplate !== null}
            onClose={handleCancelTemplateChange}
            title="Cambiar plantilla"
            description="Si cambias la plantilla, se perderán todas las respuestas actuales del brief. Esta acción no se puede deshacer."
            maxWidth="440px"
          >
            <Modal.Footer>
              <button
                type="button"
                onClick={handleCancelTemplateChange}
                disabled={ctBusy}
                style={{
                  padding:         '8px 16px',
                  borderRadius:    'var(--radius-lg, 8px)',
                  borderWidth:     '1px',
                  borderStyle:     'solid',
                  borderColor:     'var(--color-border-primary, #eaecf0)',
                  backgroundColor: '#fff',
                  color:           'var(--color-text-secondary, #344054)',
                  fontSize:        '14px',
                  fontWeight:      500,
                  fontFamily:      'inherit',
                  cursor:          ctBusy ? 'not-allowed' : 'pointer',
                  opacity:         ctBusy ? 0.6 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmTemplateChange}
                disabled={ctBusy}
                style={{
                  display:         'inline-flex',
                  alignItems:      'center',
                  gap:             '6px',
                  padding:         '8px 16px',
                  borderRadius:    'var(--radius-lg, 8px)',
                  borderWidth:     '1px',
                  borderStyle:     'solid',
                  borderColor:     ctBusy ? '#b42318' : '#d92d20',
                  backgroundColor: ctBusy ? '#b42318' : '#d92d20',
                  color:           '#fff',
                  fontSize:        '14px',
                  fontWeight:      600,
                  fontFamily:      'inherit',
                  cursor:          ctBusy ? 'not-allowed' : 'pointer',
                }}
              >
                {ctBusy ? (
                  <>
                    <SpinnerIcon size={12} borderColor="rgba(255,255,255,0.35)" topColor="#fff" />
                    Aplicando…
                  </>
                ) : (
                  'Confirmar cambio'
                )}
              </button>
            </Modal.Footer>
          </Modal>
        </div>
      );
    }

    // ── Vista normal: editor de plantilla ──────────────────────────────────────
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <style>{`@keyframes pb-spin { to { transform: rotate(360deg); } }`}</style>

        {error && <ErrorState message={error} onRetry={() => { clearError(); loadBrief(); }} />}

        {/* CTA header with "Confirmar plantilla" + "Cambiar plantilla" */}
        <DraftOwnerHeader
          onConfirm={handleConfirmTemplate}
          onChangeTemplate={() => setChangingTemplate(true)}
          disabled={saving || statusBusy}
          error={confirmError}
        />

        {/* Inline template editor — no cancel needed in this mode */}
        <BriefTemplateEditor
          templateJson={brief.templateJson}
          onSave={handleTemplateSave}
          onCancel={null}
          saving={saving}
          hideCancel
        />
      </div>
    );
  }

  // ── STAGE 3: completed / closed ───────────────────────────────────────────
  if (brief.status === 'completed' || brief.status === 'closed') {
    // Read-only summary view
    if (briefViewMode === 'read') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <style>{`@keyframes pb-spin { to { transform: rotate(360deg); } }`}</style>

          <BriefReadView
            brief={brief}
            responses={brief.responsesJson}
            onBack={() => setBriefViewMode('success')}
            backLabel="Volver al mensaje"
            actions={canStatus && brief.status === 'completed' ? (
              <button
                type="button"
                onClick={handleReopen}
                disabled={statusBusy}
                style={{
                  display:         'inline-flex',
                  alignItems:      'center',
                  gap:             '6px',
                  padding:         '7px 14px',
                  borderRadius:    'var(--radius-lg, 8px)',
                  borderWidth:     '1px',
                  borderStyle:     'solid',
                  borderColor:     '#f79009',
                  backgroundColor: 'var(--color-bg-primary, #fff)',
                  color:           '#b54708',
                  fontSize:        '13px',
                  fontWeight:      500,
                  fontFamily:      'inherit',
                  cursor:          statusBusy ? 'not-allowed' : 'pointer',
                  opacity:         statusBusy ? 0.6 : 1,
                  transition:      'all 0.15s ease',
                  flexShrink:      0,
                  whiteSpace:      'nowrap',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                </svg>
                Reabrir brief
              </button>
            ) : null}
          />
        </div>
      );
    }

    // Default: success screen
    return (
      <div>
        <style>{`@keyframes pb-spin { to { transform: rotate(360deg); } }`}</style>
        <CompletedView
          onBack={onBack}
          onViewSummary={() => setBriefViewMode('read')}
          onReopen={canStatus && brief.status === 'completed' ? handleReopen : undefined}
        />
      </div>
    );
  }

  // ── STAGE 2: in_progress ──────────────────────────────────────────────────
  const sections   = brief.templateJson?.sections ?? [];
  const isReadOnly = !canRespond;

  // Progreso calculado en tiempo real desde localValues (se actualiza en cada
  // keystroke porque localValues cambia antes de que mergeResponses persista).
  const progress = getProgress(brief.templateJson, localValues);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <style>{`@keyframes pb-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Error banner */}
      {error && <ErrorState message={error} onRetry={() => { clearError(); loadBrief(); }} />}

      {/* Reopen toast */}
      {reopenToast && (
        <div style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          gap:             '12px',
          padding:         '12px 16px',
          borderRadius:    'var(--radius-lg, 8px)',
          backgroundColor: '#fffaeb',
          borderWidth:     '1px',
          borderStyle:     'solid',
          borderColor:     '#fec84b',
          fontSize:        '13px',
          color:           '#b54708',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
            </svg>
            El brief ha sido reabierto. Ahora puedes editarlo nuevamente.
          </span>
          <button
            type="button"
            onClick={() => setReopenToast(false)}
            style={{
              background:  'none',
              borderWidth: 0,
              padding:     0,
              cursor:      'pointer',
              color:       '#b54708',
              fontSize:    '16px',
              lineHeight:  1,
              flexShrink:  0,
            }}
            aria-label="Cerrar notificación"
          >
            ×
          </button>
        </div>
      )}

      {/* Progress bar */}
      <ProgressBar {...progress} />

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        {/* Left: status badge + save indicator + read-only notice */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Badge color={statusCfg.color} type="badge-modern" size="sm" dot>
            {statusCfg.label}
          </Badge>

          {saveStatus === 'saving' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-tertiary, #667085)' }}>
              <SpinnerIcon /> Guardando…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--color-text-success-primary, #027a48)' }}>
              <CheckSmallIcon /> Guardado
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-error-primary, #b42318)' }}>
              Error al guardar
            </span>
          )}

          {isReadOnly && (
            <span style={{
              fontSize: '12px', color: 'var(--color-text-tertiary, #667085)',
              backgroundColor: 'var(--color-bg-secondary, #f9fafb)',
              padding: '2px 8px', borderRadius: 'var(--radius-full, 9999px)',
              borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border-primary, #eaecf0)',
            }}>
              Solo lectura
            </span>
          )}
        </div>

        {/* Right: copy link + editar mensajes + "Confirmar brief" (owner only) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {canTemplate && (
            <CopyLinkButton state={linkState} onClick={handleCopyLink} />
          )}
          {canTemplate && (
            <button
              type="button"
              onClick={handleToggleMsgPanel}
              style={{
                display:         'inline-flex',
                alignItems:      'center',
                gap:             '6px',
                padding:         '7px 12px',
                borderRadius:    'var(--radius-lg, 8px)',
                borderWidth:     '1px',
                borderStyle:     'solid',
                borderColor:     msgPanelOpen ? 'var(--color-brand-300, #d6bbfb)' : 'var(--color-border-primary, #eaecf0)',
                backgroundColor: msgPanelOpen ? '#f9f5ff' : 'var(--color-bg-primary, #fff)',
                color:           msgPanelOpen ? 'var(--color-fg-brand-primary, #6941c6)' : 'var(--color-text-secondary, #475467)',
                fontSize:        '13px',
                fontWeight:      500,
                fontFamily:      'inherit',
                cursor:          'pointer',
                boxShadow:       'var(--shadow-xs, 0px 1px 2px rgba(0,0,0,0.05))',
                transition:      'all 0.15s ease',
                flexShrink:      0,
                whiteSpace:      'nowrap',
              }}
              title="Personalizar mensajes de bienvenida y cierre"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
              Mensajes
            </button>
          )}
          {canStatus && (
            <ConfirmBriefButton
              onClick={handleConfirmBrief}
              disabled={statusBusy || saving}
              isReady={progress.pct === 100}
            />
          )}
        </div>
      </div>

      {/* Validación: aviso cuando el owner intenta confirmar sin completar */}
      {confirmValidation && (
        <div style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          gap:             '12px',
          padding:         '10px 14px',
          borderRadius:    'var(--radius-lg, 8px)',
          backgroundColor: 'var(--color-bg-error-primary, #fef3f2)',
          borderWidth:     '1px',
          borderStyle:     'solid',
          borderColor:     '#fecdca',
          fontSize:        '13px',
          color:           'var(--color-text-error-primary, #b42318)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Completa los campos obligatorios antes de confirmar el brief.
          </span>
          <button
            type="button"
            onClick={() => setConfirmValidation(false)}
            style={{ background: 'none', borderWidth: 0, padding: 0, cursor: 'pointer', color: 'inherit', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Mensajes personalizados (owner only, inline edit) ────────────────── */}
      {canTemplate && msgPanelOpen && (
        <div style={{
          borderRadius:    'var(--radius-xl, 12px)',
          borderWidth:     '1px',
          borderStyle:     'solid',
          borderColor:     'var(--color-brand-200, #e9d7fe)',
          backgroundColor: '#faf5ff',
          overflow:        'hidden',
        }}>
          {/* Panel header */}
          <div style={{
            padding:           '12px 20px',
            borderBottomWidth: '1px',
            borderBottomStyle: 'solid',
            borderBottomColor: 'var(--color-brand-200, #e9d7fe)',
            backgroundColor:   '#f3eeff',
            display:           'flex',
            alignItems:        'center',
            justifyContent:    'space-between',
            gap:               '12px',
          }}>
            <div>
              <p style={{ margin: '0 0 1px', fontSize: '13px', fontWeight: 700, color: 'var(--color-fg-brand-primary, #6941c6)' }}>
                Mensajes del formulario público
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-tertiary, #667085)' }}>
                Haz clic en cualquier texto para editarlo — se guarda automáticamente al salir
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMsgPanelOpen(false)}
              style={{
                background:  'none',
                borderWidth: 0,
                padding:     '2px 6px',
                cursor:      'pointer',
                color:       'var(--color-text-tertiary, #667085)',
                fontSize:    '18px',
                lineHeight:  1,
                flexShrink:  0,
              }}
              aria-label="Cerrar panel de mensajes"
            >×</button>
          </div>

          {/* Previews */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ── Bienvenida preview ─────────────────────────────────────────── */}
            <div>
              <p style={{
                margin:        '0 0 10px',
                fontSize:      '11px',
                fontWeight:    700,
                color:         'var(--color-text-tertiary, #667085)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                display:       'flex',
                alignItems:    'center',
                gap:           '5px',
              }}>
                📋 Pantalla de bienvenida
              </p>

              <div style={{
                backgroundColor: '#fff',
                borderRadius:    'var(--radius-lg, 8px)',
                padding:         '18px 22px',
                borderWidth:     '1px',
                borderStyle:     'dashed',
                borderColor:     'var(--color-brand-200, #e9d7fe)',
                display:         'flex',
                flexDirection:   'column',
                gap:             '10px',
              }}>
                <EditableText
                  tag="h3"
                  value={brief.welcomeTitle}
                  onSave={(val) => saveMessages({
                    welcomeTitle:       val,
                    welcomeDescription: brief.welcomeDescription,
                    successTitle:       brief.successTitle,
                    successMessage:     brief.successMessage,
                  })}
                  style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary, #101828)', lineHeight: 1.3 }}
                  placeholder="Título de bienvenida…"
                />
                <EditableText
                  tag="p"
                  value={brief.welcomeDescription}
                  multiline
                  onSave={(val) => saveMessages({
                    welcomeTitle:       brief.welcomeTitle,
                    welcomeDescription: val,
                    successTitle:       brief.successTitle,
                    successMessage:     brief.successMessage,
                  })}
                  style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary, #475467)', lineHeight: 1.6 }}
                  placeholder="Descripción de bienvenida…"
                />
              </div>
            </div>

            {/* ── Celebración preview ───────────────────────────────────────── */}
            <div>
              <p style={{
                margin:        '0 0 10px',
                fontSize:      '11px',
                fontWeight:    700,
                color:         'var(--color-text-tertiary, #667085)',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                display:       'flex',
                alignItems:    'center',
                gap:           '5px',
              }}>
                🎉 Pantalla de confirmación
              </p>

              <div style={{
                backgroundColor: '#fff',
                borderRadius:    'var(--radius-lg, 8px)',
                padding:         '18px 22px',
                borderWidth:     '1px',
                borderStyle:     'dashed',
                borderColor:     'var(--color-brand-200, #e9d7fe)',
                display:         'flex',
                flexDirection:   'column',
                gap:             '10px',
              }}>
                <EditableText
                  tag="h3"
                  value={brief.successTitle}
                  onSave={(val) => saveMessages({
                    welcomeTitle:       brief.welcomeTitle,
                    welcomeDescription: brief.welcomeDescription,
                    successTitle:       val,
                    successMessage:     brief.successMessage,
                  })}
                  style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary, #101828)', lineHeight: 1.3 }}
                  placeholder="Título de confirmación…"
                />
                <EditableText
                  tag="p"
                  value={brief.successMessage}
                  multiline
                  onSave={(val) => saveMessages({
                    welcomeTitle:       brief.welcomeTitle,
                    welcomeDescription: brief.welcomeDescription,
                    successTitle:       brief.successTitle,
                    successMessage:     val,
                  })}
                  style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary, #475467)', lineHeight: 1.6 }}
                  placeholder="Mensaje de confirmación…"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Form sections */}
      {sections.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-tertiary, #667085)' }}>
          La plantilla no tiene secciones definidas.
        </div>
      ) : (
        sections.map((section, idx) => (
          <SectionCard
            key={section.title ?? idx}
            section={section}
            values={localValues}
            onFieldChange={handleFieldChange}
            onFieldBlur={handleFieldBlur}
            isDisabled={isReadOnly || saving}
          />
        ))
      )}
    </div>
  );
}
