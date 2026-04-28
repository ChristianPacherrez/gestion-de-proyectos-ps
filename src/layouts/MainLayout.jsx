import { useState } from 'react';
import { APP_NAME }                        from '../config/app';
import { useNavigation, PAGES, PAGE_LABELS } from '../context/NavigationContext';
import { useUsers }                        from '../modules/users/hooks/useUsers';
import { useAuth }                         from '../context/AuthContext';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
// All icons follow the same stroke/fill API — just pass `size` if needed.

function IconGrid({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3"  y="3"  width="8" height="8" rx="1.5" />
      <rect x="13" y="3"  width="8" height="8" rx="1.5" />
      <rect x="3"  y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconFolder({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconUsers({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconSettings({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconChevronRight({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function IconList({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6"  x2="21" y2="6"  />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6"  x2="3.01" y2="6"  />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function IconUser({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconShare({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5"  r="3" />
      <circle cx="6"  cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49" />
    </svg>
  );
}

function IconPanelLeft({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  brand:       '#7f56d9',
  brandDark:   '#6941c6',
  brandBg:     '#f4f3ff',
  brandSubtle: '#ede9fe',
  text1:       '#101828',
  text2:       '#344054',
  text3:       '#475467',
  text4:       '#667085',
  text5:       '#98a2b3',
  border1:     '#eaecf0',
  border2:     '#f2f4f7',
  bgHover:     '#f9fafb',
};

// ─── Pages that belong to the "Proyectos" group ────────────────────────────
const PROJECTS_GROUP = new Set([
  PAGES.PROJECTS,
  PAGES.PROJECTS_MINE,
  PAGES.PROJECTS_SHARED,
  PAGES.PROJECT_DETAIL,
]);

// ─── Menu config — easy to extend ─────────────────────────────────────────────
//
// Shape:
//   { page, label, icon }                   — regular item
//   { page, label, icon, children: [...] }  — group with submenu
//
// To add "Cotizaciones" in the future:
//   { page: PAGES.QUOTES, label: 'Cotizaciones', icon: IconReceipt }

const NAV_ITEMS = [
  {
    page:  PAGES.DASHBOARD,
    label: 'Dashboard',
    icon:  IconGrid,
  },
  {
    page:     PAGES.PROJECTS,
    label:    'Proyectos',
    icon:     IconFolder,
    children: [
      { page: PAGES.PROJECTS,        label: 'Todos',         icon: IconList  },
      { page: PAGES.PROJECTS_MINE,   label: 'Mis proyectos', icon: IconUser  },
      { page: PAGES.PROJECTS_SHARED, label: 'Compartidos',   icon: IconShare },
    ],
  },
  {
    page:  PAGES.USERS,
    label: 'Contactos',
    icon:  IconUsers,
  },
];

const BOTTOM_ITEMS = [
  { page: PAGES.ACCOUNT, label: 'Mi cuenta', icon: IconSettings },
];

// ─── NavItem — top-level navigation button ────────────────────────────────────
function NavItem({ icon: Icon, label, isActive, isGroupActive, collapsed, onClick, children }) {
  // isActive      → full purple background (leaf page active)
  // isGroupActive → brand-color text/icon only, no background (parent of active child)
  const highlighted = isActive || isGroupActive;

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  collapsed ? 'center' : 'flex-start',
        gap:             '10px',
        width:           '100%',
        padding:         collapsed ? '9px 0' : '8px 10px',
        borderRadius:    '8px',
        border:          'none',
        cursor:          'pointer',
        backgroundColor: isActive ? C.brandBg : 'transparent',
        color:           highlighted ? C.brandDark : C.text3,
        fontSize:        '14px',
        fontWeight:      highlighted ? 600 : 400,
        textAlign:       'left',
        fontFamily:      'inherit',
        lineHeight:      '20px',
        transition:      'background-color 0.15s, color 0.15s',
        flexShrink:      0,
        minWidth:        0,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = C.bgHover;
          if (!isGroupActive) e.currentTarget.style.color = C.text2;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = highlighted ? C.brandDark : C.text3;
        }
      }}
    >
      {/* Icon */}
      <span style={{
        flexShrink:      0,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           collapsed ? undefined : '20px',
        color:           highlighted ? C.brandDark : C.text4,
      }}>
        <Icon size={18} />
      </span>

      {/* Label + optional suffix (chevron) */}
      {!collapsed && (
        <>
          <span style={{
            flex:         1,
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
          }}>
            {label}
          </span>
          {children}
        </>
      )}
    </button>
  );
}

// ─── SubNavItem — second-level menu item ──────────────────────────────────────
function SubNavItem({ icon: Icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      style={{
        display:         'flex',
        alignItems:      'center',
        gap:             '8px',
        width:           '100%',
        padding:         '6px 10px',
        borderRadius:    '6px',
        border:          'none',
        cursor:          'pointer',
        backgroundColor: isActive ? C.brandBg : 'transparent',
        color:           isActive ? C.brandDark : C.text4,
        fontSize:        '13px',
        fontWeight:      isActive ? 500 : 400,
        textAlign:       'left',
        fontFamily:      'inherit',
        lineHeight:      '18px',
        transition:      'background-color 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = C.bgHover;
          e.currentTarget.style.color = C.text2;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = C.text4;
        }
      }}
    >
      {/* Vertical accent line */}
      <span style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           '16px',
        flexShrink:      0,
      }}>
        <span style={{
          display:         'block',
          width:           '2px',
          height:          '14px',
          borderRadius:    '2px',
          backgroundColor: isActive ? C.brand : C.border1,
          transition:      'background-color 0.15s',
        }} />
      </span>

      {/* Icon */}
      <span style={{
        display:    'flex',
        alignItems: 'center',
        color:      isActive ? C.brandDark : C.text5,
        flexShrink: 0,
      }}>
        <Icon size={14} />
      </span>

      {/* Label */}
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </span>
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle }) {
  const { view, navigate } = useNavigation();

  // Normalise active page — PROJECT_DETAIL belongs to the Proyectos group
  const activePage     = view.page === PAGES.PROJECT_DETAIL ? PAGES.PROJECTS : view.page;
  const isProjectGroup = PROJECTS_GROUP.has(activePage);

  // Submenu open by default when a projects page is active
  const [projectsOpen, setProjectsOpen] = useState(isProjectGroup);

  return (
    <aside
      aria-label="Navegación principal"
      style={{
        width:           collapsed ? '64px' : '240px',
        height:          '100%',
        borderRight:     `1px solid ${C.border1}`,
        backgroundColor: '#fff',
        display:         'flex',
        flexDirection:   'column',
        flexShrink:      0,
        overflowY:       'auto',
        overflowX:       'hidden',
        transition:      'width 0.2s ease',
      }}
    >

      {/* ── Logo / brand area ── */}
      <div style={{
        height:         '64px',
        padding:        collapsed ? '0' : '0 16px',
        display:        'flex',
        alignItems:     'center',
        gap:            '10px',
        borderBottom:   `1px solid ${C.border2}`,
        flexShrink:     0,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        {/* Brand mark */}
        <div style={{
          width:           '32px',
          height:          '32px',
          borderRadius:    '9px',
          backgroundColor: C.brand,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <rect x="3"  y="3"  width="8" height="8" rx="2" fill="white" fillOpacity="0.95" />
            <rect x="13" y="3"  width="8" height="8" rx="2" fill="white" fillOpacity="0.50" />
            <rect x="3"  y="13" width="8" height="8" rx="2" fill="white" fillOpacity="0.50" />
            <rect x="13" y="13" width="8" height="8" rx="2" fill="white" fillOpacity="0.95" />
          </svg>
        </div>
        {!collapsed && (
          <span style={{
            fontWeight:    700,
            fontSize:      '15px',
            color:         C.text1,
            letterSpacing: '-0.01em',
            whiteSpace:    'nowrap',
            overflow:      'hidden',
            textOverflow:  'ellipsis',
          }}>
            {APP_NAME}
          </span>
        )}
      </div>

      {/* ── Main nav ── */}
      <nav style={{
        flex:          1,
        padding:       '10px 8px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '2px',
      }}>

        {/* Render NAV_ITEMS */}
        {NAV_ITEMS.map((item) => {
          const hasChildren = Array.isArray(item.children) && item.children.length > 0;
          const isGroupItem = hasChildren && isProjectGroup;

          // For items without children
          if (!hasChildren) {
            return (
              <NavItem
                key={item.page}
                icon={item.icon}
                label={item.label}
                isActive={activePage === item.page}
                collapsed={collapsed}
                onClick={() => navigate(item.page)}
              />
            );
          }

          // For items with children (Proyectos)
          const isOpen = projectsOpen; // only one group for now; extend if needed

          return (
            <div key={item.page}>
              {/* Group header */}
              <NavItem
                icon={item.icon}
                label={item.label}
                isActive={false}
                isGroupActive={isGroupItem && !collapsed}
                collapsed={collapsed}
                onClick={() => {
                  if (collapsed) {
                    // Collapsed: navigate directly to parent page
                    navigate(item.page);
                  } else {
                    setProjectsOpen((o) => !o);
                  }
                }}
              >
                {/* Chevron — rotates when open */}
                <span style={{
                  display:    'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  color:      isGroupItem ? C.brand : C.text5,
                  transform:  isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}>
                  <IconChevronRight size={13} />
                </span>
              </NavItem>

              {/* Submenu — slides in/out via maxHeight */}
              {!collapsed && (
                <div style={{
                  overflow:   'hidden',
                  maxHeight:  isOpen ? '200px' : '0px',
                  transition: 'max-height 0.22s ease',
                }}>
                  <div style={{
                    paddingLeft:   '14px',
                    paddingTop:    '3px',
                    paddingBottom: '4px',
                    display:       'flex',
                    flexDirection: 'column',
                    gap:           '1px',
                  }}>
                    {item.children.map((child) => {
                      // "Todos" is active when on PROJECTS or PROJECT_DETAIL
                      const isActive = child.page === PAGES.PROJECTS
                        ? (activePage === PAGES.PROJECTS || activePage === PAGES.PROJECT_DETAIL)
                        : activePage === child.page;

                      return (
                        <SubNavItem
                          key={child.page}
                          icon={child.icon}
                          label={child.label}
                          isActive={isActive}
                          onClick={() => navigate(child.page)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Bottom: account + collapse toggle ── */}
      <div style={{
        borderTop:     `1px solid ${C.border2}`,
        padding:       '8px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '2px',
        flexShrink:    0,
      }}>
        {BOTTOM_ITEMS.map((item) => (
          <NavItem
            key={item.page}
            icon={item.icon}
            label={item.label}
            isActive={activePage === item.page}
            collapsed={collapsed}
            onClick={() => navigate(item.page)}
          />
        ))}

        {/* Collapse / expand toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  collapsed ? 'center' : 'flex-start',
            gap:             '10px',
            width:           '100%',
            padding:         collapsed ? '9px 0' : '8px 10px',
            borderRadius:    '8px',
            border:          'none',
            cursor:          'pointer',
            backgroundColor: 'transparent',
            color:           C.text5,
            fontSize:        '13px',
            fontWeight:      400,
            fontFamily:      'inherit',
            transition:      'background-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.bgHover; e.currentTarget.style.color = C.text3; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text5; }}
        >
          {/* Icon flips direction on collapse */}
          <span style={{
            display:    'flex',
            alignItems: 'center',
            flexShrink: 0,
            width:      collapsed ? undefined : '20px',
            transform:  collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}>
            <IconPanelLeft size={16} />
          </span>
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header() {
  const { view, goBack, navigate }  = useNavigation();
  const { authUserProfile }         = useUsers();
  const { user: authUser, signOut } = useAuth();
  const [menuOpen, setMenuOpen]     = useState(false);

  const isDetail = view.page === PAGES.PROJECT_DETAIL;

  const displayName = authUserProfile?.name || authUser?.email?.split('@')[0] || 'Usuario';
  const initials    = authUserProfile?.initials
    || displayName.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
    || 'U';

  return (
    <header style={{
      height:          '60px',
      borderBottom:    `1px solid ${C.border1}`,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '0 28px',
      backgroundColor: '#fff',
      flexShrink:      0,
      position:        'relative',
    }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
        {isDetail && (
          <>
            <button
              onClick={goBack}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text5, fontSize: '14px', padding: 0 }}
            >
              {PAGE_LABELS[PAGES.PROJECTS]}
            </button>
            <span style={{ color: '#d0d5dd' }}>/</span>
          </>
        )}
        <span style={{ fontWeight: 600, color: C.text1 }}>
          {PAGE_LABELS[view.page] ?? 'Dashboard'}
        </span>
      </div>

      {/* User menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             '8px',
            background:      'none',
            border:          `1px solid ${C.border1}`,
            borderRadius:    '8px',
            padding:         '5px 10px',
            cursor:          'pointer',
            transition:      'border-color 0.1s, background-color 0.1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.bgHover; e.currentTarget.style.borderColor = '#d0d5dd'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = C.border1; }}
        >
          {/* Avatar */}
          <div style={{
            width:           '28px',
            height:          '28px',
            borderRadius:    '50%',
            flexShrink:      0,
            backgroundColor: C.brandBg,
            border:          `1.5px solid ${C.brandSubtle}`,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            fontSize:        '11px',
            fontWeight:      700,
            color:           C.brandDark,
          }}>
            {initials}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: C.text1, lineHeight: 1.2 }}>
              {displayName}
            </div>
            {authUser?.email && (
              <div style={{ fontSize: '10px', color: C.text5, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {authUser.email}
              </div>
            )}
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.text5} strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
            <div style={{
              position:        'absolute',
              top:             'calc(100% + 6px)',
              right:           0,
              backgroundColor: '#fff',
              border:          `1px solid ${C.border1}`,
              borderRadius:    '10px',
              boxShadow:       '0px 12px 16px -4px rgba(0,0,0,0.08), 0px 4px 6px -2px rgba(0,0,0,0.03)',
              minWidth:        '200px',
              zIndex:          100,
              overflow:        'hidden',
            }}>
              <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  onClick={() => { navigate(PAGES.ACCOUNT); setMenuOpen(false); }}
                  style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: C.text2, fontSize: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.1s', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = C.bgHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  Mi cuenta
                </button>
                <button
                  onClick={() => { navigate(PAGES.USERS); setMenuOpen(false); }}
                  style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: C.brand, fontSize: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.1s', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9f5ff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  Gestionar contactos →
                </button>
                <div style={{ height: '1px', backgroundColor: C.border2, margin: '2px 0' }} />
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  style={{ width: '100%', padding: '7px 8px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#f04438', fontSize: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.1s', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fff3f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header />
        <main style={{
          flex:            1,
          overflowY:       'auto',
          overflowX:       'auto',
          padding:         '32px',
          backgroundColor: '#f9fafb',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
