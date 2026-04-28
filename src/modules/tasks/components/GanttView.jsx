import { useState, useRef } from 'react';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_BAR = {
  todo:        { bg: '#f2f4f7', border: '#d0d5dd', text: '#475467', solid: '#98a2b3', label: 'Por hacer'  },
  in_progress: { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8', solid: '#3b82f6', label: 'En proceso' },
  done:        { bg: '#dcfce7', border: '#86efac', text: '#15803d', solid: '#22c55e', label: 'Completada' },
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  return isNaN(d) ? null : d;
}
function daysBetween(a, b) {
  return Math.round((b - a) / 86_400_000);
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
/** Date → 'YYYY-MM-DD' */
function formatDate(d) {
  if (!d) return '';
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
/** Date → '15 abr' */
function fmtShort(d) {
  if (!d) return '';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
/** Date → '15/04/2025' */
function fmtFull(d) {
  if (!d) return '—';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Dependency helpers ───────────────────────────────────────────────────────

/** Returns all tasks that (transitively) depend on taskId. */
function getDescendants(taskList, taskId) {
  const result = [];
  for (const t of taskList) {
    if (t.dependsOn === taskId) {
      result.push(t);
      result.push(...getDescendants(taskList, t.id));
    }
  }
  return result;
}

// ─── Layout constants ─────────────────────────────────────────────────────────
const DAY_PX        = 36;
const ROW_H         = 48;
const HEADER_H      = 64;
const MONTH_H       = 28;
const DAY_H         = 36;
const LABEL_W       = 220;
const BAR_VPAD      = 10;
const PADDING_DAYS  = 2;
const RESIZE_HIT    = 10; // px — width of the resize handle hit area

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyGantt({ onNew }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '64px 24px', gap: '10px',
      border: '1px dashed #d0d5dd', borderRadius: '12px', backgroundColor: '#fff',
    }}>
      <span style={{ fontSize: '28px', opacity: 0.25 }}>📅</span>
      <p style={{ margin: 0, fontSize: '14px', color: '#667085', textAlign: 'center' }}>
        Ninguna tarea tiene fechas asignadas.
      </p>
      <p style={{ margin: 0, fontSize: '12px', color: '#98a2b3', textAlign: 'center' }}>
        Agrega una fecha de inicio o entrega para ver las barras aquí.
      </p>
      <button
        onClick={onNew}
        style={{ marginTop: '8px', padding: '7px 16px', borderRadius: '7px', border: '1px solid #6941c6', backgroundColor: '#7f56d9', color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
      >+ Nueva tarea</button>
    </div>
  );
}

// ─── Tooltip component ────────────────────────────────────────────────────────
// Rendered as position:fixed so overflow:hidden on the root card doesn't clip it.
function GanttTooltip({ data }) {
  if (!data) return null;
  const { task, x, y } = data;

  const start = parseDate(task.startDate);
  const end   = parseDate(task.dueDate);
  const dur   = start && end ? daysBetween(start, end) + 1 : null;
  const cfg   = STATUS_BAR[task.status] ?? STATUS_BAR.todo;

  return (
    <div style={{
      position:        'fixed',
      // Anchor bottom-left of tooltip 12px above cursor
      left:            `${x + 14}px`,
      top:             `${y - 8}px`,
      transform:       'translateY(-100%)',
      zIndex:          9999,
      pointerEvents:   'none',
      minWidth:        '180px',
      maxWidth:        '260px',
      backgroundColor: '#1e293b',
      color:           '#f8fafc',
      borderRadius:    '8px',
      padding:         '10px 12px',
      boxShadow:       '0 8px 24px rgba(0,0,0,0.22)',
      fontSize:        '12px',
      lineHeight:      1.5,
    }}>
      {/* Arrow */}
      <div style={{
        position:       'absolute',
        bottom:         '-5px',
        left:           '16px',
        width:          '10px',
        height:         '10px',
        backgroundColor:'#1e293b',
        transform:      'rotate(45deg)',
        borderRadius:   '1px',
      }} />

      {/* Status chip + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: cfg.solid, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.name}
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '6px 0' }} />

      {/* Dates grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 10px', color: '#cbd5e1' }}>
        {start && (
          <>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Inicio</span>
            <span style={{ color: '#f1f5f9' }}>{fmtFull(start)}</span>
          </>
        )}
        {end && (
          <>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Fin</span>
            <span style={{ color: '#f1f5f9' }}>{fmtFull(end)}</span>
          </>
        )}
        {dur !== null && dur > 0 && (
          <>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Duración</span>
            <span style={{ color: '#f1f5f9' }}>{dur} {dur === 1 ? 'día' : 'días'}</span>
          </>
        )}
      </div>

      {/* Hint */}
      <div style={{ marginTop: '7px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '10px', color: '#64748b', display: 'flex', gap: '8px' }}>
        <span>⟷ arrastrar</span>
        <span>↔ resize</span>
        <span>✎ clic editar</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   tasks          — full task array
 *   onEdit         — (task) open edit modal
 *   onNew          — () open new-task modal
 *   onUpdateDates  — (taskId, { startDate?, dueDate? }) persist new dates
 */
export default function GanttView({ tasks, onEdit, onNew, onUpdateDates }) {

  // ── Move drag state ──────────────────────────────────────────────────────────
  const dragRef    = useRef(null); // { taskId, startX, origStartDate, origDueDate, didMove }
  const [draggingId,   setDraggingId]   = useState(null);
  const [visualOffset, setVisualOffset] = useState(0);

  // ── Resize drag state ────────────────────────────────────────────────────────
  const resizeRef  = useRef(null); // { taskId, startX, origStartDate, origDueDate, didMove }
  const [resizingId,   setResizingId]   = useState(null);
  const [resizeOffset, setResizeOffset] = useState(0);

  // ── Tooltip state ────────────────────────────────────────────────────────────
  // { task, x, y } — viewport coords for fixed positioning
  const [tooltip, setTooltip] = useState(null);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const datedTasks = tasks.filter((t) => t.startDate || t.dueDate);
  if (!datedTasks.length) return <EmptyGantt onNew={onNew} />;

  // ── Timeline bounds ─────────────────────────────────────────────────────────
  let minDate = null;
  let maxDate = null;
  for (const t of datedTasks) {
    const start = parseDate(t.startDate) ?? parseDate(t.dueDate);
    const end   = parseDate(t.dueDate)   ?? parseDate(t.startDate);
    if (!minDate || start < minDate) minDate = start;
    if (!maxDate || end   > maxDate) maxDate = end;
  }
  minDate = addDays(minDate, -PADDING_DAYS);
  maxDate = addDays(maxDate,  PADDING_DAYS);

  const totalDays = daysBetween(minDate, maxDate) + 1;
  const gridH     = datedTasks.length * ROW_H;

  // ── Month groups ─────────────────────────────────────────────────────────────
  const months = [];
  let cur = new Date(minDate);
  while (cur <= maxDate) {
    const label = cur.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    let count = 0;
    const tmp = new Date(cur);
    while (tmp <= maxDate && tmp.getMonth() === cur.getMonth() && tmp.getFullYear() === cur.getFullYear()) {
      count++;
      tmp.setDate(tmp.getDate() + 1);
    }
    months.push({ key: `${cur.getFullYear()}-${cur.getMonth()}`, label, count });
    cur = new Date(tmp);
  }

  // ── Day ticks ────────────────────────────────────────────────────────────────
  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const dayTicks = Array.from({ length: totalDays }, (_, i) => {
    const d        = addDays(minDate, i);
    const dow      = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isToday   = d.toDateString() === today.toDateString();
    const isMon     = dow === 1;
    return { i, d, isWeekend, isToday, isMon, label: d.getDate() };
  });
  const todayOff  = daysBetween(minDate, today);
  const showToday = todayOff >= 0 && todayOff < totalDays;

  const anyDrag = !!(draggingId || resizingId);

  // ── Pre-compute bar positions for dependency arrows ───────────────────────────
  // Must run at render time so arrows reflect any active drag/resize offsets.
  const barPos = {};
  for (const [rowIdx, task] of datedTasks.entries()) {
    const start    = parseDate(task.startDate) ?? parseDate(task.dueDate);
    const end      = parseDate(task.dueDate)   ?? parseDate(task.startDate);
    const startOff = daysBetween(minDate, start);
    const origDur  = Math.max(1, daysBetween(start, end) + 1);
    const baseLeft = startOff * DAY_PX + 3;
    const baseW    = Math.max(DAY_PX - 6, origDur * DAY_PX - 6);
    const barH     = ROW_H - BAR_VPAD * 2;
    const midY     = rowIdx * ROW_H + BAR_VPAD + barH / 2;
    // Account for live drag/resize offsets
    const movePx       = task.id === draggingId ? Math.round(visualOffset / DAY_PX) * DAY_PX : 0;
    const resizeDelta  = task.id === resizingId  ? Math.max(1 - origDur, Math.round(resizeOffset / DAY_PX)) : 0;
    const effectLeft   = baseLeft + movePx;
    const effectRight  = effectLeft + (task.id === resizingId
      ? Math.max(DAY_PX - 6, baseW + resizeDelta * DAY_PX)
      : baseW);
    barPos[task.id] = { left: effectLeft, right: effectRight, midY };
  }

  // Build arrow descriptors — one per task that has a valid dependsOn
  const arrows = datedTasks
    .filter((t) => t.dependsOn && barPos[t.dependsOn] && barPos[t.id])
    .map((t) => {
      const from        = barPos[t.dependsOn];
      const to          = barPos[t.id];
      // Violation: parent ends AFTER child starts (dependency constraint broken)
      const isViolation = from.right > to.left;
      // Bezier control-point distance — scales with horizontal gap
      const cpDist = Math.max(28, Math.abs(to.left - from.right) * 0.45);
      const d = `M ${from.right} ${from.midY} C ${from.right + cpDist} ${from.midY}, ${to.left - cpDist} ${to.midY}, ${to.left} ${to.midY}`;
      return { key: `${t.dependsOn}→${t.id}`, d, isViolation };
    });

  // ── MOVE handlers ─────────────────────────────────────────────────────────────
  function handleBarPointerDown(e, task) {
    if (resizingId) return;           // resize in progress — ignore
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      taskId: task.id, startX: e.clientX,
      origStartDate: task.startDate, origDueDate: task.dueDate, didMove: false,
    };
    setDraggingId(task.id);
    setVisualOffset(0);
    setTooltip(null);
  }

  function handleBarPointerMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 4) dragRef.current.didMove = true;
    setVisualOffset(dx);
  }

  function handleBarPointerUp(e) {
    if (!dragRef.current) return;
    const { taskId, didMove, origStartDate, origDueDate } = dragRef.current;
    const deltaDays = Math.round((e.clientX - dragRef.current.startX) / DAY_PX);

    if (!didMove) {
      const task = datedTasks.find((t) => t.id === taskId);
      if (task) onEdit(task);
    } else if (Math.abs(deltaDays) > 0 && onUpdateDates) {
      // Move principal
      onUpdateDates(taskId, {
        startDate: origStartDate ? formatDate(addDays(parseDate(origStartDate), deltaDays)) : origStartDate,
        dueDate:   origDueDate   ? formatDate(addDays(parseDate(origDueDate),   deltaDays)) : origDueDate,
      });
      // PRO: cascade — arrastrar la tarea padre arrastra todas las dependientes
      for (const dep of getDescendants(tasks, taskId)) {
        onUpdateDates(dep.id, {
          startDate: dep.startDate ? formatDate(addDays(parseDate(dep.startDate), deltaDays)) : dep.startDate,
          dueDate:   dep.dueDate   ? formatDate(addDays(parseDate(dep.dueDate),   deltaDays)) : dep.dueDate,
        });
      }
    }
    dragRef.current = null;
    setDraggingId(null);
    setVisualOffset(0);
  }

  // ── RESIZE handlers ───────────────────────────────────────────────────────────
  function handleResizePointerDown(e, task) {
    if (draggingId) return;
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();             // prevent bar's onPointerDown from firing
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = {
      taskId: task.id, startX: e.clientX,
      origStartDate: task.startDate, origDueDate: task.dueDate, didMove: false,
    };
    setResizingId(task.id);
    setResizeOffset(0);
    setTooltip(null);
  }

  function handleResizePointerMove(e) {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    if (Math.abs(dx) > 4) resizeRef.current.didMove = true;
    setResizeOffset(dx);
  }

  function handleResizePointerUp(e) {
    if (!resizeRef.current) return;
    const { taskId, didMove, origStartDate, origDueDate } = resizeRef.current;
    const rawDelta  = Math.round((e.clientX - resizeRef.current.startX) / DAY_PX);

    if (didMove && onUpdateDates) {
      // Clamp: duration must stay ≥ 1 day
      const startD  = parseDate(origStartDate);
      const endD    = parseDate(origDueDate);
      const origDur = (startD && endD) ? daysBetween(startD, endD) : 0;
      const delta   = Math.max(1 - origDur, rawDelta); // e.g. 1-day task can't shrink further
      if (delta !== 0) {
        onUpdateDates(taskId, {
          dueDate: formatDate(addDays(parseDate(origDueDate), delta)),
        });
      }
    }
    resizeRef.current = null;
    setResizingId(null);
    setResizeOffset(0);
  }

  // ── TOOLTIP handlers ──────────────────────────────────────────────────────────
  function handleBarMouseEnter(e, task) {
    if (anyDrag) return;
    setTooltip({ task, x: e.clientX, y: e.clientY });
  }
  function handleBarMouseMove(e) {
    if (anyDrag || !tooltip) return;
    setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
  }
  function handleBarMouseLeave() {
    setTooltip(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Tooltip rendered outside the card so overflow:hidden doesn't clip it */}
      <GanttTooltip data={anyDrag ? null : tooltip} />

      <div style={{
        backgroundColor: '#fff',
        border:          '1px solid #eaecf0',
        borderRadius:    '12px',
        overflow:        'hidden',
        boxShadow:       '0 1px 3px rgba(0,0,0,0.06)',
        userSelect:      anyDrag ? 'none' : 'auto',
      }}>
        {/* ── Scrollable wrapper ── */}
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <div style={{ display: 'flex', minWidth: `${LABEL_W + totalDays * DAY_PX}px` }}>

            {/* ── Left label panel (sticky) ── */}
            <div style={{
              flexShrink: 0, width: `${LABEL_W}px`,
              position: 'sticky', left: 0, zIndex: 20,
              backgroundColor: '#fff', boxShadow: '2px 0 4px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                height: `${HEADER_H}px`, backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e2e8f0',
                display: 'flex', alignItems: 'flex-end', padding: '0 16px 8px',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Tarea
                </span>
              </div>

              {datedTasks.map((task, i) => {
                const cfg    = STATUS_BAR[task.status] ?? STATUS_BAR.todo;
                const isEven = i % 2 === 0;
                return (
                  <div
                    key={task.id}
                    onClick={() => onEdit(task)}
                    title={task.name}
                    style={{
                      height: `${ROW_H}px`, display: 'flex', alignItems: 'center',
                      gap: '8px', padding: '0 16px', fontSize: '13px', fontWeight: 500,
                      color: task.status === 'done' ? '#94a3b8' : '#334155',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none',
                      borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                      backgroundColor: isEven ? '#fff' : '#fafafa',
                      transition: 'background-color 0.1s', userSelect: 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f9ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isEven ? '#fff' : '#fafafa'; }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, backgroundColor: cfg.solid }} />
                  <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {task.name}
                  </span>
                  {/* Dependency indicator — small arrow icon */}
                  {task.dependsOn && (
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"
                      title="Esta tarea depende de otra" style={{ flexShrink: 0, opacity: 0.4 }}>
                      <circle cx="3" cy="8" r="1.8" fill="#667085"/>
                      <path d="M5 8h6M9 5.5l2.5 2.5-2.5 2.5" stroke="#667085" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                );
              })}
            </div>

            {/* ── Timeline panel ── */}
            <div style={{ flex: 1, position: 'relative' }}>

              {/* Month header */}
              <div style={{ display: 'flex', height: `${MONTH_H}px`, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {months.map(({ key, label, count }) => (
                  <div key={key} style={{
                    width: `${count * DAY_PX}px`, flexShrink: 0, padding: '0 10px',
                    display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: 700,
                    color: '#334155', borderRight: '1px solid #e2e8f0', textTransform: 'capitalize',
                    letterSpacing: '0.01em', whiteSpace: 'nowrap', overflow: 'hidden',
                  }}>
                    {label}
                  </div>
                ))}
              </div>

              {/* Day ticks header */}
              <div style={{ display: 'flex', height: `${DAY_H}px`, backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {dayTicks.map(({ i, isWeekend, isToday, isMon, label }) => (
                  <div key={i} style={{
                    width: `${DAY_PX}px`, flexShrink: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isToday ? '#f5f3ff' : isWeekend ? 'rgba(0,0,0,0.025)' : 'transparent',
                    borderRight: isMon ? '1px solid #cbd5e1' : '1px solid #f1f5f9',
                  }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: isToday ? 800 : isWeekend ? 400 : 500,
                      color: isToday ? '#7f56d9' : isWeekend ? '#94a3b8' : '#64748b',
                      lineHeight: 1,
                    }}>
                      {label}
                    </span>
                    {isToday && <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#7f56d9', marginTop: '3px' }} />}
                  </div>
                ))}
              </div>

              {/* ── Grid body ── */}
              <div style={{ position: 'relative', height: `${gridH}px` }}>

                {/* Column BGs */}
                {dayTicks.map(({ i, isWeekend, isToday, isMon }) => (
                  <div key={i} style={{
                    position: 'absolute', left: `${i * DAY_PX}px`, top: 0,
                    width: `${DAY_PX}px`, height: '100%',
                    backgroundColor: isToday ? 'rgba(127,86,217,0.04)' : isWeekend ? 'rgba(0,0,0,0.018)' : 'transparent',
                    borderRight: isMon ? '1px solid #e2e8f0' : '1px solid #f8fafc',
                    pointerEvents: 'none',
                  }} />
                ))}

                {/* Row BGs */}
                {datedTasks.map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute', left: 0, top: `${i * ROW_H}px`,
                    width: '100%', height: `${ROW_H}px`,
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.012)',
                    borderBottom: '1px solid #f1f5f9', pointerEvents: 'none',
                  }} />
                ))}

                {/* Today line */}
                {showToday && <>
                  <div style={{
                    position: 'absolute', left: `${todayOff * DAY_PX + DAY_PX / 2 - 6}px`, top: 0,
                    width: '12px', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(127,86,217,0.08), transparent)',
                    pointerEvents: 'none', zIndex: 4,
                  }} />
                  <div style={{
                    position: 'absolute', left: `${todayOff * DAY_PX + DAY_PX / 2}px`, top: 0,
                    width: '2px', height: '100%',
                    background: 'linear-gradient(180deg, #7f56d9, rgba(127,86,217,0.3))',
                    pointerEvents: 'none', zIndex: 5,
                  }} />
                </>}

                {/* ── Dependency arrows SVG ── */}
                {arrows.length > 0 && (
                  <svg
                    style={{
                      position:      'absolute',
                      top:           0,
                      left:          0,
                      width:         `${totalDays * DAY_PX}px`,
                      height:        `${gridH}px`,
                      overflow:      'visible',
                      pointerEvents: 'none',
                      zIndex:        4,
                    }}
                  >
                    <defs>
                      {/* Normal arrow marker */}
                      <marker id="gantt-arr-n" viewBox="0 0 8 6" refX="7" refY="3"
                        markerWidth="5" markerHeight="4" orient="auto">
                        <path d="M 0 0 L 8 3 L 0 6 Z" fill="#94a3b8" />
                      </marker>
                      {/* Violation arrow marker (orange) */}
                      <marker id="gantt-arr-v" viewBox="0 0 8 6" refX="7" refY="3"
                        markerWidth="5" markerHeight="4" orient="auto">
                        <path d="M 0 0 L 8 3 L 0 6 Z" fill="#f97316" />
                      </marker>
                    </defs>
                    {arrows.map(({ key, d, isViolation }) => (
                      <path
                        key={key}
                        d={d}
                        stroke={isViolation ? '#f97316' : '#94a3b8'}
                        strokeWidth={isViolation ? 1.5 : 1.5}
                        strokeDasharray={isViolation ? '5 3' : undefined}
                        fill="none"
                        opacity={isViolation ? 0.9 : 0.65}
                        markerEnd={isViolation ? 'url(#gantt-arr-v)' : 'url(#gantt-arr-n)'}
                      />
                    ))}
                  </svg>
                )}

                {/* ── Task bars ── */}
                {datedTasks.map((task, rowIdx) => {
                  const start    = parseDate(task.startDate) ?? parseDate(task.dueDate);
                  const end      = parseDate(task.dueDate)   ?? parseDate(task.startDate);
                  const startOff = daysBetween(minDate, start);
                  const origDur  = Math.max(1, daysBetween(start, end) + 1);
                  const barLeft  = startOff * DAY_PX + 3;
                  const baseBarW = Math.max(DAY_PX - 6, origDur * DAY_PX - 6);
                  const barTop   = rowIdx * ROW_H + BAR_VPAD;
                  const barH     = ROW_H - BAR_VPAD * 2;
                  const cfg      = STATUS_BAR[task.status] ?? STATUS_BAR.todo;
                  const isPoint  = !task.startDate || !task.dueDate || task.startDate === task.dueDate;

                  // ── Move drag calculations ────────────────────────────────
                  const isMoving    = task.id === draggingId;
                  const snappedPx   = isMoving ? Math.round(visualOffset / DAY_PX) * DAY_PX : 0;
                  const moveDelta   = isMoving ? Math.round(visualOffset / DAY_PX) : 0;

                  // ── Resize calculations ───────────────────────────────────
                  const isResizing    = task.id === resizingId;
                  const rawResizeDelta = isResizing ? Math.round(resizeOffset / DAY_PX) : 0;
                  // Clamp: can't shrink below 1 day duration
                  const safeDelta     = Math.max(1 - origDur, rawResizeDelta);
                  const currentBarW   = isResizing
                    ? Math.max(DAY_PX - 6, baseBarW + safeDelta * DAY_PX)
                    : baseBarW;
                  const previewDueDate = (isResizing && task.dueDate && safeDelta !== 0)
                    ? fmtShort(addDays(parseDate(task.dueDate), safeDelta))
                    : null;

                  // ── Move drag preview ─────────────────────────────────────
                  const previewMoveStart = (isMoving && task.startDate && moveDelta !== 0)
                    ? fmtShort(addDays(parseDate(task.startDate), moveDelta))
                    : null;
                  const previewMoveEnd = (isMoving && task.dueDate && moveDelta !== 0)
                    ? fmtShort(addDays(parseDate(task.dueDate), moveDelta))
                    : null;

                  const isAnyActive = isMoving || isResizing;

                  return (
                    <div key={task.id}>

                      {/* Ghost bar — original position while dragging or resizing */}
                      {isAnyActive && (
                        <div style={{
                          position: 'absolute', top: `${barTop}px`, left: `${barLeft}px`,
                          width: `${baseBarW}px`, height: `${barH}px`,
                          backgroundColor: cfg.bg, border: `1.5px dashed ${cfg.border}`,
                          borderRadius: isPoint ? '50%' : '8px',
                          opacity: 0.4, pointerEvents: 'none', zIndex: 5,
                        }} />
                      )}

                      {/* Main bar */}
                      <div
                        onPointerDown={(e) => handleBarPointerDown(e, task)}
                        onPointerMove={handleBarPointerMove}
                        onPointerUp={handleBarPointerUp}
                        onPointerCancel={handleBarPointerUp}
                        onMouseEnter={(e) => handleBarMouseEnter(e, task)}
                        onMouseMove={handleBarMouseMove}
                        onMouseLeave={handleBarMouseLeave}
                        style={{
                          position:        'absolute',
                          top:             `${barTop}px`,
                          left:            `${barLeft}px`,
                          width:           `${currentBarW}px`,   // changes during resize
                          height:          `${barH}px`,
                          backgroundColor: cfg.bg,
                          border:          isAnyActive
                            ? `1.5px solid ${cfg.solid}`
                            : `1.5px solid ${cfg.border}`,
                          borderRadius:    isPoint ? '50%' : '8px',
                          display:         'flex',
                          alignItems:      'center',
                          paddingLeft:     isPoint ? 0 : '10px',
                          justifyContent:  isPoint ? 'center' : 'flex-start',
                          overflow:        'hidden',
                          cursor:          isMoving ? 'grabbing' : 'grab',
                          zIndex:          isAnyActive ? 10 : 6,
                          touchAction:     'none',
                          transform:       `translateX(${snappedPx}px)`,  // 0 during resize
                          transition:      isAnyActive
                            ? 'box-shadow 0.1s, width 0s'
                            : 'filter 0.12s, box-shadow 0.12s, transform 0.12s',
                          boxShadow:       isAnyActive
                            ? '0 8px 24px rgba(0,0,0,0.18)'
                            : '0 1px 3px rgba(0,0,0,0.08)',
                          filter:          isAnyActive ? 'brightness(0.96)' : 'none',
                        }}
                      >
                        {/* Accent stripe */}
                        {!isPoint && (
                          <div style={{
                            position: 'absolute', left: 0, top: 0,
                            width: '4px', height: '100%',
                            backgroundColor: cfg.solid, borderRadius: '8px 0 0 8px', flexShrink: 0,
                          }} />
                        )}

                        {/* Task name — hidden during active drag/resize with a badge */}
                        <span style={{
                          fontSize: '11px', fontWeight: 600, color: cfg.text,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          paddingLeft: isPoint ? 0 : '6px', flex: 1,
                          opacity: isAnyActive && (moveDelta !== 0 || safeDelta !== 0) ? 0 : 1,
                          transition: 'opacity 0.1s',
                        }}>
                          {isPoint ? '◆' : task.name}
                        </span>

                        {/* Move delta badge */}
                        {isMoving && moveDelta !== 0 && (
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex',
                            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '1px', pointerEvents: 'none',
                          }}>
                            <span style={{
                              fontSize: '11px', fontWeight: 700, color: cfg.text,
                              backgroundColor: cfg.bg, padding: '1px 6px',
                              borderRadius: '4px', lineHeight: 1.4,
                            }}>
                              {moveDelta > 0 ? `+${moveDelta}` : moveDelta} d
                            </span>
                            {(previewMoveStart || previewMoveEnd) && (
                              <span style={{ fontSize: '10px', fontWeight: 500, color: cfg.text, opacity: 0.7 }}>
                                {previewMoveStart && previewMoveEnd
                                  ? `${previewMoveStart} → ${previewMoveEnd}`
                                  : previewMoveEnd ?? previewMoveStart}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Resize delta badge */}
                        {isResizing && safeDelta !== 0 && (
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex',
                            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '1px', pointerEvents: 'none',
                          }}>
                            <span style={{
                              fontSize: '11px', fontWeight: 700, color: cfg.text,
                              backgroundColor: cfg.bg, padding: '1px 6px',
                              borderRadius: '4px', lineHeight: 1.4,
                            }}>
                              {safeDelta > 0 ? `+${safeDelta}` : safeDelta} d
                            </span>
                            {previewDueDate && (
                              <span style={{ fontSize: '10px', fontWeight: 500, color: cfg.text, opacity: 0.7 }}>
                                → {previewDueDate}
                              </span>
                            )}
                          </div>
                        )}

                        {/* ── Resize handle — right edge ── */}
                        {!isPoint && (
                          <div
                            onPointerDown={(e) => handleResizePointerDown(e, task)}
                            onPointerMove={handleResizePointerMove}
                            onPointerUp={handleResizePointerUp}
                            onPointerCancel={handleResizePointerUp}
                            // Stop mouse events from bubbling to bar (tooltip)
                            onMouseEnter={(e) => { e.stopPropagation(); setTooltip(null); }}
                            onMouseLeave={(e) => { e.stopPropagation(); }}
                            style={{
                              position:        'absolute',
                              right:           0,
                              top:             0,
                              width:           `${RESIZE_HIT}px`,
                              height:          '100%',
                              cursor:          isResizing ? 'col-resize' : 'col-resize',
                              zIndex:          3,
                              touchAction:     'none',
                              display:         'flex',
                              alignItems:      'center',
                              justifyContent:  'center',
                              borderRadius:    '0 8px 8px 0',
                              backgroundColor: isResizing ? `${cfg.solid}22` : 'transparent',
                              transition:      'background-color 0.1s',
                            }}
                          >
                            {/* Three-dot grip icon */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5px', pointerEvents: 'none' }}>
                              {[0, 1, 2].map((k) => (
                                <div key={k} style={{
                                  width: '2px', height: '2px', borderRadius: '50%',
                                  backgroundColor: cfg.solid, opacity: isResizing ? 1 : 0.5,
                                }} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer legend ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '20px',
          padding: '10px 20px', borderTop: '1px solid #f1f5f9',
          backgroundColor: '#f8fafc', flexWrap: 'wrap',
        }}>
          {Object.entries(STATUS_BAR).map(([, cfg]) => (
            <div key={cfg.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '4px',
                backgroundColor: cfg.bg, border: `1.5px solid ${cfg.border}`,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', left: 0, top: 0, width: '4px', height: '100%', backgroundColor: cfg.solid }} />
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{cfg.label}</span>
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '2px', height: '14px', background: 'linear-gradient(180deg, #7f56d9, rgba(127,86,217,0.3))', borderRadius: '1px' }} />
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Hoy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f2f4f7', border: '1.5px solid #d0d5dd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '8px', color: '#475467' }}>◆</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Fecha única</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1 }}>⟷</span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Mover</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1 }}>↔</span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Redimensionar</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="22" height="8" viewBox="0 0 22 8" fill="none">
                <path d="M1 4h16" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#leg-arr)"/>
                <defs>
                  <marker id="leg-arr" viewBox="0 0 6 5" refX="5" refY="2.5" markerWidth="4" markerHeight="4" orient="auto">
                    <path d="M 0 0 L 6 2.5 L 0 5 Z" fill="#94a3b8"/>
                  </marker>
                </defs>
              </svg>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Dependencia</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="22" height="8" viewBox="0 0 22 8" fill="none">
                <path d="M1 4h16" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4 2"/>
              </svg>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Violación</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
