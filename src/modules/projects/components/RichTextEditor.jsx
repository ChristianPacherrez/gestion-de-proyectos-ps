/**
 * RichTextEditor — wrapper sobre Quill 2.x compatible con React 19.
 *
 * Por qué no react-quill: usa ReactDOM.findDOMNode que fue eliminado en React 19.
 * Este componente gestiona el ciclo de vida de Quill directamente con refs y
 * useEffect, sin ninguna dependencia intermedia que pueda romper con futuras
 * versiones de React.
 *
 * Props:
 *   label       string    — etiqueta del campo (opcional)
 *   value       string    — HTML string ("" | "<p>...</p>")
 *   onChange    fn(html)  — llamado cuando el usuario escribe
 *   onBlur      fn()      — llamado al perder foco (para auto-save)
 *   isDisabled  boolean
 *   isRequired  boolean
 *   placeholder string
 */

import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// ─── Quill toolbar / formats ──────────────────────────────────────────────────
const TOOLBAR_CONFIG = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link'],
  ['clean'],
];
const ALLOWED_FORMATS = ['bold', 'italic', 'underline', 'list', 'link'];

// ─── CSS overrides (injected once into <head>) ────────────────────────────────
const STYLE_ID = 'rte-quill-overrides-v1';

function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID))  return;

  const style = document.createElement('style');
  style.id    = STYLE_ID;
  // We use CSS variables so these adapt to light/dark themes automatically.
  // All selectors are scoped under .rte-wrapper to avoid leaking into other Quill instances.
  style.textContent = `
    /* ── Toolbar ─────────────────────────────────────────────────────────── */
    .rte-wrapper .ql-toolbar.ql-snow {
      border-color:           var(--color-border-primary, #eaecf0);
      border-top-left-radius: var(--radius-md, 6px);
      border-top-right-radius: var(--radius-md, 6px);
      background-color:       var(--color-bg-secondary, #f9fafb);
      padding:                6px 10px;
      font-family:            inherit;
    }

    /* ── Editor container ────────────────────────────────────────────────── */
    .rte-wrapper .ql-container.ql-snow {
      border-color:              var(--color-border-primary, #eaecf0);
      border-bottom-left-radius: var(--radius-md, 6px);
      border-bottom-right-radius: var(--radius-md, 6px);
      font-family:               inherit;
      font-size:                 14px;
      line-height:               1.6;
    }

    /* ── Editor inner content ────────────────────────────────────────────── */
    .rte-wrapper .ql-editor {
      color:   var(--color-text-primary, #101828);
      padding: 10px 12px;
    }

    /* ── Placeholder ─────────────────────────────────────────────────────── */
    .rte-wrapper .ql-editor.ql-blank::before {
      color:      var(--color-text-placeholder, #98a2b3);
      font-style: normal;
      left:       12px;
    }

    /* ── Focus ring (matches Untitled UI Input focus) ────────────────────── */
    .rte-wrapper:focus-within .ql-toolbar.ql-snow,
    .rte-wrapper:focus-within .ql-container.ql-snow {
      border-color: var(--color-brand-300, #d6bbfb);
      outline:      none;
    }

    /* ── Toolbar button active / hover ───────────────────────────────────── */
    .rte-wrapper .ql-snow.ql-toolbar button:hover,
    .rte-wrapper .ql-snow .ql-toolbar button:hover,
    .rte-wrapper .ql-snow.ql-toolbar button.ql-active,
    .rte-wrapper .ql-snow .ql-toolbar button.ql-active {
      color: var(--color-brand-600, #7f56d9);
    }
    .rte-wrapper .ql-snow.ql-toolbar button:hover .ql-stroke,
    .rte-wrapper .ql-snow .ql-toolbar button:hover .ql-stroke,
    .rte-wrapper .ql-snow.ql-toolbar button.ql-active .ql-stroke,
    .rte-wrapper .ql-snow .ql-toolbar button.ql-active .ql-stroke {
      stroke: var(--color-brand-600, #7f56d9);
    }
    .rte-wrapper .ql-snow.ql-toolbar button:hover .ql-fill,
    .rte-wrapper .ql-snow .ql-toolbar button:hover .ql-fill,
    .rte-wrapper .ql-snow.ql-toolbar button.ql-active .ql-fill,
    .rte-wrapper .ql-snow .ql-toolbar button.ql-active .ql-fill {
      fill: var(--color-brand-600, #7f56d9);
    }

    /* ── Disabled state ──────────────────────────────────────────────────── */
    .rte-wrapper.rte-disabled .ql-toolbar.ql-snow {
      opacity:        0.5;
      pointer-events: none;
    }
    .rte-wrapper.rte-disabled .ql-container.ql-snow {
      background-color: var(--color-bg-disabled, #f2f4f7);
    }
    .rte-wrapper.rte-disabled .ql-editor {
      color:  var(--color-text-tertiary, #667085);
      cursor: not-allowed;
    }

    /* ── Content typography ──────────────────────────────────────────────── */
    .rte-wrapper .ql-editor p            { margin: 0 0 4px; }
    .rte-wrapper .ql-editor p:last-child { margin-bottom: 0; }
    .rte-wrapper .ql-editor ul,
    .rte-wrapper .ql-editor ol           { padding-left: 20px; margin: 4px 0; }
    .rte-wrapper .ql-editor a            { color: var(--color-brand-600, #7f56d9); }
  `;

  document.head.appendChild(style);
}

