import { useState, useEffect } from 'react';
import { ProjectStatusBadge }   from '../../../components/ui/Badge';
import { useNavigation }        from '../../../context/NavigationContext';
import { useAuth }              from '../../../context/AuthContext';
import { useProjects }          from '../hooks/useProjects';
import { useTasks }             from '../../tasks/hooks/useTasks';
import { useQuotes }            from '../../quotes/hooks/useQuotes';
import { useProjectMember }     from '../hooks/useProjectMember';
import {
  canEditTask,
  canDeleteTask,
  canViewQuotes,
  canManageMembers,
  ROLE_LABELS,
} from '../services/membersSupabase';
import { TaskList, TaskFormModal, KanbanBoard, GanttView } from '../../tasks/components';
import { QuoteList, QuoteDetail } from '../../quotes/components';
import ContactPickerModal from '../components/ContactPickerModal';
import ProjectBrief       from '../components/ProjectBrief';
import ShareGanttModal    from '../components/ShareGanttModal';

// ─── Avatar palette — cycles across members ────────────────────────────────────
const AVATAR_PALETTE = [
  { bg: '#f4ebff', text: '#6941c6' },
  { bg: '#eff8ff', text: '#175cd3' },
  { bg: '#ecfdf3', text: '#027a48' },
  { bg: '#fffaeb', text: '#b54708' },
  { bg: '#fdf2fa', text: '#c11574' },
];

// ─── Role badge ───────────────────────────────────────────────────────────────
const ROLE_BADGE = {
  owner:        { bg: '#f9f5ff', text: '#6941c6', border: '#e9d7fe' },
  collaborator: { bg: '#eff8ff', text: '#175cd3', border: '#b2ddff' },
  client:       { bg: '#f0fdf4', text: '#027a48', border: '#abefc6' },
};

