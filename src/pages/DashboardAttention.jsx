/**
 * DashboardAttention — "Requieren tu atención".
 *
 * Detecta proyectos problemáticos usando solo datos disponibles en el
 * objeto proyecto (sin llamadas extra a Supabase):
 *
 *   1. Fecha vencida    — dueDate < hoy  AND  status !== 'completed'
 *   2. Sin iniciar      — status === 'active'  AND  progress === 0
 *   3. Pausados         — status === 'paused'
 *
 * Props:
 *   projects    Project[]
 *   onSelect    (project) => void
 */

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// ─── Classify a project ───────────────────────────────────────────────────────
function getIssues(project) {
  const issues = [];

  if (
    project.dueDate &&
    project.status !== 'completed' &&
    new Date(project.dueDate) < TODAY
  ) {
    issues.push({ type: 'overdue', label: 'Fecha vencida', color: '#b42318', bg: '#fef3f2', border: '#fecdca' });
  }

  if (project.status === 'active' && (project.progress ?? 0) === 0) {
    issues.push({ type: 'not_started', label: 'Sin progreso', color: '#b54708', bg: '#fffaeb', border: '#fedf89' });
  }

  if (project.status === 'paused') {
    issues.push({ type: 'paused', label: 'Pausado', color: '#344054', bg: '#f2f4f7', border: '#d0d5dd' });
  }

  return issues;
}

// ─── IssuePill ────────────────────────────────────────────────────────────────
function IssuePill({ label, color, bg, border }) {
  return (
    <span style={{
      display:         'inline-flex',
      alignItems:      'center',
      padding:         '2px 8px',
      borderRadius:    '9999px',
      fontSize:        '11px',
      fontWeight:      600,
      color,
      backgroundColor: bg,
      borderWidth:     '1px',
      borderStyle:     'solid',
      borderColor:     border,
      whiteSpace:      'nowrap',
    }}>
      {label}
    </span>
  );
}

// ─── AttentionRow ─────────────────────────────────────────────────────────────
function AttentionRow({ project, issues, onSelect, isLast }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      gap:            '12px',
      padding:        '14px 20px',
      borderBottom:   isLast ? 'none' : '1px solid var(--color-border-tertiary, #f2f4f7)',
    }}>
      {/* Left: name + issues */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
        {/* Alert dot */}
        <div style={{
          width:           '8px',
          height:          '8px',
          borderRadius:    '50%',
          backgroundColor: issues[0]?.color ?? '#667085',
          flexShrink:      0,
        }} />

        <div style={{ minWidth: 0 }}>
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

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
            {issues.map((issue) => (
              <IssuePill key={issue.type} {...issue} />
            ))}
          </div>
        </div>
      </div>

      {/* Right: "Ver" button */}
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
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyAttention() {
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
      <span style={{ fontSize: '32px', lineHeight: 1 }}>🎉</span>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary, #101828)' }}>
        Todo está al día
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-tertiary, #667085)' }}>
        No hay proyectos que requieran atención inmediata.
      </p>
    </div>
  );
}

// ─── DashboardAttention ───────────────────────────────────────────────────────
export default function DashboardAttention({ projects, onSelect }) {
  // Build list: projects that have at least one issue, sorted by severity
  const items = projects
    .map((p) => ({ project: p, issues: getIssues(p) }))
    .filter(({ issues }) => issues.length > 0)
    // Overdue first, then not-started, then paused
    .sort((a, b) => {
      const rank = (issues) =>
        issues.some((i) => i.type === 'overdue')      ? 0 :
        issues.some((i) => i.type === 'not_started')  ? 1 : 2;
      return rank(a.issues) - rank(b.issues);
    })
    .slice(0, 5);

  return (
    <section>
      {/* Section header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginBottom:   '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary, #101828)' }}>
            Requieren tu atención
          </h2>
          {items.length > 0 && (
            <span style={{
              display:         'inline-flex',
              alignItems:      'center',
              justifyContent:  'center',
              minWidth:        '20px',
              height:          '20px',
              padding:         '0 6px',
              borderRadius:    '9999px',
              backgroundColor: '#fef3f2',
              borderWidth:     '1px',
              borderStyle:     'solid',
              borderColor:     '#fecdca',
              fontSize:        '11px',
              fontWeight:      700,
              color:           '#b42318',
            }}>
              {items.length}
            </span>
          )}
        </div>
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
          <EmptyAttention />
        ) : (
          items.map(({ project, issues }, idx) => (
            <AttentionRow
              key={project.id}
              project={project}
              issues={issues}
              onSelect={onSelect}
              isLast={idx === items.length - 1}
            />
          ))
        )}
      </div>
    </section>
  );
}
