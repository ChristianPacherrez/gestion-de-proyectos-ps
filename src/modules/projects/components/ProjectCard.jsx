import { useState } from 'react';
import { ProjectStatusBadge } from '../../../components/ui/Badge';

// ─── Icons (inline SVG — no external dep required) ────────────────────────────
function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CheckSquareIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
function ProgressBar({ value }) {
  const pct       = Math.min(100, Math.max(0, value ?? 0));
  const fillColor = pct === 100
    ? 'var(--color-bg-success-solid, #17b26a)'
    : 'var(--color-bg-brand-solid, #7f56d9)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Label row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize:   '12px',
          fontWeight: 500,
          color:      'var(--color-text-tertiary, #667085)',
        }}>
          Progreso
        </span>
        <span style={{
          fontSize:   '12px',
          fontWeight: 600,
          color:      pct === 100
            ? 'var(--color-text-success-primary, #027a48)'
            : 'var(--color-text-primary, #101828)',
        }}>
          {pct}%
        </span>
      </div>

      {/* Track */}
      <div style={{
        height:          '6px',
        borderRadius:    'var(--radius-full, 9999px)',
        backgroundColor: 'var(--color-bg-quaternary, #eaecf0)',
        overflow:        'hidden',
      }}>
        <div style={{
          height:          '100%',
          width:           `${pct}%`,
          borderRadius:    'var(--radius-full, 9999px)',
          backgroundColor: fillColor,
          transition:      'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

// ─── OwnerAvatar ──────────────────────────────────────────────────────────────
function OwnerAvatar({ initials }) {
  if (!initials) return null;
  return (
    <div style={{
      width:           '28px',
      height:          '28px',
      borderRadius:    '50%',
      backgroundColor: 'var(--color-brand-100, #f4ebff)',
      color:           'var(--color-text-brand-primary, #6941c6)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      fontSize:        '11px',
      fontWeight:      600,
      flexShrink:      0,
      // Specific border props only — never mix with `border` shorthand
      borderWidth:     '1.5px',
      borderStyle:     'solid',
      borderColor:     'var(--color-brand-200, #e9d7fe)',
    }}>
      {initials}
    </div>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────
function ActionButton({ onClick, title, danger = false, children }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           '28px',
        height:          '28px',
        borderRadius:    'var(--radius-md, 6px)',
        // Specific border props only
        borderWidth:     '1px',
        borderStyle:     'solid',
        borderColor:     hovered
          ? (danger ? '#fca5a5' : 'var(--color-border-secondary, #d0d5dd)')
          : 'var(--color-border-primary, #eaecf0)',
        backgroundColor: hovered
          ? (danger ? 'var(--color-bg-error-secondary, #fff1f0)' : 'var(--color-bg-secondary, #f9fafb)')
          : 'var(--color-bg-primary, #fff)',
        color:           danger
          ? 'var(--color-fg-error-primary, #f04438)'
          : (hovered ? 'var(--color-fg-secondary, #475467)' : 'var(--color-fg-tertiary, #667085)'),
        cursor:          'pointer',
        transition:      'background-color 0.12s ease, border-color 0.12s ease, color 0.12s ease',
        flexShrink:      0,
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   project   — project data object
 *   onSelect  — called with the project when the card body is clicked → navigate to detail
 *   onEdit    — called with the project when edit button is clicked
 *   onDelete  — called with project.id when delete is confirmed
 */
export default function ProjectCard({ project, onSelect, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);

  const {
    name, description, status, dueDate,
    progress, ownerInitials, tasksDone, tasksTotal,
  } = project;

  // Parse YYYY-MM-DD as local time (avoids UTC-offset day shift)
  const formattedDate = (() => {
    if (!dueDate) return null;
    const parts = String(dueDate).split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    }
    return new Date(dueDate).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  })();

  function handleDelete(e) {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar el proyecto "${name}"? Esta acción no se puede deshacer.`)) {
      onDelete(project.id);
    }
  }

  function handleEdit(e) {
    e.stopPropagation();
    onEdit(project);
  }

  function handleSelect() {
    if (onSelect) onSelect(project);
  }

  const isClickable = Boolean(onSelect);

  return (
    <article
      onClick={handleSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: 'var(--color-bg-primary, #fff)',
        // Specific border props only — never mix with `border` shorthand
        borderWidth:     '1px',
        borderStyle:     'solid',
        borderColor:     hovered
          ? 'var(--color-border-secondary, #d0d5dd)'
          : 'var(--color-border-primary, #eaecf0)',
        borderRadius:    'var(--radius-2xl, 16px)',
        padding:         '20px',
        display:         'flex',
        flexDirection:   'column',
        gap:             '16px',
        boxShadow:       hovered
          ? 'var(--shadow-md, 0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.06))'
          : 'var(--shadow-xs, 0px 1px 2px rgba(0,0,0,0.05))',
        cursor:          isClickable ? 'pointer' : 'default',
        transform:       hovered && isClickable ? 'translateY(-2px)' : 'translateY(0)',
        transition:      'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
      }}
    >
      {/* ── Row 1: Status badge + action buttons ──────────────────────────── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        gap:            '8px',
      }}>
        <ProjectStatusBadge status={status} size="sm" />

        {(onEdit || onDelete) && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'flex', gap: '6px' }}
          >
            {onEdit   && (
              <ActionButton onClick={handleEdit}   title="Editar proyecto">
                <PencilIcon />
              </ActionButton>
            )}
            {onDelete && (
              <ActionButton onClick={handleDelete} title="Eliminar proyecto" danger>
                <TrashIcon />
              </ActionButton>
            )}
          </div>
        )}
      </div>

      {/* ── Row 2: Title + description ────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{
          margin:     0,
          fontSize:   '15px',
          fontWeight: 600,
          color:      'var(--color-text-primary, #101828)',
          lineHeight: '1.4',
        }}>
          {name}
        </h3>

        <p style={{
          margin:              0,
          fontSize:            '13px',
          color:               'var(--color-text-tertiary, #667085)',
          lineHeight:          '1.5',
          display:             '-webkit-box',
          WebkitLineClamp:     2,
          WebkitBoxOrient:     'vertical',
          overflow:            'hidden',
          // Reserve space for 2 lines so cards align in the grid
          minHeight:           '39px',
        }}>
          {description || (
            <span style={{ fontStyle: 'italic', opacity: 0.45 }}>Sin descripción</span>
          )}
        </p>
      </div>

      {/* ── Row 3: Progress bar ───────────────────────────────────────────── */}
      <ProgressBar value={progress} />

      {/* ── Row 4: Footer meta ────────────────────────────────────────────── */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '8px',
        paddingTop: '12px',
        // Specific border props only
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: 'var(--color-border-tertiary, #f2f4f7)',
      }}>
        <OwnerAvatar initials={ownerInitials} />

        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '10px',
          flex:       1,
          flexWrap:   'wrap',
        }}>
          {formattedDate && (
            <span style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '4px',
              fontSize:   '12px',
              color:      'var(--color-text-quaternary, #98a2b3)',
            }}>
              <CalendarIcon />
              {formattedDate}
            </span>
          )}

          {tasksTotal != null && (
            <span style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '4px',
              fontSize:   '12px',
              color:      'var(--color-text-quaternary, #98a2b3)',
            }}>
              <CheckSquareIcon />
              {tasksDone ?? 0}/{tasksTotal} tareas
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
