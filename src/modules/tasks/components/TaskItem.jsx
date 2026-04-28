// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  todo: {
    label:  'Por hacer',
    bg:     '#f9fafb',
    text:   '#344054',
    border: '#d0d5dd',
    dot:    '#98a2b3',
  },
  in_progress: {
    label:  'En proceso',
    bg:     '#eff8ff',
    text:   '#175cd3',
    border: '#b2ddff',
    dot:    '#2e90fa',
  },
  done: {
    label:  'Completada',
    bg:     '#ecfdf3',
    text:   '#027a48',
    border: '#abefc6',
    dot:    '#17b26a',
  },
};

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'Por hacer'  },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'done',        label: 'Completada' },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// ─── Done toggle — quick complete / uncomplete ────────────────────────────────
function DoneToggle({ status, onToggle }) {
  const isDone      = status === 'done';
  const isProgress  = status === 'in_progress';
  const borderColor = isDone ? '#17b26a' : isProgress ? '#2e90fa' : '#d0d5dd';
  const bgColor     = isDone ? '#17b26a' : 'transparent';

  return (
    <button
      type="button"
      onClick={onToggle}
      title={isDone ? 'Marcar como pendiente' : 'Marcar como completada'}
      aria-label="Alternar estado completado"
      style={{
        width:           '20px',
        height:          '20px',
        borderRadius:    '50%',
        border:          `2px solid ${borderColor}`,
        backgroundColor: bgColor,
        cursor:          'pointer',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        flexShrink:      0,
        padding:         0,
        transition:      'border-color 0.15s, background-color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isDone) {
          e.currentTarget.style.borderColor = '#17b26a';
          e.currentTarget.style.backgroundColor = 'rgba(23,178,106,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDone) {
          e.currentTarget.style.borderColor = borderColor;
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {isDone && <CheckIcon />}
      {isProgress && (
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#2e90fa' }} />
      )}
    </button>
  );
}

// ─── Inline status select — styled to look like a badge ──────────────────────
function StatusSelect({ status, onChange }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.todo;

  // Build dot SVG data URL with the config color
  const dotColor  = encodeURIComponent(cfg.dot);
  const dotSvg    = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6' viewBox='0 0 6 6'%3E%3Ccircle cx='3' cy='3' r='3' fill='${dotColor}'/%3E%3C/svg%3E")`;
  const arrowSvg  = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(cfg.text)}' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`;

  return (
    <select
      value={status}
      onChange={(e) => { e.stopPropagation(); onChange(e.target.value); }}
      onClick={(e) => e.stopPropagation()}
      title="Cambiar estado"
      style={{
        appearance:         'none',
        backgroundColor:    cfg.bg,
        color:              cfg.text,
        border:             `1px solid ${cfg.border}`,
        borderRadius:       '9999px',
        padding:            '2px 24px 2px 20px',
        fontSize:           '11px',
        fontWeight:         500,
        cursor:             'pointer',
        fontFamily:         'inherit',
        backgroundImage:    `${dotSvg}, ${arrowSvg}`,
        backgroundRepeat:   'no-repeat, no-repeat',
        backgroundPosition: 'left 7px center, right 6px center',
        backgroundSize:     '6px, 10px',
        outline:            'none',
        flexShrink:         0,
        transition:         'border-color 0.15s',
      }}
    >
      {STATUS_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}

// ─── Icon action button ───────────────────────────────────────────────────────
function ActionBtn({ onClick, title, danger, children }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      aria-label={title}
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           '26px',
        height:          '26px',
        borderRadius:    '6px',
        border:          '1px solid #eaecf0',
        backgroundColor: '#fff',
        color:           danger ? '#f04438' : '#667085',
        cursor:          'pointer',
        flexShrink:      0,
        transition:      'background-color 0.1s, border-color 0.1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger ? '#fff1f0' : '#f9fafb';
        e.currentTarget.style.borderColor     = danger ? '#fca5a5' : '#d0d5dd';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#fff';
        e.currentTarget.style.borderColor     = '#eaecf0';
      }}
    >
      {children}
    </button>
  );
}

// ─── Move button (up / down) ──────────────────────────────────────────────────
function MoveBtn({ onClick, disabled, children, title }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      title={title}
      aria-label={title}
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           '20px',
        height:          '20px',
        borderRadius:    '4px',
        border:          '1px solid #eaecf0',
        backgroundColor: '#fff',
        color:           disabled ? '#d0d5dd' : '#667085',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        flexShrink:      0,
        padding:         0,
        transition:      'background-color 0.1s, border-color 0.1s, color 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#f9fafb';
          e.currentTarget.style.borderColor     = '#d0d5dd';
          e.currentTarget.style.color           = '#344054';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#fff';
          e.currentTarget.style.borderColor     = '#eaecf0';
          e.currentTarget.style.color           = '#667085';
        }
      }}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   task            — { id, name, description, status, dueDate, estimatedTime }
 *   isFirst         — boolean, disables "move up"
 *   isLast          — boolean, disables "move down"
 *   onToggleDone    — (taskId) quick complete/uncomplete
 *   onStatusChange  — (taskId, newStatus) full status update from select
 *   onEdit          — (task) open edit modal
 *   onDelete        — (taskId) delete task
 *   onMoveUp        — () move task one position up
 *   onMoveDown      — () move task one position down
 */
function fmtDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

const UNIT_LABEL = { hours: 'h', days: 'día', weeks: 'sem.' };

function fmtTime(estimatedTime, estimatedUnit) {
  if (!estimatedTime && estimatedTime !== 0) return null;
  const val   = Number(estimatedTime);
  if (isNaN(val) || val <= 0) return null;
  const unit  = UNIT_LABEL[estimatedUnit] ?? estimatedUnit ?? 'h';
  // Pluralize "día" → "días"
  const label = unit === 'día' && val !== 1 ? 'días' : unit;
  return `${val % 1 === 0 ? val : val} ${label}`;
}

export default function TaskItem({ task, isFirst, isLast, onToggleDone, onStatusChange, onEdit, onDelete, onMoveUp, onMoveDown, canEdit = true, canDelete = true }) {
  const { id, name, description, status, startDate, dueDate, estimatedTime, estimatedUnit } = task;
  const isDone = status === 'done';

  const fStart = fmtDate(startDate);
  const fEnd   = fmtDate(dueDate);
  // Build a date range label: "12 ene → 15 ene", "→ 15 ene", or "12 ene →"
  const dateLabel = fStart && fEnd
    ? `${fStart} → ${fEnd}`
    : fEnd   ? `→ ${fEnd}`
    : fStart ? `${fStart} →`
    : null;

  function handleDelete() {
    if (window.confirm(`¿Eliminar la tarea "${name}"?`)) onDelete(id);
  }

  // Show action buttons on row hover
  function showActions(e) {
    e.currentTarget.querySelectorAll('[data-action]').forEach((btn) => {
      btn.style.opacity = '1';
    });
  }
  function hideActions(e) {
    e.currentTarget.querySelectorAll('[data-action]').forEach((btn) => {
      btn.style.opacity = '0';
    });
  }

  return (
    <li
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafafa'; showActions(e); }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; hideActions(e); }}
      style={{
        display:         'flex',
        alignItems:      'flex-start',
        gap:             '12px',
        padding:         '12px 16px',
        backgroundColor: '#fff',
        borderBottom:    '1px solid #f2f4f7',
        transition:      'background-color 0.1s',
      }}
    >
      {/* Move up / down — only for users who can edit */}
      {canEdit && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
          <MoveBtn onClick={onMoveUp} disabled={isFirst} title="Subir tarea">
            <ChevronUpIcon />
          </MoveBtn>
          <MoveBtn onClick={onMoveDown} disabled={isLast} title="Bajar tarea">
            <ChevronDownIcon />
          </MoveBtn>
        </div>
      )}

      {/* Done toggle — aligned to first line */}
      <div style={{ paddingTop: '1px', flexShrink: 0 }}>
        <DoneToggle status={status} onToggle={() => onToggleDone(id)} />
      </div>

      {/* Name + description — click to edit (only if allowed) */}
      <div
        onClick={() => canEdit && onEdit(task)}
        title={canEdit ? 'Editar tarea' : undefined}
        style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px', cursor: canEdit ? 'pointer' : 'default' }}
      >
        <span style={{
          fontSize:       '14px',
          fontWeight:     500,
          color:          isDone ? '#98a2b3' : '#101828',
          textDecoration: isDone ? 'line-through' : 'none',
          lineHeight:     1.4,
          transition:     'color 0.15s',
        }}>
          {name}
        </span>
        {description && (
          <span style={{
            fontSize:    '12px',
            color:       '#98a2b3',
            lineHeight:  1.4,
            overflow:    'hidden',
            display:     '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}>
            {description}
          </span>
        )}
      </div>

      {/* Meta: estimated time + due date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {fmtTime(estimatedTime, estimatedUnit) && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#98a2b3' }}>
            <ClockIcon /> {fmtTime(estimatedTime, estimatedUnit)}
          </span>
        )}
        {dateLabel && (
          <span style={{ fontSize: '11px', color: '#98a2b3', whiteSpace: 'nowrap' }}>
            {dateLabel}
          </span>
        )}
      </div>

      {/* Status select */}
      <StatusSelect
        status={status}
        onChange={(newStatus) => onStatusChange(id, newStatus)}
      />

      {/* Edit button — visible on row hover, only if allowed */}
      {canEdit && (
        <span data-action style={{ opacity: 0, transition: 'opacity 0.1s', flexShrink: 0 }}>
          <ActionBtn onClick={() => onEdit(task)} title="Editar tarea">
            <PencilIcon />
          </ActionBtn>
        </span>
      )}

      {/* Delete button — visible on row hover, only if allowed */}
      {canDelete && (
        <span data-action style={{ opacity: 0, transition: 'opacity 0.1s', flexShrink: 0 }}>
          <ActionBtn onClick={handleDelete} title="Eliminar tarea" danger>
            <TrashIcon />
          </ActionBtn>
        </span>
      )}
    </li>
  );
}