// ─── RichTextEditor ───────────────────────────────────────────────────────────
export default function RichTextEditor({
  label,
  value,
  onChange,
  onBlur,
  isDisabled  = false,
  isRequired  = false,
  placeholder = 'Escribe aquí…',
  minHeight   = 140,
}) {
  const containerRef     = useRef(null); // outer div we fully control
  const quillRef         = useRef(null); // Quill instance
  const lastReportedRef  = useRef('');   // last HTML string we sent to onChange
                                         // used to skip external sync when the
                                         // value didn't really change externally

  ensureStyles();

  // ── Initialize Quill on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    // React 19 Strict Mode runs effects twice. Clear any previous Quill DOM
    // so we always start with a clean slate.
    containerRef.current.innerHTML = '';

    // Create the div Quill will take over
    const editorDiv = document.createElement('div');
    containerRef.current.appendChild(editorDiv);

    const quill = new Quill(editorDiv, {
      theme:    'snow',
      modules:  { toolbar: TOOLBAR_CONFIG },
      formats:  ALLOWED_FORMATS,
      placeholder,
      readOnly: isDisabled,
    });

    quillRef.current = quill;

    // Set initial value (silently — must not fire onChange)
    const initial = value || '';
    if (initial) {
      quill.clipboard.dangerouslyPasteHTML(initial, 'silent');
      lastReportedRef.current = initial;
    }

    // ── text-change: report to parent ──────────────────────────────────────
    quill.on('text-change', (_delta, _old, source) => {
      // 'silent' comes from external (programmatic) updates — ignore
      if (source === 'silent') return;
      const html = quill.getLength() <= 1 ? '' : quill.root.innerHTML;
      lastReportedRef.current = html;
      onChange?.(html);
    });

    // ── blur: trigger auto-save ────────────────────────────────────────────
    quill.root.addEventListener('blur', () => {
      onBlur?.();
    });

    // Cleanup (handles StrictMode double-invoke and component unmount)
    return () => {
      quillRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ intentionally empty: Quill instance is managed entirely through refs.

  // ── Sync external value changes ───────────────────────────────────────────
  // Fires when `value` prop changes (e.g. loaded from DB after mount or reset).
  // Skips update if the change originated from the user typing (prevents cursor jump).
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const incoming = value || '';

    // Value came from our own onChange report — skip (user is typing)
    if (incoming === lastReportedRef.current) return;

    // Already showing the same content — skip
    const curHTML = quill.getLength() <= 1 ? '' : quill.root.innerHTML;
    if (curHTML === incoming) return;

    quill.clipboard.dangerouslyPasteHTML(incoming, 'silent');
    lastReportedRef.current = incoming;
  }, [value]);

  // ── Sync disabled state ───────────────────────────────────────────────────
  useEffect(() => {
    quillRef.current?.enable(!isDisabled);
  }, [isDisabled]);

  // ── Render ────────────────────────────────────────────────────────────────
  const labelBaseStyle = {
    display:      'block',
    fontSize:     '14px',
    fontWeight:   500,
    color:        'var(--color-text-secondary, #475467)',
    marginBottom: '6px',
  };

  return (
    <div>
      {label && (
        <label style={labelBaseStyle}>
          {label}
          {isRequired && (
            <span style={{ color: 'var(--color-fg-error-primary, #f04438)', marginLeft: '3px' }}>
              *
            </span>
          )}
        </label>
      )}

      {/* containerRef is cleared/repopulated by the effect — never render children here */}
      <div
        ref={containerRef}
        className={`rte-wrapper${isDisabled ? ' rte-disabled' : ''}`}
        style={{
          // min-height is applied on the inner .ql-editor via a dynamic style injection
          // below so it respects the prop. We inject it once per instance.
          '--rte-min-height': `${minHeight}px`,
        }}
      />

      {/* Per-instance min-height override (scoped to this render) */}
      <style>{`
        .rte-wrapper .ql-editor { min-height: ${minHeight}px; }
      `}</style>
    </div>
  );
}
