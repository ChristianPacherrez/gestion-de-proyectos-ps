/**
 * BriefReadView — vista de lectura del Brief, estilo documento Notion.
 *
 * Características:
 *   • Vista de documento con cards por sección y tipografía del design system
 *   • Modo presentación: overlay full-screen, ESC para salir
 *   • Exportación a PDF vía html2pdf.js (carga dinámica)
 *
 * Reutilizable en:
 *   • PublicBriefPage  (brief completado, vista del cliente)
 *   • PublicBriefPage  (in_progress → "Ver resumen" tras celebración)
 *   • ProjectBrief     (owner, modo lectura del brief completado)
 *
 * Props:
 *   brief       object    — brief en formato app (templateJson, responsesJson,
 *                           status, welcomeTitle …)
 *   responses   object?   — { [fieldId]: value } — default brief.responsesJson
 *   onBack      fn?       — handler del botón "Volver"
 *   backLabel   string?   — etiqueta botón Volver (default "Volver")
 *   actions     ReactNode?— botones adicionales en la action bar
 *                           (ej. "Reabrir brief" en la vista del owner)
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Badge }  from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  textPrimary:    'var(--color-text-primary,    #101828)',
  textSecondary:  'var(--color-text-secondary,  #475467)',
  textTertiary:   'var(--color-text-tertiary,   #667085)',
  textQuaternary: 'var(--color-text-quaternary, #98a2b3)',
  textEmpty:      '#d0d5dd',
  bgPrimary:      'var(--color-bg-primary,      #fff)',
  bgSecondary:    'var(--color-bg-secondary,    #f9fafb)',
  border:         'var(--color-border-primary,  #eaecf0)',
  borderSub:      'var(--color-border-tertiary, #f2f4f7)',
  brand:          'var(--color-brand-600,       #7f56d9)',
  radiusXl:       'var(--radius-xl,   12px)',
  shadowXs:       'var(--shadow-xs,   0px 1px 2px rgba(0,0,0,0.05))',
};

const STATUS_LABEL = {
  draft:       'Borrador',
  in_progress: 'En progreso',
  completed:   'Completado',
  closed:      'Cerrado',
};
const STATUS_COLOR = {
  draft:       'gray',
  in_progress: 'blue',
  completed:   'success',
  closed:      'gray',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5"  y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function PresentIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8"  y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function ExitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  );
}

// ─── renderFieldValue — lógica compartida ─────────────────────────────────────
/**
 * Devuelve el nodo React para el valor de un campo,
 * adaptado al tipo (richtext, radio, date, texto).
 */
function renderFieldValue(field, value, { valueSt, emptySt }) {
  const hasValue = value !== undefined && value !== null && String(value).trim() !== '';

  if (!hasValue) return <span style={emptySt}>—</span>;

  switch (field.type) {
    case 'richtext':
      return (
        <div
          dangerouslySetInnerHTML={{ __html: value }}
          style={{ ...valueSt, fontSize: String(valueSt.fontSize ?? '14px') }}
        />
      );

    case 'radio': {
      const opts     = field.options ?? [];
      const selected = opts.find((o) => o.value === value);
      const label    = selected?.label || String(value);
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', ...valueSt }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            backgroundColor: '#7f56d9', flexShrink: 0, display: 'inline-block',
          }} />
          {label}
        </span>
      );
    }

    case 'date': {
      let formatted;
      try {
        formatted = new Date(value).toLocaleDateString('es-ES', {
          day: '2-digit', month: 'long', year: 'numeric',
        });
      } catch {
        formatted = String(value);
      }
      return <span style={valueSt}>{formatted}</span>;
    }

    default:
      return <span style={{ ...valueSt, whiteSpace: 'pre-wrap' }}>{String(value)}</span>;
  }
}

