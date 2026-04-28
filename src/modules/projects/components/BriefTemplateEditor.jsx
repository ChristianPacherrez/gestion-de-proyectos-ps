import { useState } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId() {
  return (
    (typeof crypto !== 'undefined' && crypto.randomUUID?.()) ||
    `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FIELD_TYPES = [
  { value: 'text',     label: 'Texto corto'       },
  { value: 'textarea', label: 'Texto largo'        },
  { value: 'richtext', label: 'Texto enriquecido'  },
  { value: 'radio',    label: 'Selección única'    },
  { value: 'email',    label: 'Email'              },
  { value: 'date',     label: 'Fecha'              },
];

// ─── Shared inline styles ─────────────────────────────────────────────────────
const inputStyle = {
  display:         'block',
  width:           '100%',
  padding:         '7px 10px',
  fontSize:        '13px',
  fontFamily:      'inherit',
  color:           'var(--color-text-primary, #101828)',
  backgroundColor: 'var(--color-bg-primary, #fff)',
  borderWidth:     '1px',
  borderStyle:     'solid',
  borderColor:     'var(--color-border-primary, #eaecf0)',
  borderRadius:    'var(--radius-md, 6px)',
  outline:         'none',
  boxSizing:       'border-box',
  lineHeight:      1.5,
  transition:      'border-color 0.15s ease',
};

const labelStyle = {
  display:       'block',
  fontSize:      '11px',
  fontWeight:    600,
  color:         'var(--color-text-quaternary, #98a2b3)',
  marginBottom:  '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

// ─── TypeSelect ───────────────────────────────────────────────────────────────
function TypeSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        ...inputStyle,
        width:           'auto',
        paddingRight:    '28px',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
        backgroundRepeat:   'no-repeat',
        backgroundPosition: 'right 8px center',
        appearance:         'none',
        WebkitAppearance:   'none',
        MozAppearance:      'none',
      }}
    >
      {FIELD_TYPES.map((t) => (
        <option key={t.value} value={t.value}>{t.label}</option>
      ))}
    </select>
  );
}

// ─── MoveButton ───────────────────────────────────────────────────────────────
function MoveButton({ direction, onClick, disabled, title }) {
  const [hov, setHov] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           '26px',
        height:          '26px',
        borderRadius:    'var(--radius-md, 6px)',
        borderWidth:     '1px',
        borderStyle:     'solid',
        borderColor:     disabled
          ? 'var(--color-border-secondary, #f2f4f7)'
          : hov ? 'var(--color-border-primary, #eaecf0)' : 'var(--color-border-secondary, #f2f4f7)',
        backgroundColor: disabled
          ? 'transparent'
          : hov ? 'var(--color-bg-secondary, #f9fafb)' : 'transparent',
        color:           disabled
          ? 'var(--color-text-disabled, #d0d5dd)'
          : hov ? 'var(--color-text-secondary, #475467)' : 'var(--color-text-tertiary, #667085)',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        transition:      'all 0.12s ease',
        flexShrink:      0,
        padding:         0,
        fontFamily:      'inherit',
      }}
    >
      {direction === 'up' ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </button>
  );
}

// ─── OptionsEditor — only shown for radio fields ───────────────────────────────
function OptionsEditor({ options, onAdd, onUpdate, onRemove, disabled }) {
  const [delHov, setDelHov] = useState({});

  return (
    <div>
      <label style={labelStyle}>Opciones</label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {(options ?? []).length === 0 && (
          <p style={{
            margin:    0,
            fontSize:  '12px',
            color:     'var(--color-text-quaternary, #98a2b3)',
            fontStyle: 'italic',
          }}>
            Sin opciones — agrega al menos una para que el campo sea funcional.
          </p>
        )}

        {(options ?? []).map((opt, oIdx) => (
          <div
            key={opt.id ?? oIdx}
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '6px',
            }}
          >
            {/* Radio bullet preview */}
            <span style={{
              width:       '14px',
              height:      '14px',
              borderRadius: '50%',
              borderWidth:  '2px',
              borderStyle:  'solid',
              borderColor:  'var(--color-border-primary, #eaecf0)',
              flexShrink:   0,
              display:      'inline-block',
            }} />

            {/* Label input */}
            <input
              type="text"
              value={opt.label ?? ''}
              onChange={(e) => onUpdate(oIdx, 'label', e.target.value)}
              disabled={disabled}
              placeholder={`Opción ${oIdx + 1}`}
              style={{
                ...inputStyle,
                flex:      1,
                padding:   '5px 8px',
                fontSize:  '12px',
                ...(disabled ? { backgroundColor: 'var(--color-bg-disabled, #f2f4f7)', cursor: 'not-allowed' } : {}),
              }}
            />

            {/* Delete option */}
            <button
              type="button"
              onClick={() => onRemove(oIdx)}
              disabled={disabled}
              onMouseEnter={() => setDelHov((p) => ({ ...p, [oIdx]: true }))}
              onMouseLeave={() => setDelHov((p) => ({ ...p, [oIdx]: false }))}
              title="Eliminar opción"
              style={{
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                width:           '26px',
                height:          '26px',
                borderRadius:    'var(--radius-md, 6px)',
                borderWidth:     '1px',
                borderStyle:     'solid',
                borderColor:     disabled
                  ? 'var(--color-border-secondary, #f2f4f7)'
                  : delHov[oIdx] ? '#fda29b' : 'var(--color-border-secondary, #f2f4f7)',
                backgroundColor: disabled
                  ? 'transparent'
                  : delHov[oIdx] ? '#fef3f2' : 'transparent',
                color:           disabled
                  ? 'var(--color-text-disabled, #d0d5dd)'
                  : delHov[oIdx] ? '#b42318' : 'var(--color-text-tertiary, #667085)',
                cursor:          disabled ? 'not-allowed' : 'pointer',
                transition:      'all 0.12s ease',
                flexShrink:      0,
                padding:         0,
                fontFamily:      'inherit',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6"  y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}

        {/* Add option button */}
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             '5px',
            padding:         '5px 10px',
            fontSize:        '12px',
            fontWeight:      500,
            fontFamily:      'inherit',
            color:           disabled ? 'var(--color-text-disabled, #d0d5dd)' : 'var(--color-fg-brand-primary, #6941c6)',
            backgroundColor: 'transparent',
            borderWidth:     '1px',
            borderStyle:     'dashed',
            borderColor:     disabled ? 'var(--color-border-secondary, #f2f4f7)' : 'var(--color-brand-300, #d6bbfb)',
            borderRadius:    'var(--radius-md, 6px)',
            cursor:          disabled ? 'not-allowed' : 'pointer',
            alignSelf:       'flex-start',
            transition:      'all 0.12s ease',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5"  y1="12" x2="19" y2="12" />
          </svg>
          Agregar opción
        </button>
      </div>
    </div>
  );
}

// ─── FieldEditorCard ──────────────────────────────────────────────────────────
function FieldEditorCard({
  field, fieldIdx, totalFields,
  onUpdate, onRemove, onMove,
  onAddOption, onUpdateOption, onRemoveOption,
  disabled,
}) {
  const [delHovered, setDelHovered] = useState(false);

  function update(prop, value) {
    onUpdate(fieldIdx, prop, value);
  }

  const isOnlyField = totalFields === 1;
  const isFirst     = fieldIdx === 0;
  const isLast      = fieldIdx === totalFields - 1;

  return (
    <div style={{
      borderWidth:     '1px',
      borderStyle:     'solid',
      borderColor:     'var(--color-border-secondary, #f2f4f7)',
      borderRadius:    'var(--radius-lg, 8px)',
      backgroundColor: 'var(--color-bg-secondary, #f9fafb)',
      overflow:        'hidden',
    }}>
      {/* ── Top row: type + move + required + delete ──────────────────────── */}
      <div style={{
        display:         'flex',
        alignItems:      'center',
        gap:             '8px',
        padding:         '10px 14px',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'var(--color-border-secondary, #f2f4f7)',
        backgroundColor:   'var(--color-bg-primary, #fff)',
      }}>
        {/* Type select */}
        <TypeSelect
          value={field.type ?? 'text'}
          onChange={(v) => update('type', v)}
          disabled={disabled}
        />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* ↑↓ move buttons */}
        <div style={{ display: 'flex', gap: '3px' }}>
          <MoveButton
            direction="up"
            onClick={() => onMove(fieldIdx, 'up')}
            disabled={disabled || isFirst}
            title={isFirst ? 'Ya es el primer campo' : 'Mover hacia arriba'}
          />
          <MoveButton
            direction="down"
            onClick={() => onMove(fieldIdx, 'down')}
            disabled={disabled || isLast}
            title={isLast ? 'Ya es el último campo' : 'Mover hacia abajo'}
          />
        </div>

        {/* Required toggle */}
        <label style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '6px',
          fontSize:   '12px',
          fontWeight: 500,
          color:      'var(--color-text-secondary, #475467)',
          cursor:     disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          flexShrink: 0,
        }}>
          <input
            type="checkbox"
            checked={field.required ?? false}
            onChange={(e) => update('required', e.target.checked)}
            disabled={disabled}
            style={{
              width:       '14px',
              height:      '14px',
              cursor:      disabled ? 'not-allowed' : 'pointer',
              accentColor: 'var(--color-brand-600, #7f56d9)',
              flexShrink:  0,
            }}
          />
          Requerido
        </label>

        {/* Delete button */}
        <button
          type="button"
          onClick={() => onRemove(fieldIdx)}
          disabled={disabled || isOnlyField}
          onMouseEnter={() => setDelHovered(true)}
          onMouseLeave={() => setDelHovered(false)}
          title={isOnlyField ? 'Una sección necesita al menos un campo' : 'Eliminar pregunta'}
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             '4px',
            padding:         '4px 8px',
            borderRadius:    'var(--radius-md, 6px)',
            borderWidth:     '1px',
            borderStyle:     'solid',
            borderColor:     (disabled || isOnlyField)
              ? 'var(--color-border-primary, #eaecf0)'
              : delHovered ? '#fda29b' : 'var(--color-border-primary, #eaecf0)',
            backgroundColor: (disabled || isOnlyField)
              ? 'transparent'
              : delHovered ? '#fef3f2' : 'transparent',
            color:           (disabled || isOnlyField)
              ? 'var(--color-text-disabled, #d0d5dd)'
              : delHovered ? '#b42318' : 'var(--color-text-tertiary, #667085)',
            fontSize:        '11px',
            fontWeight:      500,
            fontFamily:      'inherit',
            cursor:          (disabled || isOnlyField) ? 'not-allowed' : 'pointer',
            transition:      'all 0.15s ease',
            flexShrink:      0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Eliminar
        </button>
      </div>

      {/* ── Field properties ───────────────────────────────────────────────── */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        gap:           '12px',
        padding:       '14px',
      }}>
        {/* Label */}
        <div>
          <label style={labelStyle}>
            Pregunta
            {field.required && (
              <span style={{ color: 'var(--color-fg-error-primary, #f04438)', marginLeft: '3px' }}>*</span>
            )}
          </label>
          <input
            type="text"
            value={field.label ?? ''}
            onChange={(e) => update('label', e.target.value)}
            disabled={disabled}
            placeholder="Escribe la pregunta…"
            style={{
              ...inputStyle,
              ...(disabled ? { backgroundColor: 'var(--color-bg-disabled, #f2f4f7)', cursor: 'not-allowed' } : {}),
            }}
          />
        </div>

        {/* Placeholder — hidden for date and radio */}
        {field.type !== 'date' && field.type !== 'radio' && (
          <div>
            <label style={labelStyle}>Texto de ayuda (opcional)</label>
            <input
              type="text"
              value={field.placeholder ?? ''}
              onChange={(e) => update('placeholder', e.target.value)}
              disabled={disabled}
              placeholder="Ej: Escribe aquí…"
              style={{
                ...inputStyle,
                ...(disabled ? { backgroundColor: 'var(--color-bg-disabled, #f2f4f7)', cursor: 'not-allowed' } : {}),
              }}
            />
          </div>
        )}

        {/* Options editor — only for radio */}
        {field.type === 'radio' && (
          <OptionsEditor
            options={field.options ?? []}
            onAdd={() => onAddOption(fieldIdx)}
            onUpdate={(oIdx, key, val) => onUpdateOption(fieldIdx, oIdx, key, val)}
            onRemove={(oIdx) => onRemoveOption(fieldIdx, oIdx)}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
}

// ─── AddFieldButton ───────────────────────────────────────────────────────────
function AddFieldButton({ onClick, disabled }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:         'flex',
        alignItems:      'center',
        gap:             '6px',
        padding:         '8px 14px',
        borderRadius:    'var(--radius-lg, 8px)',
        borderWidth:     '1px',
        borderStyle:     'dashed',
        borderColor:     disabled
          ? 'var(--color-border-primary, #eaecf0)'
          : hovered ? 'var(--color-brand-400, #b692f6)' : 'var(--color-border-primary, #eaecf0)',
        backgroundColor: disabled
          ? 'transparent'
          : hovered ? 'var(--color-bg-brand-primary, #f9f5ff)' : 'transparent',
        color:           disabled
          ? 'var(--color-text-disabled, #98a2b3)'
          : hovered ? 'var(--color-fg-brand-primary, #6941c6)' : 'var(--color-text-secondary, #475467)',
        fontSize:        '13px',
        fontWeight:      500,
        fontFamily:      'inherit',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        width:           '100%',
        justifyContent:  'center',
        transition:      'all 0.15s ease',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5"  y1="12" x2="19" y2="12" />
      </svg>
      Agregar pregunta
    </button>
  );
}

// ─── SectionEditor ────────────────────────────────────────────────────────────
function SectionEditor({
  section, sectionIdx,
  onUpdateField, onAddField, onRemoveField, onMoveField,
  onAddOption, onUpdateOption, onRemoveOption,
  disabled,
}) {
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
      {/* Section header */}
      <div style={{
        padding:           '14px 20px',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'var(--color-border-tertiary, #f2f4f7)',
        backgroundColor:   'var(--color-bg-secondary, #f9fafb)',
        display:           'flex',
        alignItems:        'center',
        gap:               '8px',
      }}>
        <h3 style={{
          margin:        0,
          flex:          1,
          fontSize:      '13px',
          fontWeight:    600,
          color:         'var(--color-text-secondary, #475467)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {section.title}
        </h3>
        <span style={{
          fontSize:        '11px',
          color:           'var(--color-text-quaternary, #98a2b3)',
          backgroundColor: 'var(--color-bg-primary, #fff)',
          padding:         '2px 8px',
          borderRadius:    'var(--radius-full, 9999px)',
          borderWidth:     '1px',
          borderStyle:     'solid',
          borderColor:     'var(--color-border-secondary, #f2f4f7)',
        }}>
          {(section.fields ?? []).length} {(section.fields ?? []).length === 1 ? 'pregunta' : 'preguntas'}
        </span>
      </div>

      {/* Fields + add button */}
      <div style={{
        padding:       '16px 20px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '10px',
      }}>
        {(section.fields ?? []).map((field, fIdx) => (
          <FieldEditorCard
            key={field.id ?? fIdx}
            field={field}
            fieldIdx={fIdx}
            totalFields={(section.fields ?? []).length}
            onUpdate={(fi, prop, value)     => onUpdateField(sectionIdx, fi, prop, value)}
            onRemove={(fi)                  => onRemoveField(sectionIdx, fi)}
            onMove={(fi, dir)               => onMoveField(sectionIdx, fi, dir)}
            onAddOption={(fi)               => onAddOption(sectionIdx, fi)}
            onUpdateOption={(fi, oi, k, v)  => onUpdateOption(sectionIdx, fi, oi, k, v)}
            onRemoveOption={(fi, oi)        => onRemoveOption(sectionIdx, fi, oi)}
            disabled={disabled}
          />
        ))}

        <AddFieldButton
          onClick={() => onAddField(sectionIdx)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// ─── BriefTemplateEditor ──────────────────────────────────────────────────────
/**
 * Inline template editor. Renders sections with editable fields.
 * Does not touch responses_json — only works on templateJson structure.
 *
 * Props:
 *   templateJson   object   — current { sections: [...] }
 *   onSave         fn(newTemplate) => Promise<void>
 *   onCancel       fn()
 *   saving         boolean  — passed through from useBrief.saving
 *   hideCancel     boolean  — hides edit-mode banner and Cancel button (draft mode)
 */
export default function BriefTemplateEditor({ templateJson, onSave, onCancel, saving, hideCancel = false }) {
  const [draft,      setDraft]      = useState(() => deepClone(templateJson ?? { sections: [] }));
  const [saveError,  setSaveError]  = useState(null);
  const [cancelHov,  setCancelHov]  = useState(false);
  const [saveHov,    setSaveHov]    = useState(false);

  // ── Mutators ───────────────────────────────────────────────────────────────

  function updateField(sIdx, fIdx, prop, value) {
    setDraft((prev) => {
      const sections = prev.sections.map((s, si) =>
        si !== sIdx ? s : {
          ...s,
          fields: s.fields.map((f, fi) => fi !== fIdx ? f : { ...f, [prop]: value }),
        }
      );
      return { ...prev, sections };
    });
  }

  function addField(sIdx) {
    const newField = {
      id:          generateId(),
      type:        'text',
      label:       '',
      placeholder: '',
      required:    false,
    };
    setDraft((prev) => {
      const sections = prev.sections.map((s, si) =>
        si !== sIdx ? s : { ...s, fields: [...(s.fields ?? []), newField] }
      );
      return { ...prev, sections };
    });
  }

  function removeField(sIdx, fIdx) {
    setDraft((prev) => {
      const sections = prev.sections.map((s, si) =>
        si !== sIdx ? s : { ...s, fields: s.fields.filter((_, fi) => fi !== fIdx) }
      );
      return { ...prev, sections };
    });
  }

  /** Move a field up or down within its section. */
  function moveField(sIdx, fIdx, direction) {
    setDraft((prev) => {
      const sections = prev.sections.map((s, si) => {
        if (si !== sIdx) return s;
        const fields = [...s.fields];
        const targetIdx = direction === 'up' ? fIdx - 1 : fIdx + 1;
        if (targetIdx < 0 || targetIdx >= fields.length) return s;
        // Swap
        [fields[fIdx], fields[targetIdx]] = [fields[targetIdx], fields[fIdx]];
        return { ...s, fields };
      });
      return { ...prev, sections };
    });
  }

  /** Add a new option to a radio field. */
  function addOption(sIdx, fIdx) {
    const newOpt = { id: generateId(), label: '', value: generateId() };
    setDraft((prev) => {
      const sections = prev.sections.map((s, si) =>
        si !== sIdx ? s : {
          ...s,
          fields: s.fields.map((f, fi) =>
            fi !== fIdx ? f : { ...f, options: [...(f.options ?? []), newOpt] }
          ),
        }
      );
      return { ...prev, sections };
    });
  }

  /** Update a property (e.g. label) of a specific option. */
  function updateOption(sIdx, fIdx, optIdx, key, val) {
    setDraft((prev) => {
      const sections = prev.sections.map((s, si) =>
        si !== sIdx ? s : {
          ...s,
          fields: s.fields.map((f, fi) =>
            fi !== fIdx ? f : {
              ...f,
              options: (f.options ?? []).map((o, oi) =>
                oi !== optIdx ? o : { ...o, [key]: val }
              ),
            }
          ),
        }
      );
      return { ...prev, sections };
    });
  }

  /** Remove an option from a radio field. */
  function removeOption(sIdx, fIdx, optIdx) {
    setDraft((prev) => {
      const sections = prev.sections.map((s, si) =>
        si !== sIdx ? s : {
          ...s,
          fields: s.fields.map((f, fi) =>
            fi !== fIdx ? f : {
              ...f,
              options: (f.options ?? []).filter((_, oi) => oi !== optIdx),
            }
          ),
        }
      );
      return { ...prev, sections };
    });
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaveError(null);
    try {
      await onSave(draft);
    } catch (err) {
      setSaveError(err.message ?? 'Error al guardar la plantilla');
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Edit-mode banner (only shown when not in hideCancel/draft mode) ── */}
      {!hideCancel && (
        <div style={{
          display:         'flex',
          alignItems:      'center',
          gap:             '10px',
          padding:         '10px 16px',
          borderRadius:    'var(--radius-lg, 8px)',
          backgroundColor: '#fffaeb',
          borderWidth:     '1px',
          borderStyle:     'solid',
          borderColor:     '#fec84b',
          fontSize:        '13px',
          color:           '#92400e',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>
            <strong>Modo edición de plantilla</strong> — Los cambios no afectan las respuestas ya guardadas.
          </span>
        </div>
      )}

      {/* ── Save error ───────────────────────────────────────────────────── */}
      {saveError && (
        <div style={{
          padding:         '10px 16px',
          borderRadius:    'var(--radius-lg, 8px)',
          backgroundColor: 'var(--color-bg-error-primary, #fef3f2)',
          borderWidth:     '1px',
          borderStyle:     'solid',
          borderColor:     '#fecdca',
          fontSize:        '13px',
          color:           'var(--color-text-error-primary, #b42318)',
        }}>
          ⚠ {saveError}
        </div>
      )}

      {/* ── Sections ─────────────────────────────────────────────────────── */}
      {(draft.sections ?? []).map((section, sIdx) => (
        <SectionEditor
          key={section.title ?? sIdx}
          section={section}
          sectionIdx={sIdx}
          onUpdateField={updateField}
          onAddField={addField}
          onRemoveField={removeField}
          onMoveField={moveField}
          onAddOption={addOption}
          onUpdateOption={updateOption}
          onRemoveOption={removeOption}
          disabled={saving}
        />
      ))}

      {/* ── Action bar ───────────────────────────────────────────────────── */}
      <div style={{
        display:         'flex',
        justifyContent:  'flex-end',
        gap:             '10px',
        padding:         '16px 20px',
        borderRadius:    'var(--radius-xl, 12px)',
        backgroundColor: 'var(--color-bg-secondary, #f9fafb)',
        borderWidth:     '1px',
        borderStyle:     'solid',
        borderColor:     'var(--color-border-primary, #eaecf0)',
      }}>
        {/* Cancel — hidden in draft builder mode */}
        {!hideCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            onMouseEnter={() => setCancelHov(true)}
            onMouseLeave={() => setCancelHov(false)}
            style={{
              padding:         '8px 16px',
              borderRadius:    'var(--radius-lg, 8px)',
              borderWidth:     '1px',
              borderStyle:     'solid',
              borderColor:     cancelHov && !saving ? '#d0d5dd' : 'var(--color-border-primary, #eaecf0)',
              backgroundColor: cancelHov && !saving ? 'var(--color-bg-secondary, #f9fafb)' : 'var(--color-bg-primary, #fff)',
              color:           saving ? 'var(--color-text-disabled, #98a2b3)' : 'var(--color-text-secondary, #475467)',
              fontSize:        '13px',
              fontWeight:      500,
              fontFamily:      'inherit',
              cursor:          saving ? 'not-allowed' : 'pointer',
              transition:      'all 0.15s ease',
            }}
          >
            Cancelar
          </button>
        )}

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          onMouseEnter={() => setSaveHov(true)}
          onMouseLeave={() => setSaveHov(false)}
          style={{
            display:         'inline-flex',
            alignItems:      'center',
            gap:             '7px',
            padding:         '8px 16px',
            borderRadius:    'var(--radius-lg, 8px)',
            borderWidth:     '1px',
            borderStyle:     'solid',
            borderColor:     saving ? '#7f56d9' : saveHov ? '#6941c6' : '#7f56d9',
            backgroundColor: saving ? '#6941c6' : saveHov ? '#6941c6' : '#7f56d9',
            color:           '#fff',
            fontSize:        '13px',
            fontWeight:      600,
            fontFamily:      'inherit',
            cursor:          saving ? 'not-allowed' : 'pointer',
            boxShadow:       'var(--shadow-xs, 0px 1px 2px rgba(0,0,0,0.05))',
            transition:      'background-color 0.15s ease',
          }}
        >
          {saving ? (
            <>
              <SaveSpinner />
              Guardando…
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Guardar plantilla
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── SaveSpinner (local) ─────────────────────────────────────────────────────
function SaveSpinner() {
  return (
    <>
      <style>{`@keyframes bte-spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{
        display:        'inline-block',
        width:          '12px',
        height:         '12px',
        borderRadius:   '50%',
        borderWidth:    '2px',
        borderStyle:    'solid',
        borderColor:    'rgba(255,255,255,0.35)',
        borderTopColor: '#fff',
        animation:      'bte-spin 0.7s linear infinite',
        flexShrink:     0,
      }} />
    </>
  );
}
