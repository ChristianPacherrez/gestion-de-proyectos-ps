import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

// ─── Design-system tokens ─────────────────────────────────────────────────────
const t = {
  textPrimary:     'var(--color-text-primary,   #101828)',
  textQuaternary:  'var(--color-text-quaternary,#98a2b3)',
  bgSecondary:     'var(--color-bg-secondary,   #f9fafb)',
  borderPrimary:   'var(--color-border-primary, #eaecf0)',
  borderSecondary: 'var(--color-border-secondary,#d0d5dd)',
  brand600:        'var(--color-brand-600,       #7f56d9)',
  brandBg:         'var(--color-bg-brand-primary,#f9f5ff)',
  shadowXs:        'var(--shadow-xs, 0px 1px 2px rgba(0,0,0,0.05))',
  radiusLg:        'var(--radius-lg,   0.5rem)',
  radiusXl:        'var(--radius-xl,   0.75rem)',
  radiusFull:      'var(--radius-full, 9999px)',
  textXs:          'var(--text-xs, 0.75rem)',
  textSm:          'var(--text-sm, 0.875rem)',
};

// ─── Column definitions ───────────────────────────────────────────────────────
// Claves alineadas con los valores de status en la DB: todo | in_progress | done
const COLUMNS = [
  {
    key:          'todo',
    label:        'Por hacer',
    dotColor:     'var(--color-fg-quaternary,    #98a2b3)',
    headerBg:     'var(--color-bg-tertiary,      #f2f4f7)',
    headerBorder: 'var(--color-border-primary,   #eaecf0)',
    countBg:      'var(--color-bg-quaternary,    #eaecf0)',
    countColor:   'var(--color-text-secondary,   #475467)',
    colBg:        'var(--color-bg-secondary,     #f9fafb)',
    colBgOver:    '#f0f0ff',
  },
  {
    key:          'in_progress',
    label:        'En proceso',
    dotColor:     '#2e90fa',
    headerBg:     '#eff8ff',
    headerBorder: '#b2ddff',
    countBg:      '#dbeafe',
    countColor:   '#175cd3',
    colBg:        '#f5fbff',
    colBgOver:    '#e8f4ff',
  },
  {
    key:          'done',
    label:        'Completada',
    dotColor:     'var(--color-fg-success-primary, #17b26a)',
    headerBg:     'var(--color-bg-success-primary, #ecfdf3)',
    headerBorder: '#abefc6',
    countBg:      'var(--color-bg-success-secondary, #dcfce7)',
    countColor:   'var(--color-text-success-primary, #027a48)',
    colBg:        '#f5fdf8',
    colBgOver:    '#e0faed',
  },
];

const COLUMN_KEYS = new Set(COLUMNS.map((c) => c.key));

// ─── "Add task" button ────────────────────────────────────────────────────────
function AddTaskBtn({ onNew }) {
  return (
    <button
      onClick={onNew}
      style={{
        width: '100%', padding: '8px 12px',
        borderRadius: t.radiusLg,
        border: `1px dashed ${t.borderSecondary}`,
        backgroundColor: 'transparent',
        color: t.textQuaternary,
        fontSize: t.textXs, fontWeight: 500,
        cursor: 'pointer', textAlign: 'center',
        transition: 'border-color 0.15s, color 0.15s, background-color 0.15s',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor     = t.brand600;
        e.currentTarget.style.color           = t.brand600;
        e.currentTarget.style.backgroundColor = t.brandBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor     = t.borderSecondary;
        e.currentTarget.style.color           = t.textQuaternary;
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      + Nueva tarea
    </button>
  );
}

// ─── Column empty state ───────────────────────────────────────────────────────
function ColumnEmpty() {
  return (
    <div style={{
      padding: '16px 12px', textAlign: 'center',
      color: t.textQuaternary, fontSize: t.textXs, lineHeight: 1.5,
    }}>
      Sin tareas
    </div>
  );
}

// ─── Single column — droppable ────────────────────────────────────────────────
function KanbanColumn({ col, tasks, onEdit, onDelete, onNew, canEdit, canDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  const taskIds = tasks.map((task) => task.id);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '8px',
      minWidth: '240px', flex: '1 1 240px', maxWidth: '340px',
    }}>

      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 12px',
        backgroundColor: col.headerBg,
        border: `1px solid ${col.headerBorder}`,
        borderRadius: t.radiusXl,
        boxShadow: t.shadowXs,
      }}>
        <span style={{
          width: '7px', height: '7px',
          borderRadius: t.radiusFull,
          backgroundColor: col.dotColor, flexShrink: 0,
        }} />
        <span style={{
          fontSize: t.textSm, fontWeight: 600, color: t.textPrimary,
          flex: 1, lineHeight: 'var(--text-sm--line-height, 1.25rem)',
        }}>
          {col.label}
        </span>
        <span style={{
          padding: '1px 7px', borderRadius: t.radiusFull,
          fontSize: t.textXs, fontWeight: 600,
          backgroundColor: col.countBg, color: col.countColor,
          lineHeight: 'var(--text-xs--line-height, 1.125rem)',
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Cards container — droppable + sortable */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            backgroundColor: isOver ? col.colBgOver : col.colBg,
            border: isOver
              ? `1.5px dashed ${t.brand600}`
              : `1px solid ${t.borderPrimary}`,
            borderRadius: t.radiusXl,
            padding: '10px',
            minHeight: '120px',
            boxShadow: t.shadowXs,
            transition: 'background-color 0.15s, border-color 0.15s',
          }}
        >
          {tasks.length === 0 && <ColumnEmpty />}
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
          {canEdit && <AddTaskBtn onNew={onNew} />}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   tasks      — full array of task objects (all statuses)
 *   onEdit     — (task) open edit modal
 *   onDelete   — (taskId) delete task
 *   onNew      — () open create modal
 *   onReorder  — (activeId, overId, targetStatus, overIsColumn) reorder/move task
 */
export default function KanbanBoard({ tasks = [], onEdit, onDelete, onNew, onReorder, canEdit = true, canDelete = true }) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },  // min 8px drag to activate — allows clicks
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart({ active }) {
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null);
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const activeTaskObj = tasks.find((t) => t.id === active.id);
    if (!activeTaskObj) return;

    const overIsColumn  = COLUMN_KEYS.has(String(over.id));
    const targetStatus  = overIsColumn
      ? String(over.id)
      : (tasks.find((t) => t.id === over.id)?.status ?? activeTaskObj.status);

    onReorder(active.id, over.id, targetStatus, overIsColumn);
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  const byStatus = (key) => tasks.filter((t) => t.status === key);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div style={{
        display: 'flex', gap: '14px',
        alignItems: 'flex-start',
        overflowX: 'auto',
        paddingBottom: '12px',
      }}>
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            col={col}
            tasks={byStatus(col.key)}
            onEdit={onEdit}
            onDelete={onDelete}
            onNew={onNew}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ))}
      </div>

      {/* Floating card during drag */}
      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeTask ? (
          <KanbanCard
            task={activeTask}
            onEdit={() => {}}
            onDelete={() => {}}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
