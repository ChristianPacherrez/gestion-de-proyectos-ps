import { useState } from 'react';
import { useNavigation, PAGES }              from '../../../context/NavigationContext';
import { CreateProjectModal, ProjectList }   from '../components';
import { useProjects }                       from '../hooks/useProjects';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: 'all',       label: 'Todos' },
  { value: 'active',    label: 'Activos' },
  { value: 'paused',    label: 'Pausados' },
  { value: 'completed', label: 'Completados' },
];

const VIEW_META = {
  mine:   { title: 'Mis proyectos',  canCreate: true  },
  shared: { title: 'Compartidos',    canCreate: false },
  all:    { title: 'Proyectos',      canCreate: false },
};

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ view, onNew }) {
  const messages = {
    mine: {
      icon:  '◫',
      title: 'No tienes proyectos todavía',
      body:  'Crea tu primer proyecto para empezar a organizar tu trabajo.',
    },
    shared: {
      icon:  '◈',
      title: 'Sin proyectos compartidos',
      body:  'Cuando alguien te invite a colaborar en un proyecto, aparecerá aquí.',
    },
    all: {
      icon:  '◫',
      title: 'No hay proyectos',
      body:  'Aún no hay proyectos. Dirígete a "Mis proyectos" para crear el primero.',
    },
  };

  const cfg = messages[view] ?? messages.all;

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '64px 24px',
      gap:            '12px',
      textAlign:      'center',
    }}>
      <div style={{
        width:           '48px',
        height:          '48px',
        borderRadius:    '12px',
        backgroundColor: '#f4f3ff',
        borderWidth:     '1px',
        borderStyle:     'solid',
        borderColor:     '#e9d7fe',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        fontSize:        '22px',
      }}>
        {cfg.icon}
      </div>

      <div>
        <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600, color: '#101828' }}>
          {cfg.title}
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: '#667085', maxWidth: '320px' }}>
          {cfg.body}
        </p>
      </div>

      {view === 'mine' && (
        <button
          onClick={onNew}
          style={{
            marginTop:       '4px',
            padding:         '8px 16px',
            borderRadius:    '8px',
            borderWidth:     '1px',
            borderStyle:     'solid',
            borderColor:     '#6941c6',
            backgroundColor: '#7f56d9',
            color:           '#fff',
            fontSize:        '13px',
            fontWeight:      500,
            cursor:          'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
        >
          + Crear proyecto
        </button>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
/**
 * Props
 *   view?  "mine" | "shared" | "all"  (default "all")
 *          Driven exclusively by App.jsx routing — no internal state.
 *          Sidebar is the single source of truth for which view is active.
 */
export default function ProjectsPage({ view = 'all' }) {
  const { navigate }   = useNavigation();
  const {
    myProjects,
    sharedProjects,
    dbLoading,
    saveError,
    clearSaveError,
    addProject,
    updateProject,
    deleteProject,
  } = useProjects();

  // ── Local state (UI only — no view state, no tabs) ───────────────────────────
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalProject, setModalProject] = useState(null);

  // ── Derived ─────────────────────────────────────────────────────────────────

  // Select the base list from the prop — never from internal state
  const baseList = view === 'mine'
    ? myProjects
    : view === 'shared'
      ? sharedProjects
      : [...myProjects, ...sharedProjects];   // 'all'

  const visibleList = statusFilter === 'all'
    ? baseList
    : baseList.filter((p) => p.status === statusFilter);

  const meta       = VIEW_META[view] ?? VIEW_META.all;
  const isEditMode = modalProject !== null && modalProject !== 'new';
  const modalOpen  = modalProject !== null;

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleModalSubmit(project) {
    if (isEditMode) updateProject(project.id, project);
    else            addProject(project);
  }

  function handleSelectProject(project) {
    navigate(PAGES.PROJECT_DETAIL, { projectId: project.id });
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {saveError && (
        <div style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          gap:             '12px',
          padding:         '10px 16px',
          marginBottom:    '16px',
          borderRadius:    '8px',
          backgroundColor: '#fff3f2',
          borderWidth:     '1px',
          borderStyle:     'solid',
          borderColor:     '#fecdca',
          fontSize:        '13px',
          color:           '#b42318',
        }}>
          <span>⚠ Error al guardar: <strong>{saveError}</strong></span>
          <button
            onClick={clearSaveError}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b42318', fontSize: '16px', lineHeight: 1 }}
          >✕</button>
        </div>
      )}

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        gap:            '16px',
        flexWrap:       'wrap',
        marginBottom:   '20px',
      }}>
        {/* Title — driven by view prop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#101828' }}>
            {meta.title}
          </h1>
          {dbLoading && (
            <span style={{
              display:        'inline-block',
              width:          '10px',
              height:         '10px',
              borderRadius:   '50%',
              borderWidth:    '2px',
              borderStyle:    'solid',
              borderColor:    '#d0d5dd',
              borderTopColor: '#7f56d9',
              animation:      'spin 0.7s linear infinite',
              flexShrink:     0,
            }} />
          )}
        </div>

        {/* "Nuevo proyecto" — only visible in "Mis proyectos" */}
        {meta.canCreate && (
          <button
            onClick={() => setModalProject('new')}
            style={{
              padding:         '8px 14px',
              borderRadius:    '8px',
              borderWidth:     '1px',
              borderStyle:     'solid',
              borderColor:     '#6941c6',
              backgroundColor: '#7f56d9',
              color:           '#fff',
              fontSize:        '13px',
              fontWeight:      500,
              cursor:          'pointer',
              boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
              alignSelf:       'flex-start',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
          >
            + Nuevo proyecto
          </button>
        )}
      </div>

      {/* ── Status filter ───────────────────────────────────────────────────── */}
      <div style={{
        display:         'flex',
        gap:             '2px',
        borderBottom:    '1px solid #f2f4f7',
        backgroundColor: '#fafafa',
        padding:         '0 2px',
        marginBottom:    '20px',
      }}>
        {STATUS_FILTERS.map(({ value, label }) => {
          const isActive = statusFilter === value;
          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              style={{
                padding:      '7px 11px',
                fontSize:     '12px',
                fontWeight:   isActive ? 600 : 400,
                color:        isActive ? '#6941c6' : '#667085',
                background:   'none',
                border:       'none',
                borderBottom: isActive ? '2px solid #7f56d9' : '2px solid transparent',
                cursor:       'pointer',
                marginBottom: '-1px',
                transition:   'color 0.1s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Project content ─────────────────────────────────────────────────── */}
      {visibleList.length === 0 ? (
        <EmptyState
          view={view}
          onNew={() => setModalProject('new')}
        />
      ) : (
        <ProjectList
          projects={visibleList}
          onSelect={handleSelectProject}
          onEdit={view === 'mine'   ? (p) => setModalProject(p) : undefined}
          onDelete={view === 'mine' ? deleteProject             : undefined}
        />
      )}

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <CreateProjectModal
          initialProject={isEditMode ? modalProject : null}
          onClose={() => setModalProject(null)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}
