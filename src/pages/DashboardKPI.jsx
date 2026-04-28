/**
 * DashboardKPI — 4 cards de métricas clave.
 *
 * Props:
 *   total       number
 *   active      number
 *   paused      number
 *   completed   number
 */

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconFolders({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9"  y1="14" x2="15" y2="14" />
    </svg>
  );
}

function IconPlay({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill={color} stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function IconPause({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="10" y1="15" x2="10" y2="9" />
      <line x1="14" y1="15" x2="14" y2="9" />
    </svg>
  );
}

function IconCheck({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, accent, bg, sub }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderWidth:     '1px',
      borderStyle:     'solid',
      borderColor:     'var(--color-border-primary, #eaecf0)',
      borderRadius:    '16px',
      padding:         '20px 24px',
      display:         'flex',
      flexDirection:   'column',
      gap:             '14px',
      boxShadow:       '0px 1px 3px rgba(0,0,0,0.05)',
      position:        'relative',
      overflow:        'hidden',
    }}>
      {/* Accent strip */}
      <div style={{
        position:        'absolute',
        top:             0, left: 0,
        width:           '4px',
        height:          '100%',
        backgroundColor: accent,
        borderRadius:    '16px 0 0 16px',
      }} />

      {/* Icon badge */}
      <div style={{
        width:           '40px',
        height:          '40px',
        borderRadius:    '10px',
        backgroundColor: bg,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        flexShrink:      0,
      }}>
        <Icon color={accent} />
      </div>

      {/* Number + label */}
      <div>
        <p style={{
          margin:      0,
          fontSize:    '32px',
          fontWeight:  700,
          color:       'var(--color-text-primary, #101828)',
          lineHeight:  1,
          letterSpacing: '-0.02em',
        }}>
          {value}
        </p>
        <p style={{
          margin:    '4px 0 0',
          fontSize:  '14px',
          fontWeight: 500,
          color:     'var(--color-text-secondary, #475467)',
        }}>
          {label}
        </p>
        {sub && (
          <p style={{
            margin:   '2px 0 0',
            fontSize: '12px',
            color:    'var(--color-text-tertiary, #667085)',
          }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── DashboardKPI ─────────────────────────────────────────────────────────────
export default function DashboardKPI({ total, active, paused, completed }) {
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const cards = [
    {
      icon:   IconFolders,
      label:  'Total proyectos',
      value:  total,
      accent: '#7f56d9',
      bg:     '#f9f5ff',
      sub:    active > 0 ? `${active} en curso ahora` : 'Sin proyectos activos',
    },
    {
      icon:   IconPlay,
      label:  'Activos',
      value:  active,
      accent: '#17b26a',
      bg:     '#ecfdf3',
      sub:    active === 1 ? '1 proyecto en marcha' : active > 1 ? `${active} proyectos en marcha` : 'Ninguno activo',
    },
    {
      icon:   IconPause,
      label:  'Pausados',
      value:  paused,
      accent: '#f79009',
      bg:     '#fffaeb',
      sub:    paused > 0 ? 'Pendientes de reactivar' : 'Sin proyectos pausados',
    },
    {
      icon:   IconCheck,
      label:  'Completados',
      value:  completed,
      accent: '#9e77ed',
      bg:     '#f4f3ff',
      sub:    total > 0 ? `${completionRate}% tasa de completado` : '—',
    },
  ];

  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap:                 '16px',
    }}>
      {cards.map((c) => <KpiCard key={c.label} {...c} />)}
    </div>
  );
}
