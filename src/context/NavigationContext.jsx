import { createContext, useContext, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
export const PAGES = {
  DASHBOARD:       'dashboard',
  PROJECTS:        'projects',
  PROJECTS_MINE:   'projects-mine',
  PROJECTS_SHARED: 'projects-shared',
  PROJECT_DETAIL:  'project-detail',
  TASKS:           'tasks',
  USERS:           'users',
  QUOTES:          'quotes',
  MEETINGS:        'meetings',
  ACCOUNT:         'account',
};

export const PAGE_LABELS = {
  [PAGES.DASHBOARD]:       'Dashboard',
  [PAGES.PROJECTS]:        'Proyectos',
  [PAGES.PROJECTS_MINE]:   'Mis proyectos',
  [PAGES.PROJECTS_SHARED]: 'Proyectos compartidos',
  [PAGES.PROJECT_DETAIL]:  'Detalle del proyecto',
  [PAGES.TASKS]:           'Tareas',
  [PAGES.USERS]:           'Contactos',
  [PAGES.QUOTES]:          'Cotizaciones',
  [PAGES.MEETINGS]:        'Reuniones',
  [PAGES.ACCOUNT]:         'Mi cuenta',
};

// ─── Context ──────────────────────────────────────────────────────────────────
const NavigationContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function NavigationProvider({ children }) {
  const [view, setView] = useState({ page: PAGES.DASHBOARD, params: {} });

  /** Navigate to a page with optional params */
  function navigate(page, params = {}) {
    setView({ page, params });
  }

  /** Go back to the previous logical parent (simple one-level back) */
  function goBack() {
    if (
      view.page === PAGES.PROJECT_DETAIL ||
      view.page === PAGES.PROJECTS_MINE  ||
      view.page === PAGES.PROJECTS_SHARED
    ) {
      setView({ page: PAGES.PROJECTS, params: {} });
    } else {
      setView({ page: PAGES.DASHBOARD, params: {} });
    }
  }

  return (
    <NavigationContext.Provider value={{ view, navigate, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used inside <NavigationProvider>');
  return ctx;
}
