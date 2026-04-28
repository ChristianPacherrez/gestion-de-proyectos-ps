/**
 * Badge — bridge component
 *
 * API mirrors Untitled UI's Badge family.
 *
 * Props
 *   color?   "gray" | "brand" | "error" | "warning" | "success"
 *            | "slate" | "sky" | "blue" | "indigo" | "purple" | "pink" | "orange"
 *   type?    "pill-color" | "badge-color" | "badge-modern"   (default "pill-color")
 *   size?    "sm" | "md" | "lg"                              (default "md")
 *   dot?     boolean   — show a colored dot before the label (BadgeWithDot variant)
 *   children ReactNode
 */

// ─── Color palette (matches Untitled UI token map) ───────────────────────────
const PALETTE = {
  gray:    { bg: '#f2f4f7', text: '#344054', border: '#d0d5dd', dot: '#98a2b3' },
  brand:   { bg: '#f4f3ff', text: '#5925dc', border: '#d9d6fe', dot: '#7f56d9' },
  error:   { bg: '#fef3f2', text: '#b42318', border: '#fecdca', dot: '#f04438' },
  warning: { bg: '#fffaeb', text: '#b54708', border: '#fedf89', dot: '#f79009' },
  success: { bg: '#ecfdf3', text: '#027a48', border: '#abefc6', dot: '#17b26a' },
  slate:   { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', dot: '#64748b' },
  sky:     { bg: '#f0f9ff', text: '#075985', border: '#bae6fd', dot: '#0ea5e9' },
  blue:    { bg: '#eff8ff', text: '#175cd3', border: '#b2ddff', dot: '#2e90fa' },
  indigo:  { bg: '#eef4ff', text: '#3538cd', border: '#c7d7fe', dot: '#6172f3' },
  purple:  { bg: '#fdf4ff', text: '#6941c6', border: '#e9d7fe', dot: '#9e77ed' },
  pink:    { bg: '#fdf2fa', text: '#c11574', border: '#fdd5e9', dot: '#ee46bc' },
  orange:  { bg: '#fff6ed', text: '#c4320a', border: '#f9dbaf', dot: '#ef6820' },
};

// ─── Size tokens ─────────────────────────────────────────────────────────────
const SIZES = {
  sm: { padding: '2px 6px',  fontSize: '11px', fontWeight: 500, borderRadius: '9999px', lineHeight: '16px' },
  md: { padding: '2px 8px',  fontSize: '12px', fontWeight: 500, borderRadius: '9999px', lineHeight: '18px' },
  lg: { padding: '4px 10px', fontSize: '14px', fontWeight: 500, borderRadius: '9999px', lineHeight: '20px' },
};

const BADGE_SIZES = {
  sm: { padding: '2px 6px',  fontSize: '11px', fontWeight: 500, borderRadius: '6px', lineHeight: '16px' },
  md: { padding: '2px 8px',  fontSize: '12px', fontWeight: 500, borderRadius: '6px', lineHeight: '18px' },
  lg: { padding: '4px 10px', fontSize: '14px', fontWeight: 500, borderRadius: '6px', lineHeight: '20px' },
};

// ─── Component ────────────────────────────────────────────────────────────────
export function Badge({
  color    = 'gray',
  type     = 'pill-color',
  size     = 'md',
  dot      = false,
  children,
  style: extraStyle,
}) {
  const palette    = PALETTE[color]      ?? PALETTE.gray;
  const isBadge    = type === 'badge-color' || type === 'badge-modern';
  const isModern   = type === 'badge-modern';
  const sizing     = isBadge ? (BADGE_SIZES[size] ?? BADGE_SIZES.md) : (SIZES[size] ?? SIZES.md);

  return (
    <span style={{
      display:         'inline-flex',
      alignItems:      'center',
      gap:             '4px',
      padding:         sizing.padding,
      fontSize:        sizing.fontSize,
      fontWeight:      sizing.fontWeight,
      lineHeight:      sizing.lineHeight,
      borderRadius:    sizing.borderRadius,
      backgroundColor: palette.bg,
      color:           palette.text,
      border:          isModern ? `1px solid ${palette.border}` : 'none',
      whiteSpace:      'nowrap',
      ...extraStyle,
    }}>
      {dot && (
        <span style={{
          width:           '6px',
          height:          '6px',
          borderRadius:    '50%',
          backgroundColor: palette.dot,
          flexShrink:      0,
        }} />
      )}
      {children}
    </span>
  );
}

// ─── Convenience: status badge for tasks/projects ────────────────────────────
// Maps app status values → Badge color + label automatically.

const TASK_STATUS_MAP = {
  todo:        { color: 'gray',    label: 'Por hacer'  },
  in_progress: { color: 'blue',    label: 'En proceso' },
  done:        { color: 'success', label: 'Completada' },
};

const PROJECT_STATUS_MAP = {
  active:    { color: 'success', label: 'Activo'     },
  paused:    { color: 'warning', label: 'Pausado'    },
  completed: { color: 'gray',    label: 'Completado' },
};

export function TaskStatusBadge({ status, size = 'sm' }) {
  const cfg = TASK_STATUS_MAP[status] ?? TASK_STATUS_MAP.todo;
  return <Badge color={cfg.color} size={size} dot>{cfg.label}</Badge>;
}

export function ProjectStatusBadge({ status, size = 'sm' }) {
  const cfg = PROJECT_STATUS_MAP[status] ?? PROJECT_STATUS_MAP.active;
  return <Badge color={cfg.color} size={size} dot>{cfg.label}</Badge>;
}

export default Badge;
