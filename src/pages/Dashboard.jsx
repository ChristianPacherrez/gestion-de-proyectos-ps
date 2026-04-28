import { useState }                             from 'react';
import { useNavigation, PAGES }                  from '../context/NavigationContext';
import { useProjects }                           from '../modules/projects/hooks/useProjects';
import { useAuth }                               from '../context/AuthContext';
import { CreateProjectModal, ProjectList }       from '../modules/projects/components';
import DashboardKPI                              from './DashboardKPI';
import DashboardAttention                        from './DashboardAttention';
import DashboardProjectProgress                  from './DashboardProjectProgress';
import DashboardActivityFeed                     from './DashboardActivityFeed';

// ─── Greeting ─────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { navigate }  = useNavigation();
  const { user }      = useAuth();
  const {
    projects,
    myProjects,
    activeProjects,
    completedProjects,
    pausedProjects,
    addProject,
    updateProject,
    deleteProject,
  } = useProjects();

  const [modalProject, setModalProject] = useState(null);

  const isEditMode = modalProject !== null && modalProject !== 'new';
  const modalOpen  = modalProject !== null;

  function handleModalSubmit(project) {
    if (isEditMode) updateProject(project.id, project);
    else            addProject(project);
  }

  function handleSelectProject(project) {
    navigate(PAGES.PROJECT_DETAIL, { projectId: project.id });
  }

  // Derive display name from user metadata or email
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name      ||
    user?.email?.split('@')[0]     ||
    null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Greeting + New project button ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary, #101828)' }}>
            {getGreeting()}{displayName ? `, ${displayName}` : ''} 👋
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--color-text-secondary, #475467)' }}>
            Aquí tienes un resumen de tus proyectos.
          </p>
        </div>
        <button
          onClick={() => setModalProject('new')}
          style={{
            padding:         '8px 14px',
            borderRadius:    '8px',
            border:          '1px solid #6941c6',
            backgroundColor: '#7f56d9',
            color:           '#fff',
            fontSize:        '13px',
            fontWeight:      500,
            cursor:          'pointer',
            boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
        >
          + Nuevo proyecto
        </button>
      </div>

      {/* ── KPI cards ── */}
      <DashboardKPI
        total     ={projects.length}
        active    ={activeProjects.length}
        paused    ={pausedProjects.length}
        completed ={completedProjects.length}
      />

      {/* ── Attention + Progress (2-col on wide screens) ── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap:                 '24px',
        alignItems:          'start',
      }}>
        <DashboardAttention
          projects={projects}
          onSelect={handleSelectProject}
        />
        <DashboardProjectProgress
          projects={projects}
          onSelect={handleSelectProject}
        />
      </div>

      {/* ── Activity feed ── */}
      <DashboardActivityFeed
        projects={projects}
        onSelect={handleSelectProject}
      />

      {/* ── Recent projects list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary, #101828)' }}>
            Mis proyectos recientes
          </h2>
          <button
            onClick={() => navigate(PAGES.PROJECTS)}
            style={{ fontSize: '13px', color: '#6941c6', cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', padding: 0 }}
          >
            Ver todos →
          </button>
        </div>
        <ProjectList
          projects={myProjects.slice(0, 3)}
          onSelect={handleSelectProject}
          onEdit={(project) => setModalProject(project)}
          onDelete={deleteProject}
        />
      </div>

      {/* ── Modal ── */}
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