function RoleBadge({ role }) {
  const cfg = ROLE_BADGE[role] ?? ROLE_BADGE.collaborator;
  return (
    <span style={{
      padding:         '2px 10px',
      borderRadius:    '9999px',
      fontSize:        '11px',
      fontWeight:      600,
      backgroundColor: cfg.bg,
      color:           cfg.text,
      border:          `1px solid ${cfg.border}`,
      flexShrink:      0,
    }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
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

function UserPlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

// ─── Member avatar stack ──────────────────────────────────────────────────────
function MemberAvatarStack({ members, max = 4 }) {
  const visible = members.slice(0, max);
  const extra   = members.length - max;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((m, i) => {
        const palette  = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
        const initial  = (m.fullName || m.email || '?')[0].toUpperCase();
        const tooltip  = m.fullName || m.email || m.userId;

        return (
          <div
            key={m.userId}
            title={tooltip}
            style={{
              position:        'relative',
              zIndex:          visible.length - i,
              width:           '32px',
              height:          '32px',
              borderRadius:    '50%',
              backgroundColor: palette.bg,
              color:           palette.text,
              fontSize:        '12px',
              fontWeight:      600,
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              // White ring separates overlapping avatars
              borderWidth:     '2px',
              borderStyle:     'solid',
              borderColor:     '#fff',
              marginLeft:      i === 0 ? 0 : '-8px',
              flexShrink:      0,
            }}
          >
            {initial}
          </div>
        );
      })}

      {extra > 0 && (
        <div
          title={`${extra} más`}
          style={{
            position:        'relative',
            zIndex:          0,
            width:           '32px',
            height:          '32px',
            borderRadius:    '50%',
            backgroundColor: 'var(--color-bg-tertiary, #f2f4f7)',
            color:           'var(--color-text-secondary, #475467)',
            fontSize:        '11px',
            fontWeight:      600,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            borderWidth:     '2px',
            borderStyle:     'solid',
            borderColor:     '#fff',
            marginLeft:      '-8px',
            flexShrink:      0,
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

// ─── Project cover header ─────────────────────────────────────────────────────
// Small icon helpers used only in the cover footer strip
function CoverCalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8"  y1="2" x2="8"  y2="6" />
      <line x1="3"  y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CoverCheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

// Horizontal meta chip used in the cover footer strip
function CoverMetaItem({ icon, label, value }) {
  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        '6px',
    }}>
      <span style={{ color: 'var(--color-fg-tertiary, #667085)', display: 'flex', alignItems: 'center' }}>
        {icon}
      </span>
      <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary, #667085)' }}>
        {label}
      </span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary, #101828)' }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Notion-style gradient cover header.
 * Props: project, role, members[]
 */
function ProjectHeader({ project, role, members = [] }) {
  // Parse YYYY-MM-DD as local time (avoids UTC-offset day shift)
  const formattedDate = (() => {
    if (!project.dueDate) return '—';
    const parts = String(project.dueDate).split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return new Date(project.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const pct         = Math.min(100, Math.max(0, project.progress ?? 0));
  const fillColor   = pct === 100
    ? 'var(--color-bg-success-solid, #17b26a)'
    : 'var(--color-bg-brand-solid, #7f56d9)';

  return (
    <div style={{
      // Gradient cover — brand-100 → brand-50 → white
      background:   'linear-gradient(135deg, var(--color-brand-100, #f4ebff) 0%, var(--color-brand-50, #f9f5ff) 45%, #ffffff 100%)',
      borderWidth:  '1px',
      borderStyle:  'solid',
      borderColor:  'var(--color-border-primary, #eaecf0)',
      borderRadius: 'var(--radius-2xl, 16px)',
      boxShadow:    'var(--shadow-sm, 0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1))',
      overflow:     'hidden',
    }}>

      {/* ── Body padding ──────────────────────────────────────────────── */}
      <div style={{ padding: '28px 32px 24px' }}>

        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <ProjectStatusBadge status={project.status} size="md" />
          {role && <RoleBadge role={role} />}
        </div>

        {/* Title */}
        <h1 style={{
          margin:        '0 0 8px',
          fontSize:      '28px',
          fontWeight:    700,
          color:         'var(--color-text-primary, #101828)',
          lineHeight:    1.25,
          letterSpacing: '-0.02em',
        }}>
          {project.name}
        </h1>

        {/* Description */}
        {project.description ? (
          <p style={{
            margin:    '0 0 24px',
            fontSize:  '15px',
            color:     'var(--color-text-secondary, #475467)',
            lineHeight: 1.65,
            maxWidth:  '640px',
          }}>
            {project.description}
          </p>
        ) : (
          <div style={{ marginBottom: '24px' }} />
        )}

        {/* Member avatar stack */}
        {members.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MemberAvatarStack members={members} max={5} />
            <span style={{
              fontSize:  '13px',
              color:     'var(--color-text-tertiary, #667085)',
            }}>
              {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
            </span>
          </div>
        )}
      </div>

      {/* ── Footer strip ──────────────────────────────────────────────── */}
      <div style={{
        display:         'flex',
        alignItems:      'center',
        gap:             '20px',
        flexWrap:        'wrap',
        padding:         '12px 32px',
        backgroundColor: 'rgba(255,255,255,0.65)',
        borderTopWidth:  '1px',
        borderTopStyle:  'solid',
        borderTopColor:  'var(--color-brand-200, #e9d7fe)',
      }}>
        <CoverMetaItem
          icon={<CoverCalendarIcon />}
          label="Vence"
          value={formattedDate}
        />

        <Divider />

        <CoverMetaItem
          icon={<CoverCheckIcon />}
          label="Tareas"
          value={`${project.tasksDone ?? 0} / ${project.tasksTotal ?? 0}`}
        />

        <Divider />

        {/* Inline progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-tertiary, #667085)' }}>
            Progreso
          </span>
          <div style={{
            width:           '96px',
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
          <span style={{
            fontSize:  '13px',
            fontWeight: 600,
            color:     pct === 100
              ? 'var(--color-text-success-primary, #027a48)'
              : 'var(--color-text-primary, #101828)',
            minWidth:  '32px',
          }}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}

// Thin vertical separator used inside the footer strip
function Divider() {
  return (
    <div style={{
      width:           '1px',
      height:          '16px',
      backgroundColor: 'var(--color-brand-200, #e9d7fe)',
      flexShrink:      0,
    }} />
  );
}

// ─── Task stats strip ─────────────────────────────────────────────────────────
function TaskStats({ pending, inProgress, completed, total }) {
  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
      {[
        { label: 'Pendientes',  count: pending,    color: '#98a2b3' },
        { label: 'En proceso',  count: inProgress, color: '#2e90fa' },
        { label: 'Completadas', count: completed,  color: '#17b26a' },
      ].map(({ label, count, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#475467' }}>
            <strong style={{ color: '#101828' }}>{count}</strong> {label}
          </span>
        </div>
      ))}
      {total > 0 && (
        <span style={{ fontSize: '12px', color: '#98a2b3', marginLeft: '4px' }}>
          — {total} en total
        </span>
      )}
    </div>
  );
}

// ─── Members panel (owner only) ──────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value: 'owner',        label: 'Owner' },
  { value: 'collaborator', label: 'Colaborador' },
  { value: 'client',       label: 'Cliente' },
];

const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`;

function MembersPanel({ members, currentUserId, onAdd, onChangeRole, onRemove }) {
  const [email,       setEmail]       = useState('');
  const [newRole,     setNewRole]     = useState('collaborator');
  const [addError,    setAddError]    = useState('');
  const [addLoading,  setAddLoading]  = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setAddError('');
    setAddLoading(true);
    try {
      await onAdd(email.trim(), newRole);
      setEmail('');
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Current members list */}
      <div style={{
        backgroundColor: '#fff',
        border:          '1px solid #eaecf0',
        borderRadius:    '12px',
        overflow:        'hidden',
        boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #eaecf0' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#101828' }}>
            Miembros del proyecto
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#667085' }}>
            {members.length} {members.length === 1 ? 'persona' : 'personas'} con acceso
          </p>
        </div>

        {!members || members.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#98a2b3', fontSize: '13px' }}>
            No hay miembros registrados.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {members.map((m) => {
              // Skip any malformed rows that may arrive from the DB
              if (!m || !m.userId) return null;

              const isMe = m.userId === currentUserId;

              // Safe access — profiles join may not exist
              const email    = m.email    || null;
              const fullName = m.fullName || null;
              const role     = m.role     || 'collaborator';

              // Display label: prefer email, then full name, then truncated id
              const display  = email ?? fullName ?? `${m.userId.slice(0, 8)}…`;

              // Avatar initial: first char of the best available label
              const initial  = (fullName || email || '?')[0].toUpperCase();

              const isLockedHost = isMe && role === 'owner';

              return (
                <li
                  key={m.userId}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '12px',
                    padding:      '12px 20px',
                    borderBottom: '1px solid #f2f4f7',
                  }}
                >
                  {/* Avatar initials */}
                  <div style={{
                    width:           '34px',
                    height:          '34px',
                    borderRadius:    '50%',
                    backgroundColor: '#f4f3ff',
                    color:           '#6941c6',
                    fontSize:        '13px',
                    fontWeight:      600,
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    flexShrink:      0,
                  }}>
                    {initial}
                  </div>

                  {/* Email / name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#101828', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {display}
                      {isMe && <span style={{ fontSize: '11px', color: '#98a2b3', fontWeight: 400 }}>(tú)</span>}
                    </div>
                    {/* Show email as subtitle only when we also have a full name */}
                    {fullName && email && (
                      <div style={{ fontSize: '12px', color: '#98a2b3' }}>{email}</div>
                    )}
                  </div>

                  {/* Role select */}
                  <select
                    value={role}
                    disabled={isLockedHost}
                    onChange={(e) => onChangeRole(m.userId, e.target.value)}
                    style={{
                      appearance:         'none',
                      backgroundColor:    '#fff',
                      border:             '1px solid #d0d5dd',
                      borderRadius:       '8px',
                      padding:            '5px 28px 5px 10px',
                      fontSize:           '12px',
                      fontWeight:         500,
                      color:              '#344054',
                      cursor:             isLockedHost ? 'not-allowed' : 'pointer',
                      fontFamily:         'inherit',
                      backgroundImage:    CHEVRON_SVG,
                      backgroundRepeat:   'no-repeat',
                      backgroundPosition: 'right 8px center',
                      outline:            'none',
                      opacity:            isLockedHost ? 0.5 : 1,
                    }}
                  >
                    {ROLE_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>

                  {/* Remove button — host cannot remove themselves */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Quitar el acceso de ${display} al proyecto?`)) {
                        onRemove(m.userId);
                      }
                    }}
                    disabled={isLockedHost}
                    title="Eliminar miembro"
                    style={{
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      width:           '28px',
                      height:          '28px',
                      borderRadius:    '6px',
                      border:          '1px solid #eaecf0',
                      backgroundColor: '#fff',
                      color:           '#f04438',
                      cursor:          isLockedHost ? 'not-allowed' : 'pointer',
                      opacity:         isLockedHost ? 0.3 : 1,
                      flexShrink:      0,
                      transition:      'background-color 0.1s',
                    }}
                    onMouseEnter={(e) => { if (!isLockedHost) e.currentTarget.style.backgroundColor = '#fff1f0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                  >
                    <TrashIcon />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add member form */}
      <div style={{
        backgroundColor: '#fff',
        border:          '1px solid #eaecf0',
        borderRadius:    '12px',
        padding:         '20px',
        boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#101828', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlusIcon /> Agregar miembro
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#667085' }}>
          Ingresa el email de la persona. Debe tener una cuenta registrada.
        </p>

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setAddError(''); }}
            required
            style={{
              flex:            '1 1 220px',
              padding:         '8px 12px',
              fontSize:        '13px',
              color:           '#101828',
              backgroundColor: '#fff',
              border:          `1px solid ${addError ? '#f04438' : '#d0d5dd'}`,
              borderRadius:    '8px',
              outline:         'none',
              fontFamily:      'inherit',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#7f56d9'; e.target.style.boxShadow = '0 0 0 3px rgba(127,86,217,0.12)'; }}
            onBlur={(e)  => { e.target.style.borderColor = addError ? '#f04438' : '#d0d5dd'; e.target.style.boxShadow = 'none'; }}
          />

          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            style={{
              flex:               '0 0 auto',
              padding:            '8px 28px 8px 12px',
              fontSize:           '13px',
              color:              '#344054',
              backgroundColor:    '#fff',
              border:             '1px solid #d0d5dd',
              borderRadius:       '8px',
              outline:            'none',
              fontFamily:         'inherit',
              appearance:         'none',
              backgroundImage:    CHEVRON_SVG,
              backgroundRepeat:   'no-repeat',
              backgroundPosition: 'right 8px center',
              cursor:             'pointer',
            }}
          >
            {ROLE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={addLoading}
            style={{
              padding:         '8px 16px',
              borderRadius:    '8px',
              border:          '1px solid #6941c6',
              backgroundColor: addLoading ? '#a78bfa' : '#7f56d9',
              color:           '#fff',
              fontSize:        '13px',
              fontWeight:      500,
              cursor:          addLoading ? 'not-allowed' : 'pointer',
              whiteSpace:      'nowrap',
              fontFamily:      'inherit',
              transition:      'background-color 0.15s',
            }}
            onMouseEnter={(e) => { if (!addLoading) e.currentTarget.style.backgroundColor = '#6941c6'; }}
            onMouseLeave={(e) => { if (!addLoading) e.currentTarget.style.backgroundColor = '#7f56d9'; }}
          >
            {addLoading ? 'Agregando…' : 'Agregar'}
          </button>
        </form>

        {addError && (
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#f04438' }}>{addError}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProjectDetail({ projectId }) {
  const { goBack }                              = useNavigation();
  const { user: authUser, loading: authLoading } = useAuth();
  const { projects, updateProject }             = useProjects();

  // Deriva el proyecto antes para pasar createdBy a useProjectMember.
  // project puede ser undefined mientras carga la lista — el hook aguarda
  // hasta tener createdBy definido antes de correr.
  const project = projects.find((p) => p.id === projectId);

  const {
    tasks, loading: tasksLoading,
    pendingTasks, inProgressTasks, completedTasks,
    addTask, updateTask, toggleDone, deleteTask, moveTask, reorderTask,
  } = useTasks(projectId);

  const {
    quotes, addQuote, updateQuote, deleteQuote,
  } = useQuotes(projectId);

  const {
    role, roleLoading, isOwner, members, currentUserId,
    addMember, changeMemberRole, removeMember,
    addMemberFromContact, inviteByEmail,
    availableContacts, contactsLoading, loadAvailableContacts,
  } = useProjectMember(projectId, project?.createdBy);

  const [modalTask,          setModalTask]          = useState(null);
  const [viewMode,           setViewMode]           = useState('kanban');
  const [activeTab,          setActiveTab]          = useState('tasks');
  const [activeQuote,        setActiveQuote]        = useState(null);
  const [showContactPicker,  setShowContactPicker]  = useState(false);
  const [showGanttShare,     setShowGanttShare]     = useState(false);

  // ── Derived permissions ────────────────────────────────────────────────────
  const canEdit    = canEditTask(role);
  const canDelete  = canDeleteTask(role);
  const canQuotes  = canViewQuotes(role);
  const canMembers = canManageMembers(role);

  // ── Sync task counts in project state ─────────────────────────────────────
  useEffect(() => {
    if (authLoading || !authUser || tasksLoading) return;
    updateProject(projectId, { tasksTotal: tasks.length, tasksDone: completedTasks.length });
  }, [tasks, tasksLoading, authUser, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Guard: esperar a que el proyecto cargue antes de evaluar permisos ───────
  // Garantiza que project.createdBy sea un UUID real cuando useProjectMember corre.
  if (!project) {
    return (
      <div style={{ padding: '64px', textAlign: 'center', color: '#98a2b3', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <span style={{
          display: 'inline-block', width: '16px', height: '16px', borderRadius: '50%',
          border: '2px solid #d0d5dd', borderTopColor: '#7f56d9',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '14px' }}>Cargando proyecto…</span>
      </div>
    );
  }

  const isEditMode = modalTask !== null && modalTask !== 'new';
  const modalOpen  = modalTask !== null;

  function handleModalSubmit(task) {
    if (isEditMode) updateTask(task.id, task);
    else            addTask(task);
  }

  function handleStatusChange(taskId, newStatus) {
    updateTask(taskId, { status: newStatus });
  }

  // ── Access denied — only block AFTER role fetch is confirmed complete ──────
  // roleLoading === false AND role === null  →  no membership, block access
  // roleLoading === true  (undefined)        →  still loading, render normally
  if (!roleLoading && role === null) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontSize: '40px' }}>🔒</div>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#101828' }}>
          Sin acceso a este proyecto
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#667085', maxWidth: '360px' }}>
          No tienes permiso para ver este proyecto. Pide al host que te agregue como miembro.
        </p>
        <button
          onClick={goBack}
          style={{ marginTop: '8px', cursor: 'pointer', color: '#7f56d9', background: 'none', border: 'none', fontSize: '14px', fontWeight: 500 }}
        >
          ← Volver a proyectos
        </button>
      </div>
    );
  }

  // ── Project not found ─────────────────────────────────────────────────────
  if (!project) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#98a2b3' }}>
        <p>Proyecto no encontrado.</p>
        <button onClick={goBack} style={{ marginTop: '16px', cursor: 'pointer', color: '#7f56d9', background: 'none', border: 'none', fontSize: '14px' }}>
          ← Volver
        </button>
      </div>
    );
  }

  // ── Build tab list dynamically ────────────────────────────────────────────
  // count: null → the tab chip is hidden (used for Brief which has no meaningful count)
  const tabs = [
    { key: 'tasks',   label: 'Tareas',       count: tasks.length   },
    { key: 'brief',   label: 'Brief',        count: null           },
    ...(canQuotes  ? [{ key: 'quotes',  label: 'Cotizaciones', count: quotes.length  }] : []),
    ...(canMembers ? [{ key: 'members', label: 'Equipo',       count: members.length }] : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Back */}
      <button
        onClick={goBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#475467', padding: 0, alignSelf: 'flex-start', transition: 'color 0.1s' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#7f56d9'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#475467'; }}
      >
        <BackIcon /> Volver a proyectos
      </button>

      {/* Non-blocking role-check indicator — only shown while verifying */}
      {roleLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#98a2b3' }}>
          <span style={{
            display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
            border: '1.5px solid #d0d5dd', borderTopColor: '#7f56d9',
            animation: 'spin 0.7s linear infinite', flexShrink: 0,
          }} />
          Verificando acceso…
        </div>
      )}

      {/* Project header */}
      <ProjectHeader project={project} role={role} members={members} />

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #eaecf0', gap: '0' }}>
        {tabs.map(({ key, label, count }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setActiveQuote(null); }}
              style={{
                padding:         '10px 16px',
                border:          'none',
                borderBottom:    active ? '2px solid #7f56d9' : '2px solid transparent',
                backgroundColor: 'transparent',
                fontSize:        '14px',
                fontWeight:      active ? 600 : 400,
                color:           active ? '#7f56d9' : '#667085',
                cursor:          'pointer',
                display:         'flex',
                alignItems:      'center',
                gap:             '6px',
                transition:      'color 0.1s',
                marginBottom:    '-1px',
              }}
            >
              {label}
              {count !== null && (
                <span style={{
                  padding:         '1px 7px',
                  borderRadius:    '9999px',
                  fontSize:        '11px',
                  fontWeight:      500,
                  backgroundColor: active ? '#f4f3ff' : '#f2f4f7',
                  color:           active ? '#6941c6' : '#667085',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tasks tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {tasksLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#667085' }}>
              <span style={{
                display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%',
                border: '2px solid #d0d5dd', borderTopColor: '#7f56d9',
                animation: 'spin 0.7s linear infinite',
              }} />
              Cargando tareas…
            </div>
          )}

          {/* Section header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <TaskStats
              pending={pendingTasks.length}
              inProgress={inProgressTasks.length}
              completed={completedTasks.length}
              total={tasks.length}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* View toggle */}
              <div style={{ display: 'flex', border: '1px solid #eaecf0', borderRadius: '8px', overflow: 'hidden' }}>
                {[
                  { mode: 'list',   label: 'Lista',  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6"  x2="21" y2="6"  />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6"  x2="3.01" y2="6"  />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  )},
                  { mode: 'kanban', label: 'Kanban', icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3"  y="3" width="7" height="18" rx="1" />
                      <rect x="14" y="3" width="7" height="11" rx="1" />
                    </svg>
                  )},
                  { mode: 'gantt',  label: 'Gantt',  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="6"  x2="15" y2="6"  />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="10" y2="18" />
                    </svg>
                  )},
                ].map(({ mode, label, icon }, idx, arr) => {
                  const active = viewMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      title={label}
                      style={{
                        display:         'flex',
                        alignItems:      'center',
                        gap:             '5px',
                        padding:         '5px 10px',
                        border:          'none',
                        borderRight:     idx < arr.length - 1 ? '1px solid #eaecf0' : 'none',
                        backgroundColor: active ? '#f2f4f7' : '#fff',
                        color:           active ? '#344054' : '#98a2b3',
                        fontSize:        '12px',
                        fontWeight:      active ? 600 : 400,
                        cursor:          'pointer',
                        transition:      'background-color 0.1s, color 0.1s',
                      }}
                    >
                      {icon} {label}
                    </button>
                  );
                })}
              </div>

              {/* Compartir Gantt — owner only, only in gantt mode */}
              {isOwner && viewMode === 'gantt' && (
                <button
                  onClick={() => setShowGanttShare(true)}
                  style={{
                    display:         'inline-flex',
                    alignItems:      'center',
                    gap:             '6px',
                    padding:         '7px 14px',
                    borderRadius:    '8px',
                    border:          '1px solid #d0d5dd',
                    backgroundColor: '#fff',
                    color:           '#344054',
                    fontSize:        '14px',
                    fontWeight:      500,
                    cursor:          'pointer',
                    whiteSpace:      'nowrap',
                    boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
                    fontFamily:      'inherit',
                    transition:      'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7f56d9'; e.currentTarget.style.color = '#6941c6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d0d5dd'; e.currentTarget.style.color = '#344054'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="18" cy="5"  r="3" />
                    <circle cx="6"  cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49" />
                  </svg>
                  Compartir Gantt
                </button>
              )}

              {/* Nueva tarea — only for users who can edit */}
              {canEdit && (
                <button
                  onClick={() => setModalTask('new')}
                  style={{
                    padding:         '7px 14px',
                    borderRadius:    '8px',
                    border:          '1px solid #6941c6',
                    backgroundColor: '#7f56d9',
                    color:           '#fff',
                    fontSize:        '14px',
                    fontWeight:      500,
                    cursor:          'pointer',
                    whiteSpace:      'nowrap',
                    boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
                    fontFamily:      'inherit',
                    transition:      'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
                >
                  + Nueva tarea
                </button>
              )}
            </div>
          </div>

          {/* Task views */}
          {viewMode === 'list' && (
            <TaskList
              tasks={tasks}
              onToggleDone={toggleDone}
              onStatusChange={handleStatusChange}
              onEdit={(task) => setModalTask(task)}
              onDelete={deleteTask}
              onMove={moveTask}
              onNew={() => setModalTask('new')}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
          {viewMode === 'kanban' && (
            <KanbanBoard
              tasks={tasks}
              onEdit={(task) => setModalTask(task)}
              onDelete={deleteTask}
              onNew={() => setModalTask('new')}
              onReorder={reorderTask}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          )}
          {viewMode === 'gantt' && (
            <GanttView
              tasks={tasks}
              onEdit={(task) => canEdit && setModalTask(task)}
              onNew={() => setModalTask('new')}
              onUpdateDates={(taskId, changes) => updateTask(taskId, changes)}
            />
          )}
        </div>
      )}

      {/* ── Brief tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'brief' && (
        <ProjectBrief
          projectId={projectId}
          role={role}
          onBack={() => setActiveTab('tasks')}
        />
      )}

      {/* ── Quotes tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'quotes' && canQuotes && (
        activeQuote ? (
          <QuoteDetail
            quote={quotes.find((q) => q.id === activeQuote.id) ?? activeQuote}
            projectName={project.name}
            onBack={() => setActiveQuote(null)}
            onUpdate={(id, changes) => updateQuote(id, changes)}
            onDelete={(id) => { deleteQuote(id); setActiveQuote(null); }}
          />
        ) : (
          <div style={{
            backgroundColor: '#fff',
            border:          '1px solid #eaecf0',
            borderRadius:    '12px',
            overflow:        'hidden',
            boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
          }}>
            <QuoteList
              projectId={projectId}
              quotes={quotes}
              onView={(q) => setActiveQuote(q)}
              onAdd={addQuote}
              onUpdate={(id, changes) => updateQuote(id, changes)}
              onDelete={deleteQuote}
            />
          </div>
        )
      )}

      {/* ── Members tab (host only) ───────────────────────────────────────────── */}
      {activeTab === 'members' && canMembers && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Tab header con botón "+ Invitar" */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {isOwner && (
              <button
                onClick={() => {
                  loadAvailableContacts();
                  setShowContactPicker(true);
                }}
                style={{
                  display:         'inline-flex',
                  alignItems:      'center',
                  gap:             '6px',
                  padding:         '7px 14px',
                  borderRadius:    '8px',
                  border:          '1px solid #6941c6',
                  backgroundColor: '#7f56d9',
                  color:           '#fff',
                  fontSize:        '13px',
                  fontWeight:      500,
                  cursor:          'pointer',
                  boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
                  fontFamily:      'inherit',
                  transition:      'background-color 0.15s',
                  whiteSpace:      'nowrap',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
              >
                <UserPlusIcon /> Invitar
              </button>
            )}
          </div>

          <MembersPanel
            members={members}
            currentUserId={currentUserId}
            onAdd={addMember}
            onChangeRole={changeMemberRole}
            onRemove={removeMember}
          />
        </div>
      )}

      {/* Task modal */}
      {modalOpen && canEdit && (
        <TaskFormModal
          initialTask={isEditMode ? modalTask : null}
          allTasks={tasks}
          onClose={() => setModalTask(null)}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* Contact picker modal — solo owner, solo cuando está abierto */}
      {showContactPicker && isOwner && (
        <ContactPickerModal
          availableContacts={availableContacts}
          contactsLoading={contactsLoading}
          onAdd={addMemberFromContact}
          onInvite={inviteByEmail}
          onClose={() => setShowContactPicker(false)}
        />
      )}

      {/* Gantt share modal — solo owner */}
      {showGanttShare && isOwner && (
        <ShareGanttModal
          projectId={projectId}
          isOpen={showGanttShare}
          onClose={() => setShowGanttShare(false)}
        />
      )}

    </div>
  );
}
