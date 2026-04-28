import { useState } from 'react';
import { useMeetings }  from '../hooks/useMeetings';
import { useProjects }  from '../../projects/hooks/useProjects';
import { useUsers }     from '../../users/hooks/useUsers';
import { MeetingList, MeetingCalendar } from '../components';
import { downloadICS }  from '../utils/exportICS';

const TABS = [
  { id: 'list',     label: 'Lista' },
  { id: 'calendar', label: 'Calendario' },
];

export default function MeetingsPage() {
  const [activeTab, setActiveTab] = useState('list');
  const { meetings, addMeeting, updateMeeting, deleteMeeting } = useMeetings();
  const { projects } = useProjects();
  const { users }    = useUsers();

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#101828' }}>Reuniones</h1>
          <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#667085' }}>
            {meetings.length === 0
              ? 'Sin reuniones agendadas'
              : `${meetings.length} reunión${meetings.length !== 1 ? 'es' : ''} en total`}
          </p>
        </div>
        {meetings.length > 0 && (
          <button
            onClick={() => downloadICS(meetings, 'reuniones.ics')}
            title="Descargar todas las reuniones como archivo .ics"
            style={{
              display:         'flex',
              alignItems:      'center',
              gap:             '6px',
              padding:         '7px 14px',
              borderRadius:    '8px',
              border:          '1px solid #d0d5dd',
              backgroundColor: '#fff',
              color:           '#344054',
              fontSize:        '13px',
              fontWeight:      500,
              cursor:          'pointer',
              transition:      'background-color 0.1s, border-color 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.borderColor = '#98a2b3'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff';    e.currentTarget.style.borderColor = '#d0d5dd'; }}
          >
            <span style={{ fontSize: '14px' }}>⬇</span>
            Exportar a calendario
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        display:         'flex',
        gap:             '2px',
        backgroundColor: '#f2f4f7',
        borderRadius:    '10px',
        padding:         '3px',
        width:           'fit-content',
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding:         '6px 18px',
                borderRadius:    '8px',
                border:          'none',
                cursor:          'pointer',
                fontSize:        '13px',
                fontWeight:      isActive ? 600 : 400,
                color:           isActive ? '#344054' : '#667085',
                backgroundColor: isActive ? '#fff' : 'transparent',
                boxShadow:       isActive ? '0px 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition:      'background-color 0.1s, color 0.1s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'list' ? (
        <MeetingList
          meetings={meetings}
          projects={projects}
          users={users}
          onAdd={addMeeting}
          onUpdate={updateMeeting}
          onDelete={deleteMeeting}
        />
      ) : (
        <MeetingCalendar
          meetings={meetings}
          projects={projects}
          users={users}
          onAdd={addMeeting}
          onUpdate={updateMeeting}
          onDelete={deleteMeeting}
        />
      )}
    </div>
  );
}
