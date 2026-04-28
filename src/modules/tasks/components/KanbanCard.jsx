import { useSortable } from '@dnd-kit/sortable';
import { CSS }         from '@dnd-kit/utilities';

// ─── Icons ────────────────────────────────────────────────────────────────────
function GripIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <circle cx="4" cy="2.5" r="1" /><circle cx="8" cy="2.5" r="1" />
      <circle cx="4" cy="6"   r="1" /><circle cx="8" cy="6"   r="1" />
      <circle cx="4" cy="9.5" r="1" /><circle cx="8" cy="9.5" r="1" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ─── Design-system tokens ─────────────────────────────────────────────────────
const t = {
  textPrimary:     'var(--color-text-primary,   #101828)',
  textSecondary:   'var(--color-text-secondary, #475467)',
  textQuaternary:  'var(--color-text-quaternary,#98a2b3)',
  bgPrimary:       'var(--color-bg-primary,     #ffffff)',
  bgSecondary:     'var(--color-bg-secondary,   #f9fafb)',
  borderPrimary:   'var(--color-border-primary,   #eaecf0)',
  borderSecondary: 'var(--color-border-secondary, #d0d5dd)',
  fgTertiary:      'var(--color-fg-tertiary,    #667085)',
  fgError:         'var(--color-fg-error-primary, #f04438)',
  brand600:        'var(--color-brand-600,      #7f56d9)',
  brandBg:         'var(--color-bg-brand-primary, #f9f5ff)',
  errorBg:         'var(--color-bg-error-secondary, #fff1f0)',
  errorBorder:     'var(--color-border-error,   #fca5a5)',
  shadowXs:        'var(--shadow-xs, 0px 1px 2px rgba(0,0,0,0.05))',
  shadowMd:        'var(--shadow-md, 0px 4px 6px -1px rgba(0,0,0,0.1), 0px 2px 4px -2px rgba(0,0,0,0.06))',
  shadowLg:        'var(--shadow-lg, 0px 12px 16px -4px rgba(0,0,0,0.08), 0px 4px 6px -2px rgba(0,0,0,0.03))',
  radiusMd:        'var(--radius-md,  0.375rem)',
  radiusXl:        'var(--radius-xl,  0.75rem)',
  radiusFull:      'var(--radius-full, 9999px)',
  textXs:          'var(--text-xs, 0.75rem)',
  textSm:          'var(--text-sm, 0.875rem)',
};

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({ onClick, title, danger, children }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      aria-label={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '24px', height: '24px',
        borderRadius: t.radiusMd,
        border: '1px solid transparent',
        backgroundColor: 'transparent',
        color:  danger ? t.fgError : t.fgTertiary,
        cursor: 'pointer', padding: 0, flexShrink: 0,
        transition: 'background-color 0.12s, border-color 0.12s, color 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger ? t.errorBg    : t.bgSecondary;
        e.currentTarget.style.borderColor     = danger ? t.errorBorder : t.borderPrimary;
        e.currentTarget.style.color           = danger ? t.fgError     : t.textSecondary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderColor     = 'transparent';
        e.currentTarget.style.color           = danger ? t.fgError : t.fgTertiary;
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   task       — { id, name, description, status, dueDate, estimatedTime }
 *   onEdit     — (task) open edit modal
 *   onDelete   — (taskId) delete task
 *   isOverlay  — true when rendered inside DragOverlay (disables sortable)
 */
export default function KanbanCard({ task, onEdit, onDelete, isOverlay = false, canEdit = true, canDelete = true }) {
  const { id, name, description, dueDate, estimatedTime } = task;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isOverlay });

  const formattedDate = dueDate
    ? new Date(dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null;

  function handleDelete() {
    if (window.confirm(`¿Eliminar la tarea "${name}"?`)) onDelete(id);
  }

  function showActions(e) {
    e.currentTarget.querySelectorAll('[data-action]').forEach((el) => { el.style.opacity = '1'; });
  }
  function hideActions(e) {
    e.currentTarget.querySelectorAll('[data-action]').forEach((el) => { el.style.opacity = '0'; });
  }

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      onMouseEnter={(e) => {
        if (isDragging) return;
        e.currentTarget.style.boxShadow       = t.shadowMd;
        e.currentTarget.style.borderColor     = t.borderSecondary;
        e.currentTarget.style.borderLeftColor = t.brand600;
        showActions(e);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow       = isOverlay ? t.shadowLg : t.shadowXs;
        e.currentTarget.style.borderColor     = t.borderPrimary;
        e.currentTarget.style.borderLeftColor = t.borderPrimary;
        hideActions(e);
      }}
      style={{
        backgroundColor: t.bgPrimary,
        border:          `1px solid ${t.borderPrimary}`,
        borderLeft:      `3px solid ${t.borderPrimary}`,
        borderRadius:    t.radiusXl,
        padding:         '10px 12px 10px 11px',
        boxShadow:       isOverlay ? t.shadowLg : t.shadowXs,
        display:         'flex',
        flexDirection:   'column',
        gap:             '6px',
        // Sortable transform
        transform:       CSS.Transform.toString(transform),
        transition:      isDragging ? undefined : transition,
        // Visual states
        opacity:         isDragging ? 0 : 1,       // hide original — overlay takes over
        cursor:          isDragging ? 'grabbing' : 'default',
        rotate:          isOverlay ? '1.5deg' : undefined,
        zIndex:          isOverlay ? 999 : undefined,
        touchAction:     'none',
      }}
    >
      {/* Row: drag handle + name + actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>

        {/* Drag handle — only in real card, not overlay */}
        {!isOverlay && (
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            title="Arrastrar"
            style={{
              display:    'flex',
              alignItems: 'center',
              paddingTop: '2px',
              color:      t.textQuaternary,
              cursor:     isDragging ? 'grabbing' : 'grab',
              flexShrink: 0,
              touchAction:'none',
              userSelect: 'none',
            }}
          >
            <GripIcon />
          </div>
        )}

        {/* Name */}
        <span
          onClick={() => { if (!isDragging && canEdit) onEdit(task); }}
          style={{
            flex:       1,
            fontSize:   t.textSm,
            fontWeight: 500,
            color:      t.textPrimary,
            lineHeight: 'var(--text-sm--line-height, 1.25rem)',
            cursor:     canEdit ? 'pointer' : 'default',
          }}
        >
          {name}
        </span>

        {/* Action buttons — only rendered when user has permission */}
        {(canEdit || canDelete) && (
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            {canEdit && (
              <span data-action style={{ opacity: 0, transition: 'opacity 0.12s' }}>
                <ActionBtn onClick={() => onEdit(task)} title="Editar tarea">
                  <PencilIcon />
                </ActionBtn>
              </span>
            )}
            {canDelete && (
              <span data-action style={{ opacity: 0, transition: 'opacity 0.12s' }}>
                <ActionBtn onClick={handleDelete} title="Eliminar tarea" danger>
                  <TrashIcon />
                </ActionBtn>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p style={{
          margin:          0,
          fontSize:        t.textXs,
          color:           t.textQuaternary,
          lineHeight:      'var(--text-xs--line-height, 1.125rem)',
          overflow:        'hidden',
          display:         '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          paddingLeft:     isOverlay ? 0 : '18px',  // align under name
        }}>
          {description}
        </p>
      )}

      {/* Meta chips */}
      {(estimatedTime || formattedDate) && (
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '6px',
          flexWrap:   'wrap',
          paddingLeft: isOverlay ? 0 : '18px',
        }}>
          {estimatedTime && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              fontSize: t.textXs, color: t.textQuaternary,
              backgroundColor: t.bgSecondary, border: `1px solid ${t.borderPrimary}`,
              borderRadius: t.radiusFull, padding: '1px 7px',
              lineHeight: 'var(--text-xs--line-height, 1.125rem)',
            }}>
              <ClockIcon /> {estimatedTime}
            </span>
          )}
          {formattedDate && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              fontSize: t.textXs, color: t.textQuaternary,
              backgroundColor: t.bgSecondary, border: `1px solid ${t.borderPrimary}`,
              borderRadius: t.radiusFull, padding: '1px 7px',
              lineHeight: 'var(--text-xs--line-height, 1.125rem)',
            }}>
              <CalendarIcon /> {formattedDate}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
