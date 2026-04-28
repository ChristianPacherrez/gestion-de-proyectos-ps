import { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchBriefByToken,
  updateBriefResponsesByToken,
} from '../../../lib/supabase/briefSupabase';
import { Input }         from '../../../components/ui/Input';
import { TextArea }      from '../../../components/ui/TextArea';
import RichTextEditor    from './RichTextEditor';
import BriefReadView     from './BriefReadView';

// ─── FieldRenderer ────────────────────────────────────────────────────────────
function FieldRenderer({ field, value, onChange, onBlur, isDisabled }) {
  const common = {
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
        minHeight={160}
      />
    );
  }

  // ── textarea ────────────────────────────────────────────────────────────────
  if (field.type === 'textarea') {
    return (
      <TextArea
        {...common}
        rows={3}
        placeholder={field.placeholder || 'Escribe aquí…'}
      />
    );
  }

  // ── radio: vertical group of native radio inputs ────────────────────────────
  if (field.type === 'radio') {
    const options = field.options ?? [];

    return (
      <div>
        <label style={{
          display:      'block',
          fontSize:     '14px',
          fontWeight:   500,
          color:        '#344054',
          marginBottom: '8px',
        }}>
          {field.label}
          {field.required && (
            <span style={{ color: '#f04438', marginLeft: '3px' }}>*</span>
          )}
        </label>

        {options.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: '#98a2b3', fontStyle: 'italic' }}>
            Sin opciones definidas
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {options.map((opt) => (
              <label
                key={opt.id ?? opt.value}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        '10px',
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
                    width:       '18px',
                    height:      '18px',
                    accentColor: '#7f56d9',
                    cursor:      isDisabled ? 'not-allowed' : 'pointer',
                    flexShrink:  0,
                  }}
                />
                <span style={{
                  fontSize: '15px',
                  color:    isDisabled ? '#667085' : '#101828',
                  lineHeight: 1.5,
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
      {...common}
      type={field.type ?? 'text'}
      placeholder={field.type === 'date' ? undefined : (field.placeholder || 'Escribe aquí…')}
    />
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
function SectionCard({ section, values, onFieldChange, onFieldBlur, isDisabled }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderWidth:     '1px',
      borderStyle:     'solid',
      borderColor:     '#eaecf0',
      borderRadius:    '12px',
      overflow:        'hidden',
      boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        padding:           '14px 20px',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: '#f2f4f7',
        backgroundColor:   '#f9fafb',
      }}>
        <h2 style={{
          margin:        0,
          fontSize:      '13px',
          fontWeight:    600,
          color:         '#475467',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {section.title}
        </h2>
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

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 20 }) {
  return (
    <>
      <style>{`@keyframes pbp-spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{
        display:        'inline-block',
        width:          `${size}px`,
        height:         `${size}px`,
        borderRadius:   '50%',
        borderWidth:    '2px',
        borderStyle:    'solid',
        borderColor:    '#e9d7fe',
        borderTopColor: '#7f56d9',
        animation:      'pbp-spin 0.7s linear infinite',
        flexShrink:     0,
      }} />
    </>
  );
}

// ─── SaveButton ───────────────────────────────────────────────────────────────
function SaveButton({ onClick, saving, saved }) {
  const [hov, setHov] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:         'inline-flex',
        alignItems:      'center',
        gap:             '8px',
        padding:         '10px 24px',
        borderRadius:    '8px',
        borderWidth:     '1px',
        borderStyle:     'solid',
        borderColor:     saved ? '#17b26a' : saving ? '#7f56d9' : hov ? '#6941c6' : '#7f56d9',
        backgroundColor: saved ? '#ecfdf3' : saving ? '#6941c6' : hov ? '#6941c6' : '#7f56d9',
        color:           saved ? '#027a48' : '#fff',
        fontSize:        '15px',
        fontWeight:      600,
        fontFamily:      'inherit',
        cursor:          saving ? 'not-allowed' : 'pointer',
        transition:      'all 0.15s ease',
        boxShadow:       '0px 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {saving && <Spinner size={15} />}
      {saved && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {saving ? 'Guardando…' : saved ? '¡Guardado!' : 'Guardar respuestas'}
    </button>
  );
}

// ─── SuccessScreen ────────────────────────────────────────────────────────────
/**
 * Pantalla de éxito mostrada por defecto cuando brief.status === 'completed'.
 * Ofrece un botón para pasar al resumen en modo lectura.
 */
function SuccessScreen({ onViewSummary }) {
  const [hov, setHov] = useState(false);

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '80px 24px',
      gap:            '28px',
      textAlign:      'center',
    }}>
      {/* Big animated check circle */}
      <div style={{
        width:           '96px',
        height:          '96px',
        borderRadius:    '50%',
        backgroundColor: '#ecfdf3',
        borderWidth:     '3px',
        borderStyle:     'solid',
        borderColor:     '#abefc6',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        color:           '#17b26a',
        flexShrink:      0,
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      {/* Copy */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '440px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#101828', lineHeight: 1.3 }}>
          ¡Gracias por completar el brief!
        </h1>
        <p style={{ margin: 0, fontSize: '16px', color: '#475467', lineHeight: 1.65 }}>
          Tu información ha sido registrada correctamente.<br />
          Estamos listos para comenzar 🚀
        </p>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onViewSummary}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display:         'inline-flex',
          alignItems:      'center',
          gap:             '8px',
          padding:         '11px 24px',
          borderRadius:    '8px',
          borderWidth:     '1px',
          borderStyle:     'solid',
          borderColor:     hov ? '#d6bbfb' : '#eaecf0',
          backgroundColor: hov ? '#f9f5ff' : '#fff',
          color:           hov ? '#6941c6' : '#344054',
          fontSize:        '15px',
          fontWeight:      600,
          fontFamily:      'inherit',
          cursor:          'pointer',
          boxShadow:       '0px 1px 3px rgba(0,0,0,0.08)',
          transition:      'all 0.15s ease',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        Ver resumen del brief
      </button>
    </div>
  );
}

// ─── ReadOnlyField ─────────────────────────────────────────────────────────────
/**
 * Renderiza un campo en modo lectura pura — sin inputs, solo valores.
 * Forma parte de la vista "resumen" que el cliente puede revisar tras completar.
 */
function ReadOnlyField({ field, value }) {
  const hasValue = value !== undefined && value !== null && String(value).trim() !== '';

  const labelSt = {
    display:       'block',
    fontSize:      '11px',
    fontWeight:    700,
    color:         '#98a2b3',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom:  '5px',
  };
  const emptyValueSt = {
    fontSize:  '14px',
    color:     '#d0d5dd',
    fontStyle: 'italic',
  };
  const valueSt = {
    fontSize:   '14px',
    color:      '#101828',
    lineHeight: 1.65,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Label */}
      <span style={labelSt}>
        {field.label}
        {field.required && <span style={{ color: '#f04438', marginLeft: '3px' }}>*</span>}
      </span>

      {/* Value — type-specific rendering */}
      {field.type === 'richtext' ? (
        hasValue ? (
          /* Render stored HTML safely — user entered this content themselves */
          <div
            dangerouslySetInnerHTML={{ __html: value }}
            style={{
              ...valueSt,
              lineHeight: 1.7,
              paddingTop: '2px',
            }}
          />
        ) : (
          <span style={emptyValueSt}>—</span>
        )
      ) : field.type === 'radio' ? (
        (() => {
          const opts     = field.options ?? [];
          const selected = opts.find((o) => o.value === value);
          const label    = selected?.label || (hasValue ? String(value) : null);
          return label
            ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', ...valueSt }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: '#7f56d9', flexShrink: 0, display: 'inline-block',
                }} />
                {label}
              </span>
            )
            : <span style={emptyValueSt}>—</span>;
        })()
      ) : field.type === 'date' ? (
        hasValue ? (
          <span style={valueSt}>
            {(() => {
              try {
                return new Date(value).toLocaleDateString('es-ES', {
                  day: '2-digit', month: 'long', year: 'numeric',
                });
              } catch {
                return String(value);
              }
            })()}
          </span>
        ) : (
          <span style={emptyValueSt}>—</span>
        )
      ) : (
        /* text, textarea, email — plain text */
        hasValue
          ? <span style={{ ...valueSt, whiteSpace: 'pre-wrap' }}>{String(value)}</span>
          : <span style={emptyValueSt}>—</span>
      )}
    </div>
  );
}

// ─── ReadOnlySectionCard ───────────────────────────────────────────────────────
/**
 * Sección del brief en modo lectura. Muestra label + valor de cada campo.
 * Usado en la vista "Resumen" del brief completado.
 */
function ReadOnlySectionCard({ section, responses }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderWidth:     '1px',
      borderStyle:     'solid',
      borderColor:     '#eaecf0',
      borderRadius:    '12px',
      overflow:        'hidden',
      boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{
        padding:           '13px 20px',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: '#f2f4f7',
        backgroundColor:   '#f9fafb',
      }}>
        <h2 style={{
          margin:        0,
          fontSize:      '13px',
          fontWeight:    600,
          color:         '#475467',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {section.title}
        </h2>
      </div>

      {/* Fields */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {(section.fields ?? []).map((field) => (
          <ReadOnlyField
            key={field.id}
            field={field}
            value={responses?.[field.id]}
          />
        ))}
      </div>
    </div>
  );
}

// ─── PublicBriefPage ──────────────────────────────────────────────────────────
/**
 * Vista pública del brief — accesible sin autenticación mediante
 * un token único en la URL: /brief/public/:token
 *
 * Props:
 *   token  string — extraído de window.location.pathname en App.jsx
 */
export default function PublicBriefPage({ token }) {
  const [brief,       setBrief]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState(null);
  const [localValues, setLocalValues] = useState({});
  const [autoSave,    setAutoSave]    = useState(null);  // null | 'saving' | 'saved' | 'error'
  const [bulkSaving,  setBulkSaving]  = useState(false);
  const [bulkSaved,   setBulkSaved]   = useState(false);
  // viewMode controls the two-step completed experience:
  //   'success' — pantalla de agradecimiento (default al entrar en completed)
  //   'read'    — resumen read-only del brief con todos los valores guardados
  const [viewMode,     setViewMode]     = useState('success');
  // ── Typeform flow stages (solo para in_progress) ──────────────────────────
  //   'intro'       — pantalla de bienvenida
  //   'form'        — formulario campo a campo
  //   'celebration' — pantalla de éxito tras guardar
  const [formStage,    setFormStage]    = useState('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fieldError,   setFieldError]   = useState(false);
  const [direction,    setDirection]    = useState('forward'); // 'forward' | 'backward'
  const autoSaveTimer      = useRef(null);
  const fieldErrorTimerRef = useRef(null);
  const fieldWrapperRef    = useRef(null);
  const handleNextRef      = useRef(null); // ref estable para el keydown listener
  const currentFieldRef    = useRef(null); // espeja currentField en cada render

  // ── Load brief on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await fetchBriefByToken(token);
        if (!cancelled) {
          setBrief(data);
          setLocalValues(data?.responsesJson ?? {});
        }
      } catch (err) {
        if (!cancelled) setFetchError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token]);

  // ── Fix: fuerza fondo claro en toda la cadena html→body→#root ─────────────
  // El <style> scoped ya aplica !important en CSS, pero este efecto garantiza
  // cobertura inmediata (frame 0) antes de que el motor de estilos repinte,
  // y restaura los valores originales al desmontar el componente.
  useEffect(() => {
    const htmlEl  = document.documentElement;
    const bodyEl  = document.body;
    const rootEl  = document.getElementById('root');

    const prevHtml = htmlEl.style.backgroundColor;
    const prevBody = bodyEl.style.backgroundColor;
    const prevRoot = rootEl?.style.backgroundColor ?? '';

    const BG = '#f9fafb';
    htmlEl.style.backgroundColor = BG;
    bodyEl.style.backgroundColor = BG;
    if (rootEl) rootEl.style.backgroundColor = BG;

    return () => {
      htmlEl.style.backgroundColor = prevHtml;
      bodyEl.style.backgroundColor = prevBody;
      if (rootEl) rootEl.style.backgroundColor = prevRoot;
    };
  }, []);

  // Cleanup
  useEffect(() => () => {
    clearTimeout(autoSaveTimer.current);
    clearTimeout(fieldErrorTimerRef.current);
  }, []);

  // ── Merge and persist responses ──────────────────────────────────────────
  const mergeAndSave = useCallback(async (partial) => {
    if (!brief) return;
    const merged = { ...(brief.responsesJson ?? {}), ...partial };

    // Optimistic: update brief.responsesJson so the next merge is cumulative
    setBrief((prev) => prev ? { ...prev, responsesJson: merged } : prev);

    try {
      const updated = await updateBriefResponsesByToken(token, merged);
      setBrief(updated);
    } catch (err) {
      console.error('[PublicBriefPage] save error:', err.message);
      throw err;
    }
  }, [brief, token]);

  // ── Field handlers ────────────────────────────────────────────────────────
  function handleFieldChange(fieldId, value) {
    setLocalValues((prev) => ({ ...prev, [fieldId]: value }));
    setBulkSaved(false);
    // Radio: avanzar automáticamente 350 ms después de seleccionar una opción
    if (currentFieldRef.current?.type === 'radio' && currentFieldRef.current?.id === fieldId) {
      setTimeout(() => handleNextRef.current?.(), 350);
    }
  }

  async function handleFieldBlur(fieldId) {
    clearTimeout(autoSaveTimer.current);
    setAutoSave('saving');
    try {
      await mergeAndSave({ [fieldId]: localValues[fieldId] ?? '' });
      setAutoSave('saved');
      autoSaveTimer.current = setTimeout(() => setAutoSave(null), 2500);
    } catch {
      setAutoSave('error');
      autoSaveTimer.current = setTimeout(() => setAutoSave(null), 3500);
    }
  }

  // ── Bulk save (usado desde fuera del flujo Typeform si se necesita) ───────
  async function handleBulkSave() {
    if (bulkSaving || !brief) return;
    setBulkSaving(true);
    setBulkSaved(false);
    try {
      await mergeAndSave(localValues);
      setBulkSaved(true);
      setTimeout(() => setBulkSaved(false), 3000);
    } catch (err) {
      console.error('[PublicBriefPage] bulk save error:', err.message);
    } finally {
      setBulkSaving(false);
    }
  }

  // ── Último paso del Typeform: guarda todo y muestra celebración ───────────
  async function handleLastStepSave() {
    if (bulkSaving || !brief) return;
    setBulkSaving(true);
    setBulkSaved(false);
    try {
      await mergeAndSave(localValues);
      setBulkSaved(true);
      // Breve pausa para que el usuario vea "¡Guardado!" antes de transicionar
      setTimeout(() => {
        setBulkSaved(false);
        setFormStage('celebration');
      }, 700);
    } catch (err) {
      console.error('[PublicBriefPage] final save error:', err.message);
    } finally {
      setBulkSaving(false);
    }
  }

  // ── Typeform navigation ───────────────────────────────────────────────────
  // Todos los campos de todas las secciones aplanados, con sectionTitle adjunto.
  const allFields = (brief?.templateJson?.sections ?? []).flatMap((sec) =>
    (sec.fields ?? []).map((field) => ({ ...field, sectionTitle: sec.title ?? '' }))
  );
  const currentField = allFields[currentIndex] ?? null;

  // Mantener refs en sincronía para que los listeners de eventos siempre lean
  // el valor más reciente sin necesitar declarar dependencias extra en useEffect.
  currentFieldRef.current = currentField;

  /** True si el campo no es requerido o ya tiene valor. */
  function isFieldValid(field) {
    if (!field?.required) return true;
    const v = localValues[field.id];
    return v !== undefined && v !== null && String(v).trim() !== '';
  }

  /** Avanza validando el campo actual. */
  function handleNext() {
    if (!isFieldValid(currentField)) {
      clearTimeout(fieldErrorTimerRef.current);
      setFieldError(true);
      fieldErrorTimerRef.current = setTimeout(() => setFieldError(false), 4000);
      return;
    }
    setFieldError(false);
    setDirection('forward');
    if (currentIndex < allFields.length - 1) {
      setCurrentIndex(currentIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setFieldError(false);
      setDirection('backward');
      setCurrentIndex(currentIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // Mantener handleNextRef actualizado para el keydown listener estable
  handleNextRef.current = handleNext;

  // ── Enter = Siguiente (excepto en textarea y richtext) ────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Enter') return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      const ce  = document.activeElement?.isContentEditable;
      if (tag === 'textarea' || ce || tag === 'button' || tag === 'a') return;
      e.preventDefault();
      handleNextRef.current?.();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []); // efecto estable: accede al estado más reciente a través de handleNextRef

  // ── Auto-focus: primer input del campo tras cada cambio ─────────────────
  // 80 ms da tiempo a que el DOM del nuevo campo monte antes de intentar el focus.
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = fieldWrapperRef.current?.querySelector(
        'input:not([type="radio"]):not([disabled]), textarea:not([disabled])'
      );
      el?.focus({ preventScroll: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // ── Render ────────────────────────────────────────────────────────────────

  const isCompleted = brief?.status === 'completed' || brief?.status === 'closed';
  const isReadOnly  = isCompleted;

  return (
    <div
      className="pbp-root"
      style={{ backgroundColor: '#f9fafb', fontFamily: 'inherit' }}
    >
      <style>{`
        /* ── PublicBriefPage: fondo claro garantizado ──────────────────────────
           Este <style> solo existe en el DOM cuando la ruta pública está activa
           (App.jsx renderiza <PublicBriefPage> sin MainLayout). Por eso es seguro
           apuntar a html / body / #root aquí: no afecta a ninguna otra pantalla.

           Problema: la cadena html→body→#root hereda color-scheme:light dark de
           :root, lo que en dark mode pone --bg:#16171d como fondo. Cuando el
           contenido desborda los 100vh de #root (que es un flex-column fijo),
           el scroll de <html> muestra ese fondo oscuro detrás.

           Solución: forzar fondo claro en TODOS los ancestros que quedan visibles
           al hacer scroll, sin tocar nada de MainLayout / layout global.
        */
        html,
        body,
        #root {
          background-color: #f9fafb !important;
        }

        /* ── Contenedor principal de la página pública ─────────────────────────
           Crece con su contenido (height:auto) y garantiza mínimo 100vh.
           display:flex + flex-direction:column permite que el brand-header y el
           area de contenido se apilen verticalmente sin restricciones de altura.
        */
        .pbp-root {
          min-height: 100vh;
          height: auto !important;
          width: 100%;
          display: flex;
          flex-direction: column;
          background-color: #f9fafb;
        }

        @keyframes pbp-spin       { to { transform: rotate(360deg); } }
        @keyframes pbp-slide-up   { from { opacity: 0; transform: translateY(24px);  } to { opacity: 1; transform: translateY(0); } }
        @keyframes pbp-slide-down { from { opacity: 0; transform: translateY(-24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pbp-fade-scale { from { opacity: 0; transform: scale(0.96);       } to { opacity: 1; transform: scale(1);    } }
      `}</style>

      {/* ── Brand header ──────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: '#fff',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: '#eaecf0',
        padding:           '16px 24px',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Logo placeholder — replace with your logo if available */}
          <div style={{
            width:           '32px',
            height:          '32px',
            borderRadius:    '8px',
            backgroundColor: '#7f56d9',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            flexShrink:      0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#101828' }}>
            {loading || !brief ? 'Brief del proyecto' : (brief.projectName || 'Brief del proyecto')}
          </span>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '40px 16px 80px', boxSizing: 'border-box' }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
            <Spinner size={28} />
            <span style={{ fontSize: '15px', color: '#667085' }}>Cargando formulario…</span>
          </div>
        )}

        {/* Fetch error */}
        {!loading && fetchError && (
          <CenteredMessage
            icon="⚠️"
            title="Error al cargar el brief"
            body={fetchError}
          />
        )}

        {/* Not found */}
        {!loading && !fetchError && !brief && (
          <CenteredMessage
            icon="🔍"
            title="Brief no encontrado"
            body="El link no es válido o ha expirado. Solicita uno nuevo al responsable del proyecto."
          />
        )}

        {/* Draft — not available yet */}
        {!loading && brief?.status === 'draft' && (
          <CenteredMessage
            icon="🔧"
            title="El brief aún no está disponible"
            body="El propietario del proyecto está terminando de configurarlo. Inténtalo de nuevo más tarde."
          />
        )}

        {/* Completed / Closed — paso 1: pantalla de éxito */}
        {!loading && brief && isCompleted && viewMode === 'success' && (
          <SuccessScreen onViewSummary={() => setViewMode('read')} />
        )}

        {/* Completed / Closed — paso 2: resumen read-only */}
        {!loading && brief && isCompleted && viewMode === 'read' && (
          <BriefReadView
            brief={brief}
            responses={brief.responsesJson}
            onBack={() => setViewMode('success')}
            backLabel="Volver al mensaje"
          />
        )}

        {/* In progress — INTRO ─────────────────────────────────────────────── */}
        {!loading && brief?.status === 'in_progress' && formStage === 'intro' && (
          <div style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            minHeight:      '68vh',
            textAlign:      'center',
            padding:        '48px 8px 64px',
            animation:      'pbp-fade-scale 0.45s cubic-bezier(0.4, 0, 0.2, 1) both',
          }}>
            {/* Icono decorativo */}
            <div style={{
              width:           '72px',
              height:          '72px',
              borderRadius:    '50%',
              backgroundColor: '#f9f5ff',
              borderWidth:     '2px',
              borderStyle:     'solid',
              borderColor:     '#e9d7fe',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              marginBottom:    '28px',
              fontSize:        '32px',
            }}>
              📋
            </div>

            {/* Título de bienvenida */}
            <h1 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: 700, color: '#101828', lineHeight: 1.3, maxWidth: '500px' }}>
              {brief.welcomeTitle}
            </h1>

            {/* Descripción de bienvenida */}
            <p style={{ margin: '0 0 36px', fontSize: '16px', color: '#667085', lineHeight: 1.65, maxWidth: '440px' }}>
              {brief.welcomeDescription}
            </p>

            {/* Estimado de tiempo */}
            <p style={{ margin: '0 0 32px', fontSize: '13px', color: '#98a2b3' }}>
              ⏱ {allFields.length} {allFields.length === 1 ? 'pregunta' : 'preguntas'} · aprox. {Math.max(1, Math.ceil(allFields.length * 0.5))} min
            </p>

            {/* CTA */}
            <button
              type="button"
              onClick={() => setFormStage('form')}
              style={{
                display:         'inline-flex',
                alignItems:      'center',
                gap:             '8px',
                padding:         '13px 32px',
                borderRadius:    '8px',
                borderWidth:     '1px',
                borderStyle:     'solid',
                borderColor:     '#7f56d9',
                backgroundColor: '#7f56d9',
                color:           '#fff',
                fontSize:        '16px',
                fontWeight:      600,
                fontFamily:      'inherit',
                cursor:          'pointer',
                boxShadow:       '0px 1px 4px rgba(127,86,217,0.35)',
                transition:      'all 0.15s ease',
              }}
            >
              Empezar
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <p style={{ marginTop: '20px', fontSize: '12px', color: '#c8cdd8' }}>
              Sus respuestas son confidenciales y solo las verá el equipo del proyecto.
            </p>
          </div>
        )}

        {/* In progress — CELEBRACIÓN ────────────────────────────────────────── */}
        {!loading && brief?.status === 'in_progress' && formStage === 'celebration' && (
          <div style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            minHeight:      '68vh',
            textAlign:      'center',
            padding:        '48px 8px 64px',
            animation:      'pbp-fade-scale 0.45s cubic-bezier(0.4, 0, 0.2, 1) both',
          }}>
            {/* Emoji celebración */}
            <div style={{ fontSize: '64px', marginBottom: '24px', lineHeight: 1 }}>
              🎉
            </div>

            {/* Título de éxito */}
            <h2 style={{ margin: '0 0 12px', fontSize: '26px', fontWeight: 700, color: '#101828', lineHeight: 1.3, maxWidth: '480px' }}>
              {brief.successTitle}
            </h2>

            {/* Mensaje de éxito */}
            <p style={{ margin: '0 0 36px', fontSize: '16px', color: '#667085', lineHeight: 1.65, maxWidth: '420px' }}>
              {brief.successMessage}
            </p>

            {/* Acciones */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {/* Ver resumen */}
              <button
                type="button"
                onClick={() => setFormStage('read')}
                style={{
                  display:         'inline-flex',
                  alignItems:      'center',
                  gap:             '7px',
                  padding:         '11px 22px',
                  borderRadius:    '8px',
                  borderWidth:     '1px',
                  borderStyle:     'solid',
                  borderColor:     '#d0d5dd',
                  backgroundColor: '#fff',
                  color:           '#344054',
                  fontSize:        '14px',
                  fontWeight:      500,
                  fontFamily:      'inherit',
                  cursor:          'pointer',
                  boxShadow:       '0px 1px 3px rgba(0,0,0,0.08)',
                  transition:      'all 0.15s ease',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Ver resumen
              </button>
            </div>

            <p style={{ marginTop: '28px', fontSize: '12px', color: '#c8cdd8' }}>
              Puedes cerrar esta ventana en cualquier momento.
            </p>
          </div>
        )}

        {/* In progress — RESUMEN (modo lectura) ───────────────────────────── */}
        {!loading && brief?.status === 'in_progress' && formStage === 'read' && (
          <BriefReadView
            brief={brief}
            responses={brief.responsesJson}
            onBack={() => setFormStage('celebration')}
            backLabel="Volver"
          />
        )}

        {/* In progress — FORMULARIO TYPEFORM ───────────────────────────────── */}
        {!loading && brief?.status === 'in_progress' && formStage === 'form' && currentField && (() => {
          const isLastField = currentIndex === allFields.length - 1;
          const progressPct = Math.round(((currentIndex + 1) / allFields.length) * 100);
          const fieldType   = currentField.type ?? 'text';
          const showEnterHint = !['textarea', 'richtext', 'radio'].includes(fieldType);

          return (
            <>
              {/* Barra de progreso fija al tope del viewport */}
              <div style={{
                position:        'fixed',
                top:             0,
                left:            0,
                width:           '100%',
                height:          '3px',
                backgroundColor: '#eaecf0',
                zIndex:          1000,
              }}>
                <div style={{
                  height:          '100%',
                  width:           `${progressPct}%`,
                  backgroundColor: '#7f56d9',
                  transition:      'width 0.4s ease',
                }} />
              </div>

              {/* Layout centrado verticalmente */}
              <div style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                minHeight:      '62vh',
                paddingTop:     '48px',
                paddingBottom:  '64px',
              }}>

                {/* ── Campo animado ──────────────────────────────────────── */}
                <div
                  key={currentField.id}
                  ref={fieldWrapperRef}
                  style={{
                    width:     '100%',
                    maxWidth:  '580px',
                    animation: direction === 'forward'
                      ? 'pbp-slide-up   0.35s cubic-bezier(0.4, 0, 0.2, 1) both'
                      : 'pbp-slide-down 0.35s cubic-bezier(0.4, 0, 0.2, 1) both',
                  }}
                >
                  {/* Sección breadcrumb */}
                  {currentField.sectionTitle && (
                    <p style={{
                      margin:        '0 0 14px',
                      fontSize:      '11px',
                      fontWeight:    700,
                      color:         '#7f56d9',
                      textTransform: 'uppercase',
                      letterSpacing: '0.09em',
                    }}>
                      {currentField.sectionTitle}
                    </p>
                  )}

                  {/* Pregunta principal */}
                  <h2 style={{
                    margin:     '0 0 28px',
                    fontSize:   '26px',
                    fontWeight: 700,
                    color:      '#101828',
                    lineHeight: 1.3,
                  }}>
                    {currentField.label}
                    {currentField.required && (
                      <span style={{ color: '#f04438', marginLeft: '5px', fontSize: '20px', verticalAlign: 'super' }}>
                        *
                      </span>
                    )}
                  </h2>

                  {/* Input del campo — sin label ni asterisco (ya están arriba) */}
                  <FieldRenderer
                    field={{ ...currentField, label: '', required: false }}
                    value={localValues[currentField.id] ?? ''}
                    onChange={(v) => handleFieldChange(currentField.id, v)}
                    onBlur={() => handleFieldBlur(currentField.id)}
                    isDisabled={false}
                  />

                  {/* Hint Enter */}
                  {showEnterHint && (
                    <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#98a2b3' }}>
                      Presiona{' '}
                      <kbd style={{
                        padding:         '1px 6px',
                        borderRadius:    '4px',
                        fontSize:        '11px',
                        fontFamily:      'inherit',
                        backgroundColor: '#f2f4f7',
                        borderWidth:     '1px',
                        borderStyle:     'solid',
                        borderColor:     '#d0d5dd',
                        color:           '#667085',
                      }}>
                        Enter ↵
                      </kbd>
                      {' '}para continuar
                    </p>
                  )}

                  {/* Indicador de auto-guardado */}
                  <div style={{ minHeight: '18px', marginTop: '10px' }}>
                    {autoSave === 'saving' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#667085' }}>
                        <Spinner size={11} /> Guardando…
                      </span>
                    )}
                    {autoSave === 'saved' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#027a48' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                        Guardado
                      </span>
                    )}
                    {autoSave === 'error' && (
                      <span style={{ fontSize: '12px', color: '#b42318' }}>
                        ⚠ No se pudo guardar. Revisa tu conexión.
                      </span>
                    )}
                  </div>

                  {/* Error de validación */}
                  {fieldError && (
                    <div style={{
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'space-between',
                      gap:             '10px',
                      padding:         '10px 14px',
                      marginTop:       '14px',
                      borderRadius:    '8px',
                      backgroundColor: '#fef3f2',
                      borderWidth:     '1px',
                      borderStyle:     'solid',
                      borderColor:     '#fecdca',
                      fontSize:        '13px',
                      color:           '#b42318',
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Este campo es obligatorio.
                      </span>
                      <button
                        type="button"
                        onClick={() => setFieldError(false)}
                        style={{ background: 'none', borderWidth: 0, padding: 0, cursor: 'pointer', color: 'inherit', fontSize: '16px', lineHeight: 1, flexShrink: 0 }}
                        aria-label="Cerrar"
                      >×</button>
                    </div>
                  )}
                </div>

                {/* ── Barra de navegación ────────────────────────────────── */}
                <div style={{
                  width:          '100%',
                  maxWidth:       '580px',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  gap:            '12px',
                  marginTop:      '40px',
                }}>
                  {/* Contador */}
                  <span style={{ fontSize: '12px', color: '#98a2b3', flexShrink: 0 }}>
                    {currentIndex + 1} / {allFields.length}
                  </span>

                  {/* Botones */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Anterior */}
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={currentIndex === 0}
                      style={{
                        display:         'inline-flex',
                        alignItems:      'center',
                        gap:             '5px',
                        padding:         '8px 16px',
                        borderRadius:    '8px',
                        borderWidth:     '1px',
                        borderStyle:     'solid',
                        borderColor:     currentIndex === 0 ? '#eaecf0' : '#d0d5dd',
                        backgroundColor: '#fff',
                        color:           currentIndex === 0 ? '#d0d5dd' : '#344054',
                        fontSize:        '13px',
                        fontWeight:      500,
                        fontFamily:      'inherit',
                        cursor:          currentIndex === 0 ? 'not-allowed' : 'pointer',
                        transition:      'all 0.15s ease',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                      </svg>
                      Anterior
                    </button>

                    {/* Siguiente / Guardar respuestas */}
                    {isLastField ? (
                      <SaveButton
                        onClick={handleLastStepSave}
                        saving={bulkSaving}
                        saved={bulkSaved}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={handleNext}
                        style={{
                          display:         'inline-flex',
                          alignItems:      'center',
                          gap:             '5px',
                          padding:         '8px 18px',
                          borderRadius:    '8px',
                          borderWidth:     '1px',
                          borderStyle:     'solid',
                          borderColor:     '#7f56d9',
                          backgroundColor: '#7f56d9',
                          color:           '#fff',
                          fontSize:        '13px',
                          fontWeight:      600,
                          fontFamily:      'inherit',
                          cursor:          'pointer',
                          boxShadow:       '0px 1px 3px rgba(0,0,0,0.1)',
                          transition:      'all 0.15s ease',
                        }}
                      >
                        Siguiente
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ marginTop: '20px', fontSize: '12px', color: '#c8cdd8', textAlign: 'center' }}>
                  Sus respuestas son confidenciales y solo las verá el equipo del proyecto.
                </p>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

// ─── CenteredMessage ──────────────────────────────────────────────────────────
function CenteredMessage({ icon, title, body }) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '80px 24px',
      gap:            '16px',
      textAlign:      'center',
    }}>
      <span style={{ fontSize: '48px' }}>{icon}</span>
      <div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 700, color: '#101828' }}>
          {title}
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#667085', maxWidth: '380px', lineHeight: 1.6 }}>
          {body}
        </p>
      </div>
    </div>
  );
}
