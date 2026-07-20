import { useState, useEffect } from 'react';
import { fetchPublicGantt } from '../../../lib/supabase/ganttShareSupabase';
import GanttView from '../../tasks/components/GanttView';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  active:    { label: 'Activo',      bg: '#ecfdf3', text: '#027a48', border: '#abefc6' },
  on_hold:   { label: 'En pausa',    bg: '#fffaeb', text: '#b54708', border: '#fedf89' },
  completed: { label: 'Completado',  bg: '#eff8ff', text: '#175cd3', border: '#b2ddff' },
  cancelled: { label: 'Cancelado',   bg: '#fff1f3', text: '#c01048', border: '#fecdd6' },
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 24 }) {
  return (
    <>
      <style>{`@keyframes pgp-spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{
        display:        'inline-block',
        width:          `${size}px`,
        height:         `${size}px`,
        borderRadius:   '50%',
        border:         '2.5px solid #e9d7fe',
        borderTopColor: '#7f56d9',
        animation:      'pgp-spin 0.7s linear infinite',
        flexShrink:     0,
      }} />
    </>
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

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct }) {
  const fill = pct === 100 ? '#17b26a' : '#7f56d9';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        flex:            1,
        height:          '6px',
        borderRadius:    '9999px',
        backgroundColor: '#eaecf0',
        overflow:        'hidden',
        minWidth:        '80px',
      }}>
        <div style={{
          height:          '100%',
          width:           `${pct}%`,
          backgroundColor: fill,
          borderRadius:    '9999px',
          transition:      'width 0.4s ease',
        }} />
      </div>
      <span style={{
        fontSize:   '13px',
        fontWeight: 600,
        color:      pct === 100 ? '#027a48' : '#101828',
        minWidth:   '36px',
      }}>
        {pct}%
      </span>
    </div>
  );
}

// ─── MetaChip ─────────────────────────────────────────────────────────────────
function MetaChip({ icon, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ color: '#98a2b3', fontSize: '13px' }}>{icon}</span>
      <span style={{ fontSize: '13px', color: '#475467' }}>{value}</span>
    </div>
  );
}

// ─── PublicGanttPage ──────────────────────────────────────────────────────────
/**
 * Public read-only Gantt view.
 * Loaded from App.jsx when pathname matches /share/gantt/:token
 *
 * Props:
 *   token  string — extracted from window.location.pathname
 */
export default function PublicGanttPage({ token }) {
  const [data,    setData]    = useState(null);   // { project, tasks }
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPublicGantt(token);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  // Force light background (same pattern as PublicBriefPage)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const prevH = html.style.backgroundColor;
    const prevB = body.style.backgroundColor;
    const prevR = root?.style.backgroundColor ?? '';
    const BG = '#f9fafb';
    html.style.backgroundColor = BG;
    body.style.backgroundColor = BG;
    if (root) root.style.backgroundColor = BG;
    return () => {
      html.style.backgroundColor = prevH;
      body.style.backgroundColor = prevB;
      if (root) root.style.backgroundColor = prevR;
    };
  }, []);

  const project = data?.project ?? null;
  const tasks   = data?.tasks   ?? [];
  const pct     = Math.min(100, Math.max(0, project?.progress ?? 0));
  const status  = STATUS_CFG[project?.status] ?? STATUS_CFG.active;

  const doneCount    = tasks.filter((t) => t.status === 'done').length;
  const totalCount   = tasks.length;
  const updatedAt    = project?.updatedAt ?? project?.createdAt;
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const dueLabel = project?.dueDate
    ? (() => {
        const [y, m, d] = String(project.dueDate).split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      })()
    : null;

  return (
    <div className="pgp-root" style={{ backgroundColor: '#f9fafb', fontFamily: 'inherit' }}>
      <style>{`
        html, body, #root { background-color: #f9fafb !important; }
        .pgp-root {
          min-height: 100vh;
          height: auto !important;
          width: 100%;
          display: flex;
          flex-direction: column;
          background-color: #f9fafb;
        }
        @keyframes pgp-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor:    '#fff',
        borderBottom:       '1px solid #eaecf0',
        padding:            '0 24px',
        height:             '56px',
        display:            'flex',
        alignItems:         'center',
        justifyContent:     'space-between',
        gap:                '12px',
        position:           'sticky',
        top:                0,
        zIndex:             50,
        boxShadow:          '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {/* Logo + project name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width:           '30px',
            height:          '30px',
            borderRadius:    '7px',
            backgroundColor: '#7f56d9',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            flexShrink:      0,
          }}>
            {/* Gantt icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6"  x2="15" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="10" y2="18" />
            </svg>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {loading ? 'Cargando…' : (project?.name ?? 'Cronograma del proyecto')}
          </span>
        </div>

        {/* Badge "Vista pública" */}
        <div style={{
          display:         'inline-flex',
          alignItems:      'center',
          gap:             '5px',
          padding:         '3px 10px',
          borderRadius:    '9999px',
          backgroundColor: '#f4f3ff',
          border:          '1px solid #d9d6fe',
          color:           '#5925dc',
          fontSize:        '11px',
          fontWeight:      600,
          flexShrink:      0,
          letterSpacing:   '0.01em',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Vista pública
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 64px', boxSizing: 'border-box' }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
            <Spinner size={32} />
            <span style={{ fontSize: '15px', color: '#667085' }}>Cargando cronograma…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <CenteredMessage icon="⚠️" title="Error al cargar" body={error} />
        )}

        {/* Not found / disabled */}
        {!loading && !error && !data && (
          <CenteredMessage
            icon="🔒"
            title="Enlace no disponible"
            body="Este enlace no existe o fue desactivado por el responsable del proyecto."
          />
        )}

        {/* Content */}
        {!loading && !error && project && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── Project header card ──────────────────────────────────────── */}
            <div style={{
              background:   'linear-gradient(135deg, #f4ebff 0%, #f9f5ff 45%, #ffffff 100%)',
              border:       '1px solid #eaecf0',
              borderRadius: '16px',
              overflow:     'hidden',
              boxShadow:    '0px 1px 3px rgba(0,0,0,0.1)',
            }}>
              {/* Body */}
              <div style={{ padding: '28px 32px 24px' }}>

                {/* Status + Vista pública badge row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {/* Status badge */}
                  <span style={{
                    padding:         '3px 10px',
                    borderRadius:    '9999px',
                    fontSize:        '12px',
                    fontWeight:      600,
                    backgroundColor: status.bg,
                    color:           status.text,
                    border:          `1px solid ${status.border}`,
                  }}>
                    {status.label}
                  </span>
                  {/* Read-only indicator */}
                  <span style={{
                    padding:         '3px 10px',
                    borderRadius:    '9999px',
                    fontSize:        '12px',
                    fontWeight:      600,
                    backgroundColor: '#f8f9fc',
                    color:           '#667085',
                    border:          '1px solid #eaecf0',
                  }}>
                    Solo lectura
                  </span>
                </div>

                {/* Title */}
                <h1 style={{
                  margin:        '0 0 8px',
                  fontSize:      '26px',
                  fontWeight:    700,
                  color:         '#101828',
                  lineHeight:    1.25,
                  letterSpacing: '-0.02em',
                }}>
                  {project.name}
                </h1>

                {/* Description */}
                {project.description && (
                  <p style={{
                    margin:     '0 0 20px',
                    fontSize:   '14px',
                    color:      '#475467',
                    lineHeight: 1.65,
                    maxWidth:   '640px',
                  }}>
                    {project.description}
                  </p>
                )}

                {/* Progress bar */}
                <div style={{ maxWidth: '340px' }}>
                  <ProgressBar pct={pct} />
                </div>
              </div>

              {/* Footer strip */}
              <div style={{
                display:         'flex',
                alignItems:      'center',
                gap:             '20px',
                flexWrap:        'wrap',
                padding:         '12px 32px',
                backgroundColor: 'rgba(255,255,255,0.65)',
                borderTop:       '1px solid #e9d7fe',
              }}>
                <MetaChip icon="✅" value={`${doneCount} / ${totalCount} tareas`} />
                {dueLabel && (
                  <>
                    <div style={{ width: '1px', height: '16px', backgroundColor: '#e9d7fe' }} />
                    <MetaChip icon="📅" value={`Vence ${dueLabel}`} />
                  </>
                )}
                {updatedLabel && (
                  <>
                    <div style={{ width: '1px', height: '16px', backgroundColor: '#e9d7fe' }} />
                    <MetaChip icon="🕐" value={`Actualizado ${updatedLabel}`} />
                  </>
                )}
              </div>
            </div>

            {/* ── Readonly Gantt ───────────────────────────────────────────── */}
            <div>
              <h2 style={{
                margin:     '0 0 14px',
                fontSize:   '15px',
                fontWeight: 600,
                color:      '#344054',
              }}>
                Cronograma
              </h2>
              <GanttView
                tasks={tasks}
                onEdit={() => {}}
                onNew={() => {}}
                onUpdateDates={() => {}}
                readonly
              />
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
