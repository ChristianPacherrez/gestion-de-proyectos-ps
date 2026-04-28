/**
 * DashboardProjectProgress — "Progreso de proyectos".
 *
 * Muestra hasta 5 proyectos activos con sus barras de progreso,
 * estado y fecha de entrega.
 *
 * Props:
 *   projects    Project[]
 *   onSelect    (project) => void
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_META = {
  active:    { label: 'Activo',     color: '#027a48', bg: '#ecfdf3', border: '#a9efc5' },
  paused:    { label: 'Pausado',    color: '#b54708', bg: '#fffaeb', border: '#fedf89' },
  completed: { label: 'Completado', color: '#3538cd', bg: '#eef4ff', border: '#c7d7fd' },
  draft:     { label: 'Borrador',   color: '#344054', bg: '#f2f4f7', border: '#d0d5dd' },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === 'completed') return false;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.draft;
  return (
    <span style={{
      display:         'inline-flex',
      alignItems:      'center',
      padding:         '2px 8px',
      borderRadius:    '9999px',
      fontSize:        '11px',
      fontWeight:      600,
      color:           meta.color,
      backgroundColor: meta.bg,
      borderWidth:     '1px',
      borderStyle:     'solid',
      borderColor:     meta.border,
      whiteSpace:      'nowrap',
      flexShrink:      0,
    }}>
      {meta.label}
    </span>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, status }) {
  const pct = Math.min(100, Math.max(0, value ?? 0));

  const trackColor = '#f2f4f7';
  const fillColor  =
    status === 'completed' ? '#7f56d9' :
    status === 'paused'    ? '#f79009' :
    pct >= 75              ? '#17b26a' :
    pct >= 40              ? '#7f56d9' :
                             '#98a2b3';

  return (
    <div>
      {/* Bar */}
      <div style={{
        position:        'relative',
        height:          '6px',
        borderRadius:    '9999px',
        backgroundColor: trackColor,
        overflow:        'hidden',
      }}>
        <div style={{
          position:        'absolute',
          top: 0, left: 0,
          height:          '100%',
          width:           `${pct}%`,
          borderRadius:    '9999px',
          backgroundColor: fillColor,
          transition:      'width 0.4s ease',
        }} />
      </div>

      {/* Label */}
      <p style={{
        margin:    '4px 0 0',
        fontSize:  '11px',
        color:     'var(--color-text-tertiary, #667085)',
        fontWeight: 500,
      }}>
        {pct}% completado
      </p>
    </div>
  );
}

// ─── ProgressRow ──────────────────────────────────────────────────────────────
function ProgressRow({ project, onSelect, isLast }) {
  const overdue  = isOverdue(project.dueDate, project.status);
  const dateStr  = formatDate(project.dueDate);
  const progress = project.progress ?? 0;

  return (
    <div style={{
      padding:      '16px 20px',
      borderBottom: isLast ? 'none' : '1px solid var(--color-border-tertiary, #f2f4f7)',
    }}>
      {/* Top row: name + badge + "Ver" button */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '12px',
        marginBottom:   '10px',
      }}>
        {/* Name + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <p style={{
            margin:       0,
            fontSize:     '14px',
            fontWeight:   600,
            color:        'var(--color-text-primary, #101828)',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {project.name}
          </p>
          <StatusBadge status={project.status} />
        </div>

        {/* "Ver" button */}
        <button
          type="button"
          onClick={() => onSelect(project)}
          style={{
            display:         'inline-flex',
            alignItems:      'center',
            gap:             '4px',
            padding:         '5px 12px',
            borderRadius:    '6px',
            borderWidth:     '1px',
            borderStyle:     'solid',
            borderColor:     'var(--color-border-primary, #eaecf0)',
            backgroundColor: '#fff',
            color:           'var(--color-text-secondary, #344054)',
            fontSize:        '12px',
            fontWeight:      500,
            fontFamily:      'inherit',
            cursor:          'pointer',
            flexShrink:      0,
            transition:      'all 0.12s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#d6bbfb';
            e.currentTarget.style.color       = '#6941c6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-primary, #eaecf0)';
            e.currentTarget.style.color       = 'var(--color-text-secondary, #344054)';
          }}
        >
          Ver
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar value={progress} status={project.status} />

      {/* Due date */}
      {dateStr && (
        <p style={{
          margin:    '6px 0 0',
          fontSize:  '11px',
          fontWeight: 500,
          color:      overdue ? '#b42318' : 'var(--color-text-tertiary, #667085)',
        }}>
          {overdue ? '⚠ Venció el ' : 'Entrega: '}{dateStr}
        </p>
      )}
    </div>
  );
}

// ─── EmptyProgress ────────────────────────────────────────────────────────────
function EmptyProgress() {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '40px 24px',
      gap:            '10px',
      textAlign:      'center',
    }}>
      <span style={{ fontSize: '32px', lineHeight: 1 }}>📂</span>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary, #101828)' }}>
        Sin proyectos activos
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-tertiary, #667085)' }}>
        Crea un nuevo proyecto para comenzar a hacer seguimiento.
      </p>
    </div>
  );
}

// ─── DashboardProjectProgress ─────────────────────────────────────────────────
export default function DashboardProjectProgress({ projects, onSelect }) {
  // Show active projects first (by progress desc), then others, max 5
  const items = [...projects]
    .sort((a, b) => {
      // Active first
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return  1;
      // Then by progress descending (most progressed first, more interesting)
      return (b.progress ?? 0) - (a.progress ?? 0);
    })
    .slice(0, 5);

  return (
    <section>
      {/* Section header */}
      <div style={{ marginBottom: '12px' }}>
        <h2 style={{
          margin:     0,
          fontSize:   '16px',
          fontWeight: 600,
          color:      'var(--color-text-primary, #101828)',
        }}>
          Progreso de proyectos
        </h2>
      </div>

      {/* Card */}
      <div style={{
        backgroundColor: '#fff',
        borderWidth:     '1px',
        borderStyle:     'solid',
        borderColor:     'var(--color-border-primary, #eaecf0)',
        borderRadius:    '16px',
        overflow:        'hidden',
        boxShadow:       '0px 1px 3px rgba(0,0,0,0.05)',
      }}>
        {items.length === 0 ? (
          <EmptyProgress />
        ) : (
          items.map((project, idx) => (
            <ProgressRow
              key={project.id}
              project={project}
              onSelect={onSelect}
              isLast={idx === items.length - 1}
            />
          ))
        )}
      </div>
    </section>
  );
}
