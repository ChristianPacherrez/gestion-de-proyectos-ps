/**
 * DashboardActivityFeed — "Actividad reciente".
 *
 * Fase 1 (SIMULADA): genera eventos a partir de data existente.
 *
 *   Fuentes:
 *   ① Tareas  — una sola query global por project_id IN (...)
 *       · status === 'done'  → "Tarea completada"
 *       · created_at reciente (≤7d) + status !== 'done' → "Nueva tarea"
 *   ② Proyectos — derivados del array ya cargado (sin extra queries)
 *       · created_at ≤ 30d → "Nuevo proyecto"
 *       · status === 'completed' → "Proyecto completado"
 *       · progress === 100 + status !== 'completed' → "Brief completado" (proxy)
 *
 * Props:
 *   projects   Project[]   — array ya cargado desde useProjects()
 *   onSelect   (project) => void
 *
 * Futuro: migrar a tabla activity_logs con eventos reales + updated_at.
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase }                      from '../lib/supabaseClient';

// ─── Constants ────────────────────────────────────────────────────────────────
const MS_7D  =  7 * 24 * 60 * 60 * 1000;
const MS_30D = 30 * 24 * 60 * 60 * 1000;
const MAX_EVENTS = 8;

// ─── formatTimeAgo ────────────────────────────────────────────────────────────
function formatTimeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  <  1) return 'Ahora mismo';
  if (mins  < 60) return `Hace ${mins} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days  <  7) return `Hace ${days} día${days === 1 ? '' : 's'}`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ─── Event type config ────────────────────────────────────────────────────────
const EVENT_CONFIG = {
  task_completed:    { iconColor: '#17b26a', bg: '#ecfdf3', Icon: IconCheck      },
  task_created:      { iconColor: '#7f56d9', bg: '#f9f5ff', Icon: IconTask       },
  project_created:   { iconColor: '#0ba5ec', bg: '#f0f9ff', Icon: IconFolder     },
  project_completed: { iconColor: '#9e77ed', bg: '#f4f3ff', Icon: IconStar       },
  brief_completed:   { iconColor: '#f79009', bg: '#fffaeb', Icon: IconDocument   },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IconCheck({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconTask({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="7" y1="10" x2="17" y2="10" />
      <line x1="7" y1="14" x2="13" y2="14" />
    </svg>
  );
}

function IconFolder({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconStar({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconDocument({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}

// ─── useActivityEvents ────────────────────────────────────────────────────────
/**
 * Derives and fetches all activity events for the given projects.
 * Single Supabase query for tasks — no per-project waterfalls.
 */
function useActivityEvents(projects) {
  const [rawTasks, setRawTasks] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Stable key so the effect only re-fires when project IDs actually change
  const projectIdsKey = projects.map((p) => p.id).sort().join(',');

  useEffect(() => {
    if (!projects.length) {
      setLoading(false);
      return;
    }

    const ids = projects.map((p) => p.id);
    setLoading(true);

    supabase
      .from('tasks')
      .select('id, title, status, created_at, project_id')
      .in('project_id', ids)
      .order('created_at', { ascending: false })
      .limit(40)
      .then(({ data, error }) => {
        if (!error && data) setRawTasks(data);
      })
      .catch(() => {/* fail silently — feed is best-effort */})
      .finally(() => setLoading(false));

  }, [projectIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Build project lookup map ───────────────────────────────────────────────
  const projectMap = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects],
  );

  // ── Derive all events ──────────────────────────────────────────────────────
  const events = useMemo(() => {
    const now = Date.now();

    // ① Task events ──────────────────────────────────────────────────────────
    const taskEvents = rawTasks.flatMap((t) => {
      const proj     = projectMap[t.project_id];
      const projName = proj?.name ?? 'un proyecto';

      if (t.status === 'done') {
        return [{
          id:          `task-done-${t.id}`,
          type:        'task_completed',
          message:     `Tarea "${t.title}" completada en ${projName}`,
          timestamp:   t.created_at,
          projectName: projName,
          projectId:   t.project_id,
        }];
      }

      // Show "created" only for tasks created in the last 7 days
      if (t.created_at && now - new Date(t.created_at).getTime() <= MS_7D) {
        return [{
          id:          `task-created-${t.id}`,
          type:        'task_created',
          message:     `Nueva tarea "${t.title}" en ${projName}`,
          timestamp:   t.created_at,
          projectName: projName,
          projectId:   t.project_id,
        }];
      }

      return [];
    });

    // ② Project events ────────────────────────────────────────────────────────
    const projectEvents = projects.flatMap((p) => {
      const evts = [];
      const ts   = p.createdAt ?? null;
      const age  = ts ? now - new Date(ts).getTime() : Infinity;

      // Project created (last 30 days)
      if (ts && age <= MS_30D) {
        evts.push({
          id:          `project-created-${p.id}`,
          type:        'project_created',
          message:     `Nuevo proyecto creado: ${p.name}`,
          timestamp:   ts,
          projectName: p.name,
          projectId:   p.id,
        });
      }

      // Project completed
      if (p.status === 'completed') {
        evts.push({
          id:          `project-completed-${p.id}`,
          type:        'project_completed',
          message:     `Proyecto completado: ${p.name}`,
          timestamp:   ts,
          projectName: p.name,
          projectId:   p.id,
        });
      }

      // Brief completado (proxy: 100% progress, project still active/paused)
      if ((p.progress ?? 0) === 100 && p.status !== 'completed') {
        evts.push({
          id:          `brief-completed-${p.id}`,
          type:        'brief_completed',
          message:     `Brief completado en ${p.name}`,
          timestamp:   ts,
          projectName: p.name,
          projectId:   p.id,
        });
      }

      return evts;
    });

    // Sort newest first, cap at MAX_EVENTS
    return [...taskEvents, ...projectEvents]
      .filter((e) => e.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, MAX_EVENTS);

  }, [rawTasks, projects, projectMap]);

  return { events, loading };
}

