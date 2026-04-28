import { useState } from 'react';
import MeetingForm from './MeetingForm';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function fmtTime(time) {
  return time || '';
}

function isSameDay(dateStr, y, m, d) {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  return (
    parseInt(parts[0]) === y &&
    parseInt(parts[1]) - 1 === m &&
    parseInt(parts[2]) === d
  );
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-first: 0=Mon…6=Sun
function getFirstDayOffset(year, month) {
  const dow = new Date(year, month, 1).getDay(); // 0=Sun
  return dow === 0 ? 6 : dow - 1;
}

function isToday(y, m, d) {
  const t = new Date();
  return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
}

// ─── Day cell ─────────────────────────────────────────────────────────────────
function DayCell({ day, year, month, meetings, isCurrentMonth, onSelectDay, selectedDay }) {
  if (!isCurrentMonth) {
    return <div style={{ minHeight: '80px', backgroundColor: '#fafafa', borderRadius: '8px' }} />;
  }

  const today    = isToday(year, month, day);
  const selected = selectedDay === day;
  const hasMeet  = meetings.length > 0;
  const visible  = meetings.slice(0, 2);
  const overflow = meetings.length - 2;

  return (
    <div
      onClick={() => onSelectDay(day)}
      style={{
        minHeight:       '80px',
        padding:         '6px',
        borderRadius:    '8px',
        border:          selected
          ? '2px solid #7f56d9'
          : today
          ? '1.5px solid #d9c9ff'
          : '1px solid #f2f4f7',
        backgroundColor: selected
          ? '#faf5ff'
          : today
          ? '#faf5ff'
          : '#fff',
        cursor:          'pointer',
        transition:      'border-color 0.1s, background-color 0.1s',
        display:         'flex',
        flexDirection:   'column',
        gap:             '3px',
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = '#c4b5fd'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = selected ? '#7f56d9' : today ? '#d9c9ff' : '#f2f4f7'; }}
    >
      {/* Day number */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{
          fontSize:        '12px',
          fontWeight:      today ? 700 : 500,
          color:           today ? '#7f56d9' : '#344054',
          width:           '22px',
          height:          '22px',
          borderRadius:    '50%',
          backgroundColor: today ? '#ede9fe' : 'transparent',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          lineHeight:      1,
        }}>
          {day}
        </span>
      </div>

      {/* Meeting chips */}
      {visible.map((m) => (
        <div
          key={m.id}
          title={m.title}
          style={{
            fontSize:        '10px',
            fontWeight:      500,
            padding:         '2px 5px',
            borderRadius:    '4px',
            backgroundColor: '#ede9fe',
            color:           '#6941c6',
            whiteSpace:      'nowrap',
            overflow:        'hidden',
            textOverflow:    'ellipsis',
          }}
        >
          {m.time && <span style={{ opacity: 0.7, marginRight: '3px' }}>{fmtTime(m.time)}</span>}
          {m.title}
        </div>
      ))}

      {overflow > 0 && (
        <div style={{ fontSize: '10px', color: '#98a2b3', paddingLeft: '5px' }}>
          +{overflow} más
        </div>
      )}
    </div>
  );
}

// ─── Day detail panel ─────────────────────────────────────────────────────────
function DayDetail({ day, year, month, meetings, users, projects, onNew, onEdit, onDelete }) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const label   = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  function fmtDuration(m) {
    if (!m) return '';
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60); const r = m % 60;
    return r ? `${h}h ${r}min` : `${h}h`;
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      border:          '1px solid #eaecf0',
      borderRadius:    '12px',
      overflow:        'hidden',
      boxShadow:       '0px 1px 3px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f2f4f7', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#344054', textTransform: 'capitalize' }}>{label}</span>
        <button
          onClick={onNew}
          style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #6941c6', backgroundColor: '#7f56d9', color: '#fff', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
        >
          + Agregar
        </button>
      </div>

      {/* Meetings list */}
      {meetings.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: '#98a2b3', fontSize: '13px' }}>
          Sin reuniones este día.
        </div>
      ) : (
        <div style={{ padding: '8px 0' }}>
          {meetings.map((m) => {
            const proj = projects.find((p) => p.id === m.projectId);
            const participants = (m.participantIds ?? [])
              .map((uid) => users.find((u) => u.id === uid)?.name)
              .filter(Boolean);
            return (
              <div
                key={m.id}
                style={{
                  padding:         '10px 16px',
                  borderBottom:    '1px solid #f9fafb',
                  display:         'flex',
                  gap:             '12px',
                  alignItems:      'flex-start',
                }}
              >
                {/* Time indicator */}
                <div style={{
                  flexShrink:      0,
                  width:           '48px',
                  fontSize:        '12px',
                  fontWeight:      600,
                  color:           '#6941c6',
                  textAlign:       'right',
                  paddingTop:      '2px',
                }}>
                  {m.time || '—'}
                </div>
                {/* Accent */}
                <div style={{ width: '3px', borderRadius: '2px', backgroundColor: '#7f56d9', flexShrink: 0, alignSelf: 'stretch' }} />
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#101828' }}>{m.title}</div>
                  <div style={{ fontSize: '11px', color: '#98a2b3', marginTop: '2px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {m.duration && <span>{fmtDuration(m.duration)}</span>}
                    {proj        && <span>· {proj.name}</span>}
                    {participants.length > 0 && <span>· {participants.join(', ')}</span>}
                  </div>
                  {m.description && (
                    <div style={{ fontSize: '12px', color: '#667085', marginTop: '4px' }}>{m.description}</div>
                  )}
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {[
                    { label: '✎', action: () => onEdit(m), title: 'Editar', danger: false },
                    { label: '✕', action: () => onDelete(m.id), title: 'Eliminar', danger: true },
                  ].map(({ label, action, title, danger }) => (
                    <button key={title} onClick={action} title={title} style={{ width: '24px', height: '24px', borderRadius: '5px', border: '1px solid #eaecf0', backgroundColor: '#fff', color: danger ? '#f04438' : '#667085', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = danger ? '#fff1f0' : '#f9fafb'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   meetings   — all meetings array
 *   projects
 *   users
 *   onAdd(m)
 *   onUpdate(id, changes)
 *   onDelete(id)
 */
export default function MeetingCalendar({ meetings, projects, users, onAdd, onUpdate, onDelete }) {
  const now  = new Date();
  const [year,  setYear]        = useState(now.getFullYear());
  const [month, setMonth]       = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [modal, setModal]       = useState(null); // null | 'new' | <meeting>

  const daysInMonth    = getDaysInMonth(year, month);
  const firstDayOffset = getFirstDayOffset(year, month);

  // Meetings for this month
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthMeetings = meetings.filter((m) => m.date?.startsWith(monthStr));

  // Meetings for selected day
  const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const dayMeetings = meetings
    .filter((m) => m.date === selectedDateStr)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else              setMonth((m) => m - 1);
    setSelectedDay(1);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else               setMonth((m) => m + 1);
    setSelectedDay(1);
  }

  function getMeetingsForDay(d) {
    return monthMeetings.filter((m) => isSameDay(m.date, year, month, d));
  }

  function handleSubmit(meeting) {
    // modal.id means we are editing an existing meeting
    if (modal?.id) onUpdate(meeting.id, meeting);
    else           onAdd(meeting);
  }

  // Build calendar grid cells
  const cells = [];
  for (let i = 0; i < firstDayOffset; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  // Pad to complete last week
  while (cells.length % 7 !== 0) cells.push({ day: null });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Calendar header */}
      <div style={{
        backgroundColor: '#fff',
        border:          '1px solid #eaecf0',
        borderRadius:    '12px',
        overflow:        'hidden',
        boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
      }}>
        {/* Month navigator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #f2f4f7' }}>
          <button onClick={prevMonth} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #eaecf0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#667085' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
          >
            ‹
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#101828' }}>
              {MONTHS[month]} {year}
            </div>
            <div style={{ fontSize: '11px', color: '#98a2b3', marginTop: '1px' }}>
              {monthMeetings.length} reunión{monthMeetings.length !== 1 ? 'es' : ''}
            </div>
          </div>
          <button onClick={nextMonth} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #eaecf0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#667085' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
          >
            ›
          </button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px 12px 0' }}>
          {WEEKDAYS.map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: '8px' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', padding: '0 12px 12px' }}>
          {cells.map(({ day }, idx) => (
            <DayCell
              key={idx}
              day={day}
              year={year}
              month={month}
              meetings={day ? getMeetingsForDay(day) : []}
              isCurrentMonth={day !== null}
              onSelectDay={setSelectedDay}
              selectedDay={selectedDay}
            />
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      <DayDetail
        day={selectedDay}
        year={year}
        month={month}
        meetings={dayMeetings}
        users={users}
        projects={projects}
        onNew={() => {
          // Pre-fill the date for the selected day
          setModal({ date: selectedDateStr, projectId: '', title: '', time: '', duration: 60, description: '', participantIds: [] });
        }}
        onEdit={(m) => setModal(m)}
        onDelete={onDelete}
      />

      {/* Form modal */}
      {modal && (
        <MeetingForm
          initialMeeting={modal}
          projects={projects}
          users={users}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