// ─── FieldRow — vista documento normal ───────────────────────────────────────
function FieldRow({ field, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{
        display:       'block',
        fontSize:      '11px',
        fontWeight:    700,
        color:         T.textQuaternary,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {field.label}
        {field.required && <span style={{ color: '#f04438', marginLeft: '3px' }}>*</span>}
      </span>
      {renderFieldValue(field, value, {
        valueSt: { fontSize: '14px', color: T.textPrimary,   lineHeight: 1.7 },
        emptySt: { fontSize: '14px', color: T.textEmpty, fontStyle: 'italic' },
      })}
    </div>
  );
}

// ─── SectionBlock — carta de documento ───────────────────────────────────────
function SectionBlock({ section, responses }) {
  const fields = section.fields ?? [];
  if (fields.length === 0) return null;

  return (
    <div style={{
      backgroundColor: T.bgPrimary,
      borderWidth:     '1px',
      borderStyle:     'solid',
      borderColor:     T.border,
      borderRadius:    T.radiusXl,
      overflow:        'hidden',
      boxShadow:       T.shadowXs,
    }}>
      {/* Section header */}
      <div style={{
        padding:           '12px 24px',
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: T.borderSub,
        backgroundColor:   T.bgSecondary,
        display:           'flex',
        alignItems:        'center',
        gap:               '10px',
      }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          backgroundColor: T.brand, flexShrink: 0, display: 'inline-block', opacity: 0.5,
        }} />
        <h3 style={{
          margin:        0,
          fontSize:      '12px',
          fontWeight:    700,
          color:         T.textTertiary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {section.title}
        </h3>
      </div>

      {/* Fields with thin dividers between them */}
      <div>
        {fields.map((field, idx) => (
          <div key={field.id}>
            <div style={{ padding: '16px 24px' }}>
              <FieldRow field={field} value={responses?.[field.id]} />
            </div>
            {idx < fields.length - 1 && (
              <div style={{
                height:          '1px',
                backgroundColor: T.borderSub,
                marginLeft:      '24px',
                marginRight:     '24px',
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PresentationFieldRow — tipografía de presentación ───────────────────────
function PresentationFieldRow({ field, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{
        fontSize:      '11px',
        fontWeight:    700,
        color:         '#98a2b3',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
      }}>
        {field.label}
      </span>
      {renderFieldValue(field, value, {
        valueSt: { fontSize: '17px', color: '#101828', lineHeight: 1.65 },
        emptySt: { fontSize: '16px', color: '#d0d5dd', fontStyle: 'italic' },
      })}
    </div>
  );
}

// ─── PresentationSectionBlock — sección en modo presentación ─────────────────
function PresentationSectionBlock({ section, responses }) {
  const fields = section.fields ?? [];
  if (fields.length === 0) return null;

  return (
    <div>
      {/* Horizontal rule + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{
          width: '28px', height: '2px', borderRadius: '9999px',
          backgroundColor: '#7f56d9', flexShrink: 0,
        }} />
        <h2 style={{
          margin:        0,
          fontSize:      '12px',
          fontWeight:    700,
          color:         '#7f56d9',
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          whiteSpace:    'nowrap',
        }}>
          {section.title}
        </h2>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#f2f4f7' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {fields.map((field) => (
          <PresentationFieldRow
            key={field.id}
            field={field}
            value={responses?.[field.id]}
          />
        ))}
      </div>
    </div>
  );
}

// ─── BriefReadView ────────────────────────────────────────────────────────────
export default function BriefReadView({
  brief,
  responses,
  onBack,
  backLabel = 'Volver',
  actions,
}) {
  const [isPresentation, setIsPresentation] = useState(false);
  const [exporting,      setExporting]      = useState(false);
  // pdfRef: secciones + tarjeta de título oculta que se muestra sólo durante la captura PDF.
  // Los botones de acción viven en el sticky header → no aparecen en el PDF.
  const pdfRef      = useRef(null);
  const pdfTitleRef = useRef(null); // ref a la tarjeta de título oculta en pantalla

  const sections    = brief?.templateJson?.sections ?? [];
  const data        = responses ?? brief?.responsesJson ?? {};
  const totalFields = sections.reduce((n, s) => n + (s.fields?.length ?? 0), 0);

  // ── ESC para salir del modo presentación ──────────────────────────────────
  useEffect(() => {
    if (!isPresentation) return;
    function onKey(e) { if (e.key === 'Escape') setIsPresentation(false); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPresentation]);

  // ── Bloquear scroll del body en presentación ──────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isPresentation ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isPresentation]);

  // ── Exportar a PDF ────────────────────────────────────────────────────────
  async function exportToPDF() {
    if (!pdfRef.current || exporting || !brief) return;
    setExporting(true);

    // Mostrar temporalmente la tarjeta de título que está oculta en pantalla
    const titleEl = pdfTitleRef.current;
    if (titleEl) titleEl.style.display = 'block';

    try {
      const { default: html2pdf } = await import('html2pdf.js');
      const filename = `brief-${(brief.welcomeTitle || 'resumen')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}.pdf`;

      await html2pdf()
        .set({
          margin:      [12, 14, 12, 14],
          filename,
          html2canvas: {
            scale:           2,
            useCORS:         true,
            backgroundColor: '#ffffff',
            logging:         false,
          },
          jsPDF:     { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css'] },
        })
        .from(pdfRef.current)
        .save();
    } catch (err) {
      console.error('[BriefReadView] exportToPDF ❌', err);
    } finally {
      // Restaurar: volver a ocultar la tarjeta de título en pantalla
      if (titleEl) titleEl.style.display = 'none';
      setExporting(false);
    }
  }

  if (!brief) return null;

  // ── Overlay de presentación (portal → body, bypasa cualquier transform padre) ──
  const presentationOverlay = isPresentation
    ? createPortal(
        <div style={{
          position:        'fixed',
          top:             0, right: 0, bottom: 0, left: 0,
          zIndex:          9999,
          backgroundColor: '#ffffff',
          overflowY:       'auto',
        }}>
          {/* Barra superior sticky */}
          <div style={{
            position:            'sticky',
            top:                 0,
            zIndex:              10000,
            backgroundColor:     'rgba(255,255,255,0.92)',
            backdropFilter:      'blur(8px)',
            WebkitBackdropFilter:'blur(8px)',
            borderBottomWidth:   '1px',
            borderBottomStyle:   'solid',
            borderBottomColor:   '#f2f4f7',
            padding:             '12px 32px',
            display:             'flex',
            alignItems:          'center',
            justifyContent:      'space-between',
            gap:                 '16px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#475467' }}>
              {brief.welcomeTitle || 'Resumen del brief'}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Badge
                color={STATUS_COLOR[brief.status] ?? 'gray'}
                type="badge-modern"
                size="sm"
                dot
              >
                {STATUS_LABEL[brief.status] ?? brief.status}
              </Badge>

              <Button
                color="secondary"
                size="sm"
                onClick={() => setIsPresentation(false)}
                iconLeading={ExitIcon}
              >
                Salir{' '}
                <kbd style={{
                  marginLeft:      '4px',
                  padding:         '1px 5px',
                  fontSize:        '10px',
                  fontFamily:      'inherit',
                  backgroundColor: '#f2f4f7',
                  borderWidth:     '1px',
                  borderStyle:     'solid',
                  borderColor:     '#d0d5dd',
                  borderRadius:    '4px',
                  color:           '#667085',
                }}>ESC</kbd>
              </Button>
            </div>
          </div>

          {/* Contenido centrado */}
          <div style={{
            maxWidth: '760px',
            margin:   '0 auto',
            padding:  '72px 48px 96px',
          }}>
            {/* Título centrado */}
            <div style={{ marginBottom: '72px', textAlign: 'center' }}>
              <h1 style={{
                margin:        '0 0 16px',
                fontSize:      '38px',
                fontWeight:    700,
                color:         '#101828',
                lineHeight:    1.2,
                letterSpacing: '-0.02em',
              }}>
                {brief.welcomeTitle || 'Resumen del brief'}
              </h1>
              <p style={{ margin: '0 0 20px', fontSize: '15px', color: '#667085', lineHeight: 1.6 }}>
                {sections.length} {sections.length === 1 ? 'sección' : 'secciones'}
                {' · '}
                {totalFields} {totalFields === 1 ? 'campo' : 'campos'}
              </p>
              <Badge
                color={STATUS_COLOR[brief.status] ?? 'gray'}
                type="badge-modern"
                size="md"
                dot
              >
                {STATUS_LABEL[brief.status] ?? brief.status}
              </Badge>
            </div>

            {/* Secciones con tipografía grande */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
              {sections.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#98a2b3', fontSize: '15px' }}>
                  La plantilla no tiene secciones.
                </p>
              ) : (
                sections.map((section, idx) => (
                  <PresentationSectionBlock
                    key={section.title ?? idx}
                    section={section}
                    responses={data}
                  />
                ))
              )}
            </div>

            {/* Hint ESC */}
            <p style={{ marginTop: '80px', textAlign: 'center', fontSize: '12px', color: '#d0d5dd' }}>
              Presiona{' '}
              <kbd style={{
                padding:         '1px 5px',
                fontSize:        '11px',
                fontFamily:      'inherit',
                backgroundColor: '#f9fafb',
                borderWidth:     '1px',
                borderStyle:     'solid',
                borderColor:     '#eaecf0',
                borderRadius:    '4px',
                color:           '#98a2b3',
              }}>ESC</kbd>{' '}
              para salir del modo presentación
            </p>
          </div>
        </div>,
        document.body
      )
    : null;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ── VISTA NORMAL (siempre renderizada) ───────────────────────────────────
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Estructura en dos bloques:
  //   1. Header sticky  — título + badge + botones (excluido del PDF vía data-html2canvas-ignore)
  //   2. pdfRef div     — secciones en flujo normal (capturado en PDF)
  return (
    <>
      {/* Portal de presentación — montado sobre document.body para escapar
          cualquier contexto de transform (pbp-fade-scale, etc.) */}
      {presentationOverlay}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Header principal: título + badge + acciones ──────────────────── */}
        {/* Único elemento sticky. Fondo transparente → hereda el bg de la página,
            sin generar fondo blanco flotante ni sombra sobre el contenido. */}
        <div
          data-html2canvas-ignore="true"
          style={{
            position:            'sticky',
            top:                 0,
            zIndex:              40,
            backgroundColor:     'rgba(249,250,251,0.82)',
            backdropFilter:      'blur(10px)',
            WebkitBackdropFilter:'blur(10px)',
            borderBottomWidth:   '1px',
            borderBottomStyle:   'solid',
            borderBottomColor:   T.border,
            paddingTop:          '12px',
            paddingBottom:       '12px',
          }}
        >
          {/* Fila 1: título + badge */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            flexWrap:       'wrap',
            gap:            '10px',
            marginBottom:   '10px',
          }}>
            <div>
              <h1 style={{
                margin:     0,
                fontSize:   '20px',
                fontWeight: 700,
                color:      T.textPrimary,
                lineHeight: 1.3,
              }}>
                {brief.welcomeTitle || 'Resumen del brief'}
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: T.textTertiary }}>
                {sections.length} {sections.length === 1 ? 'sección' : 'secciones'}
                {' · '}
                {totalFields} {totalFields === 1 ? 'campo' : 'campos'}
              </p>
            </div>

            <Badge
              color={STATUS_COLOR[brief.status] ?? 'gray'}
              type="badge-modern"
              size="sm"
              dot
            >
              {STATUS_LABEL[brief.status] ?? brief.status}
            </Badge>
          </div>

          {/* Fila 2: botones de acción */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {actions}

            <Button
              color="secondary"
              size="sm"
              onClick={() => setIsPresentation(true)}
              iconLeading={PresentIcon}
            >
              Presentar
            </Button>

            <Button
              color="secondary"
              size="sm"
              onClick={exportToPDF}
              isDisabled={exporting}
              isLoading={exporting}
              iconLeading={exporting ? undefined : DownloadIcon}
            >
              {exporting ? 'Exportando…' : 'Descargar PDF'}
            </Button>

            {onBack && (
              <Button
                color="secondary"
                size="sm"
                onClick={onBack}
                iconLeading={BackIcon}
              >
                {backLabel}
              </Button>
            )}
          </div>
        </div>

        {/* ── Secciones en flujo normal (capturadas en PDF) ──────────────────── */}
        <div
          ref={pdfRef}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {/* Cabecera de documento — oculta en pantalla (el sticky header ya muestra
              el título), se muestra temporalmente durante la exportación a PDF. */}
          <div
            ref={pdfTitleRef}
            aria-hidden="true"
            style={{
              display:         'none',
              backgroundColor: T.bgPrimary,
              borderWidth:     '1px',
              borderStyle:     'solid',
              borderColor:     T.border,
              borderRadius:    T.radiusXl,
              padding:         '20px 24px',
              boxShadow:       T.shadowXs,
            }}
          >
            <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 700, color: T.textPrimary, lineHeight: 1.3 }}>
              {brief.welcomeTitle || 'Resumen del brief'}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: T.textTertiary }}>
              {sections.length} {sections.length === 1 ? 'sección' : 'secciones'}
              {' · '}
              {totalFields} {totalFields === 1 ? 'campo' : 'campos'}
            </p>
          </div>

          {sections.length === 0 ? (
            <div style={{
              padding: '48px 24px', textAlign: 'center',
              fontSize: '14px', color: T.textTertiary,
            }}>
              La plantilla no tiene secciones.
            </div>
          ) : (
            sections.map((section, idx) => (
              <SectionBlock
                key={section.title ?? idx}
                section={section}
                responses={data}
              />
            ))
          )}
        </div>

      </div>
    </>
  );
}