// ─── ActivityItem ─────────────────────────────────────────────────────────────
function ActivityItem({ event, onSelect, projectMap, isLast }) {
  const cfg = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.task_created;
  const { Icon, iconColor, bg } = cfg;
  const project = projectMap[event.projectId];

  return (
    <div
      role={project ? 'button' : undefined}
      tabIndex={project ? 0 : undefined}
      onClick={() => project && onSelect(project)}
      onKeyDown={(e) => e.key === 'Enter' && project && onSelect(project)}
      style={{
        display:       'flex',
        alignItems:    'flex-start',
        gap:           '12px',
        padding:       '12px 20px',
        borderBottom:  isLast ? 'none' : '1px solid var(--color-border-tertiary, #f2f4f7)',
        cursor:        project ? 'pointer' : 'default',
        transition:    'background-color 0.1s ease',
      }}
      onMouseEnter={(e) => { if (project) e.currentTarget.style.backgroundColor = '#fafafa'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {/* Icon badge */}
      <div style={{
        width:           '28px',
        height:          '28px',
        borderRadius:    '8px',
        backgroundColor: bg,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        flexShrink:      0,
        marginTop:       '1px',
      }}>
        <Icon color={iconColor} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin:       0,
          fontSize:     '13px',
          fontWeight:   500,
          color:        'var(--color-text-primary, #101828)',
          lineHeight:   '1.4',
          wordBreak:    'break-word',
        }}>
          {event.message}
        </p>
        <p style={{
          margin:    '2px 0 0',
          fontSize:  '11px',
          color:     'var(--color-text-tertiary, #667085)',
          fontWeight: 400,
        }}>
          {formatTimeAgo(event.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── EmptyActivity ────────────────────────────────────────────────────────────
function EmptyActivity() {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '40px 24px',
      gap:            '10px',
      textAlign:      'center',
    }}>
      <span style={{ fontSize: '32px', lineHeight: 1 }}>🌱</span>
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary, #101828)' }}>
        Aún no hay actividad reciente
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-tertiary, #667085)' }}>
        Los eventos de tus proyectos y tareas aparecerán aquí.
      </p>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function ActivitySkeleton() {
  return (
    <div style={{ padding: '4px 0' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '12px',
          padding:    '12px 20px',
          borderBottom: i < 3 ? '1px solid var(--color-border-tertiary, #f2f4f7)' : 'none',
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#f2f4f7', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 12, width: '70%', borderRadius: 6, backgroundColor: '#f2f4f7', marginBottom: 6 }} />
            <div style={{ height: 10, width: '30%', borderRadius: 6, backgroundColor: '#f9fafb' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DashboardActivityFeed ────────────────────────────────────────────────────
export default function DashboardActivityFeed({ projects, onSelect }) {
  const { events, loading } = useActivityEvents(projects);

  // Build project map for ActivityItem lookup
  const projectMap = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p])),
    [projects],
  );

  return (
    <section>
      {/* Section header */}
      <div style={{ marginBottom: '12px' }}>
        <h2 style={{
          margin:     0,
          fontSize:   '16px',
          fontWeight: 600,
          color:      'var(--color-text-primary, #101828)',
        }}>
          Actividad reciente
        </h2>
      </div>

      {/* Card */}
      <div style={{
        backgroundColor: '#fff',
        borderWidth:     '1px',
        borderStyle:     'solid',
        borderColor:     'var(--color-border-primary, #eaecf0)',
        borderRadius:    '16px',
        overflow:        'hidden',
        boxShadow:       '0px 1px 3px rgba(0,0,0,0.05)',
      }}>
        {loading ? (
          <ActivitySkeleton />
        ) : events.length === 0 ? (
          <EmptyActivity />
        ) : (
          events.map((event, idx) => (
            <ActivityItem
              key={event.id}
              event={event}
              onSelect={onSelect}
              projectMap={projectMap}
              isLast={idx === events.length - 1}
            />
          ))
        )}
      </div>
    </section>
  );
}
