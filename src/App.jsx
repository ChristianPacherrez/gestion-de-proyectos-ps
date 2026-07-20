import { NavigationProvider, useNavigation, PAGES } from './context/NavigationContext';
import { AuthProvider, useAuth }  from './context/AuthContext';
import { WorkspaceProvider }      from './context/WorkspaceContext';
import { ProjectsProvider }       from './modules/projects/context/ProjectsContext';
import { UsersProvider }          from './modules/users/context/UsersContext';
import { QuotesProvider }         from './modules/quotes/context/QuotesContext';
import { MeetingsProvider }       from './modules/meetings/context/MeetingsContext';
import MainLayout                 from './layouts/MainLayout';
import Dashboard                  from './pages/Dashboard';
import LoginPage                  from './pages/LoginPage';
import ProjectsPage               from './modules/projects/pages/ProjectsPage';
import ProjectDetail              from './modules/projects/pages/ProjectDetail';
import TasksPage                  from './modules/tasks/pages/TasksPage';
import UsersPage                  from './modules/users/pages/UsersPage';
import QuotesPage                 from './modules/quotes/pages/QuotesPage';
import MeetingsPage               from './modules/meetings/pages/MeetingsPage';
import AccountPage                from './modules/account/pages/AccountPage';
import PublicBriefPage            from './modules/projects/components/PublicBriefPage';
import PublicGanttPage            from './modules/projects/components/PublicGanttPage';
import ForgotPasswordPage         from './pages/ForgotPasswordPage';
import ResetPasswordPage          from './pages/ResetPasswordPage';

// ─── Public route detection ───────────────────────────────────────────────────
// All checks run BEFORE AuthProvider so these pages work without a session.

function getPublicBriefToken() {
  const match = window.location.pathname.match(/^\/brief\/public\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

function getPublicGanttToken() {
  const match = window.location.pathname.match(/^\/share\/gantt\/([^/]+)\/?$/);
  return match ? match[1] : null;
}

function isForgotPasswordRoute() {
  return window.location.pathname === '/forgot-password';
}

function isResetPasswordRoute() {
  return window.location.pathname === '/reset-password';
}

// ─── Page router ──────────────────────────────────────────────────────────────
function AppContent() {
  const { view } = useNavigation();

  switch (view.page) {
    case PAGES.DASHBOARD:
      return <Dashboard />;
    case PAGES.PROJECTS:
      return <ProjectsPage view="all" />;
    case PAGES.PROJECTS_MINE:
      return <ProjectsPage view="mine" />;
    case PAGES.PROJECTS_SHARED:
      return <ProjectsPage view="shared" />;
    case PAGES.PROJECT_DETAIL:
      return <ProjectDetail projectId={view.params.projectId} />;
    case PAGES.TASKS:
      return <TasksPage />;
    case PAGES.USERS:
      return <UsersPage />;
    case PAGES.QUOTES:
      return <QuotesPage />;
    case PAGES.MEETINGS:
      return <MeetingsPage />;
    case PAGES.ACCOUNT:
      return <AccountPage />;
    default:
      return <Dashboard />;
  }
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      flexDirection:  'column',
      gap:            '16px',
    }}>
      {/* Spinning ring */}
      <div style={{
        width:       '40px',
        height:      '40px',
        borderRadius: '50%',
        border:      '3px solid #ede9fe',
        borderTopColor: '#7f56d9',
        animation:   'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: '14px', color: '#667085' }}>Cargando…</span>
    </div>
  );
}

// ─── Auth gate — decides what to render based on auth state ──────────────────
function AppGate() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)   return <LoginPage />;

  // Authenticated: render full app with all providers
  return (
    <NavigationProvider>
      <UsersProvider>
        <WorkspaceProvider>
          <ProjectsProvider>
            <QuotesProvider>
              <MeetingsProvider>
                <MainLayout>
                  <AppContent />
                </MainLayout>
              </MeetingsProvider>
            </QuotesProvider>
          </ProjectsProvider>
        </WorkspaceProvider>
      </UsersProvider>
    </NavigationProvider>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── Public routes — rendered BEFORE auth gate, no session required ──────────
  const publicToken      = getPublicBriefToken();
  const publicGanttToken = getPublicGanttToken();
  if (publicToken)           return <PublicBriefPage token={publicToken} />;
  if (publicGanttToken)      return <PublicGanttPage token={publicGanttToken} />;
  if (isForgotPasswordRoute()) return <ForgotPasswordPage />;
  if (isResetPasswordRoute())  return <ResetPasswordPage />;

  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
