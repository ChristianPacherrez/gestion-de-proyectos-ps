import TaskItem from './TaskItem';

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.4 }}>✓</div>
      <p style={{ margin: 0, fontWeight: 500, fontSize: '14px', color: '#344054' }}>
        Sin tareas aún
      </p>
      <p style={{ margin: '4px 0 16px', fontSize: '13px', color: '#98a2b3' }}>
        Crea la primera tarea para empezar a avanzar.
      </p>
      <button
        onClick={onNew}
        style={{
          padding:         '8px 16px',
          borderRadius:    '8px',
          border:          '1px solid #6941c6',
          backgroundColor: '#7f56d9',
          color:           '#fff',
          fontSize:        '13px',
          fontWeight:      500,
          cursor:          'pointer',
        }}
      >
        + Nueva tarea
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   tasks           — array of task objects
 *   onToggleDone    — (taskId) quick complete toggle
 *   onStatusChange  — (taskId, newStatus) full status change
 *   onEdit          — (task) open edit modal
 *   onDelete        — (taskId) delete task
 *   onMove          — (taskId, 'up'|'down') reorder task
 *   onNew           — () open create modal (used in empty state)
 */
export default function TaskList({ tasks = [], onToggleDone, onStatusChange, onEdit, onDelete, onMove, onNew, canEdit = true, canDelete = true }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      border:          '1px solid #eaecf0',
      borderRadius:    '12px',
      overflow:        'hidden',
    }}>
      {tasks.length === 0 ? (
        <EmptyState onNew={canEdit ? onNew : undefined} />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {tasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              isFirst={index === 0}
              isLast={index === tasks.length - 1}
              onToggleDone={onToggleDone}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onMoveUp={() => onMove(task.id, 'up')}
              onMoveDown={() => onMove(task.id, 'down')}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
