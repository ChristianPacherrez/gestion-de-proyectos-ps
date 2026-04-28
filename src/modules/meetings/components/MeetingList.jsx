import { useState } from 'react';
import MeetingForm from './MeetingForm';
import { downloadICS } from '../utils/exportICS';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtDuration(minutes) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div style={{
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '56px 24px',
      gap:             '10px',
      backgroundColor: '#fff',
      border:          '1px dashed #d0d5dd',
      borderRadius:    '12px',
    }}>
      <span style={{ fontSize: '28px', opacity: 0.3 }}>📅</span>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#344054' }}>
        No hay reuniones agendadas
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: '#667085' }}>
        Crea la primera reunión para este proyecto o vista global.
      </p>
      <button
        onClick={onNew}
        style={{ marginTop: '8px', padding: '7px 16px', borderRadius: '8px', border: '1px solid #6941c6', backgroundColor: '#7f56d9', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
      >
        + Nueva reunión
      </button>
    </div>
  );
}

// ─── Participant avatars ──────────────────────────────────────────────────────
function ParticipantAvatars({ participantIds, users, max = 4 }) {
  if (!participantIds?.length) return null;
  const visible  = participantIds.slice(0, max);
  const overflow = participantIds.length - max;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((uid, i) => {
        const user = users.find((u) => u.id === uid);
        if (!user) return null;
        return (
          <div
            key={uid}
            title={user.name}
            style={{
              width:           '24px',
              height:          '24px',
              borderRadius:    '50%',
              backgroundColor: '#f4f3ff',
              border:          '2px solid #fff',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        '9px',
              fontWeight:      700,
              color:           '#6941c6',
              marginLeft:      i === 0 ? 0 : '-6px',
              flexShrink:      0,
            }}
          >
            {user.initials}
          </div>
        );
      })}
      {overflow > 0 && (
        <div style={{
          width:           '24px',
          height:          '24px',
          borderRadius:    '50%',
          backgroundColor: '#f2f4f7',
          border:          '2px solid #fff',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          fontSize:        '9px',
          fontWeight:      700,
          color:           '#667085',
          marginLeft:      '-6px',
        }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ─── Meeting row ──────────────────────────────────────────────────────────────
function MeetingRow({ meeting, projectName, users, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPast = meeting.date < new Date().toISOString().slice(0, 10);

  return (
    <div
      style={{
        display:             'grid',
        gridTemplateColumns: '1fr 140px 90px 80px 80px 36px',
        alignItems:          'center',
        padding:             '12px 16px',
        borderBottom:        '1px solid #f2f4f7',
        transition:          'background-color 0.1s',
        opacity:             isPast ? 0.65 : 1,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {/* Title + description */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#101828', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {meeting.title}
        </div>
        {meeting.description && (
          <div style={{ fontSize: '12px', color: '#98a2b3', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {meeting.description}
          </div>
        )}
      </div>

      {/* Date + time */}
      <div>
        <div style={{ fontSize: '13px', color: '#344054', fontWeight: 500 }}>{fmtDate(meeting.date)}</div>
        {meeting.time && (
          <div style={{ fontSize: '11px', color: '#98a2b3', marginTop: '1px' }}>{meeting.time}</div>
        )}
      </div>

      {/* Duration */}
      <span style={{ fontSize: '12px', color: '#667085' }}>{fmtDuration(meeting.duration)}</span>

      {/* Participants */}
      <ParticipantAvatars participantIds={meeting.participantIds} users={users} />

      {/* Project badge */}
      {projectName ? (
        <span style={{
          fontSize:        '11px',
          fontWeight:      500,
          padding:         '2px 8px',
          borderRadius:    '9999px',
          backgroundColor: '#f4f3ff',
          color:           '#6941c6',
          border:          '1px solid #e9d7fe',
          whiteSpace:      'nowrap',
          overflow:        'hidden',
          textOverflow:    'ellipsis',
          maxWidth:        '80px',
        }}>
          {projectName}
        </span>
      ) : <span />}

      {/* Context menu */}
      <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Opciones"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#98a2b3', padding: '2px 6px', borderRadius: '4px' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f2f4f7'; e.currentTarget.style.color = '#344054'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#98a2b3'; }}
        >
          ⋯
        </button>
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', right: 0,
              backgroundColor: '#fff', border: '1px solid #eaecf0',
              borderRadius: '8px', boxShadow: '0px 8px 16px -4px rgba(0,0,0,0.08)',
              minWidth: '130px', zIndex: 50, overflow: 'hidden',
            }}>
              {[
                { label: 'Editar',             action: () => { onEdit(meeting);                             setMenuOpen(false); }, color: '#344054' },
                { label: 'Exportar (.ics)',    action: () => { downloadICS(meeting, `${meeting.title}.ics`); setMenuOpen(false); }, color: '#344054' },
                { label: 'Eliminar',           action: () => { onDelete(meeting.id);                        setMenuOpen(false); }, color: '#f04438' },
              ].map(({ label, action, color }) => (
                <button key={label} onClick={action} style={{ display: 'block', width: '100%', padding: '9px 14px', border: 'none', backgroundColor: '#fff', color, fontSize: '13px', textAlign: 'left', cursor: 'pointer', transition: 'background-color 0.1s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   meetings   — sorted array of meetings
 *   projects   — array for the form select
 *   users      — array for participants
 *   onAdd(m)
 *   onUpdate(id, changes)
 *   onDelete(id)
 *   defaultProjectId — pre-select project in form (optional)
 */
export default function MeetingList({ meetings, projects, users, onAdd, onUpdate, onDelete, defaultProjectId }) {
  const [modal, setModal] = useState(null); // null | 'new' | <meeting>

  function handleSubmit(meeting) {
    if (modal === 'new') onAdd(meeting);
    else                 onUpdate(meeting.id, meeting);
  }

  function getProjectName(projectId) {
    return projects.find((p) => p.id === projectId)?.name ?? null;
  }

  const emptyMeetingTemplate = defaultProjectId
    ? { ...Object.fromEntries(Object.entries({ title: '', projectId: defaultProjectId, date: '', time: '', duration: 60, description: '', participantIds: [] })) }
    : null;

  return (
    <div>
      {meetings.length === 0 ? (
        <EmptyState onNew={() => setModal('new')} />
      ) : (
        <div style={{ backgroundColor: '#fff', border: '1px solid #eaecf0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px 80px 80px 36px', padding: '8px 16px', borderBottom: '2px solid #eaecf0', backgroundColor: '#f9fafb' }}>
            {['Reunión', 'Fecha', 'Duración', 'Asistentes', 'Proyecto', ''].map((h) => (
              <span key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {meetings.map((m) => (
            <MeetingRow
              key={m.id}
              meeting={m}
              projectName={getProjectName(m.projectId)}
              users={users}
              onEdit={(mt) => setModal(mt)}
              onDelete={onDelete}
            />
          ))}

          {/* Add button */}
          <div style={{ padding: '12px 16px' }}>
            <button
              onClick={() => setModal('new')}
              style={{ padding: '6px 14px', borderRadius: '7px', border: '1px solid #d0d5dd', backgroundColor: '#fff', color: '#344054', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'background-color 0.1s' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
            >
              + Nueva reunión
            </button>
          </div>
        </div>
      )}

      {modal && (
        <MeetingForm
          initialMeeting={modal === 'new' ? emptyMeetingTemplate : modal}
          projects={projects}
          users={users}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
