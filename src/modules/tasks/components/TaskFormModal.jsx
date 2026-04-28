import { useEffect, useRef, useState } from 'react';
import { Button, Input, TextArea, Select, Modal } from '../../../components/ui';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'todo',        label: 'Por hacer'  },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'done',        label: 'Completada' },
];

const UNIT_OPTIONS = [
  { value: 'hours', label: 'horas' },
  { value: 'days',  label: 'días'  },
  { value: 'weeks', label: 'sem.'  },
];

// Returns today as YYYY-MM-DD (Supabase-compatible, local timezone)
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Function (not constant) so the date is fresh every time the modal opens
function createEmptyForm() {
  return {
    name:          '',
    description:   '',
    status:        'todo',
    startDate:     todayISO(),
    dueDate:       '',
    estimatedTime: '',
    estimatedUnit: 'hours',
    dependsOn:     '',
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function taskToForm(task) {
  return {
    name:          task.name          ?? '',
    description:   task.description   ?? '',
    status:        task.status        ?? 'todo',
    startDate:     task.startDate     ?? '',
    dueDate:       task.dueDate       ?? '',
    estimatedTime: task.estimatedTime != null ? String(task.estimatedTime) : '',
    estimatedUnit: task.estimatedUnit ?? 'hours',
    dependsOn:     task.dependsOn     ?? '',
  };
}

function buildTask(fields, existing = null) {
  const shared = {
    name:          fields.name.trim(),
    description:   fields.description.trim(),
    status:        fields.status,
    startDate:     fields.startDate,
    dueDate:       fields.dueDate,
    estimatedTime: fields.estimatedTime !== '' ? Number(fields.estimatedTime) : null,
    estimatedUnit: fields.estimatedUnit ?? 'hours',
    dependsOn:     fields.dependsOn || null,
  };
  return existing ? { ...existing, ...shared } : { ...shared, id: crypto.randomUUID() };
}

// ─── Cycle detection ──────────────────────────────────────────────────────────
function wouldCreateCycle(tasks, currentId, candidateId) {
  if (!currentId || !candidateId) return false;
  const visited = new Set();
  let nodeId = candidateId;
  while (nodeId) {
    if (nodeId === currentId) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    const node = tasks.find((t) => t.id === nodeId);
    nodeId = node?.dependsOn ?? null;
  }
  return false;
}

// ─── Row layout helper ────────────────────────────────────────────────────────
function Row({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Dual-mode modal for creating and editing tasks.
 *
 * Props:
 *   initialTask  — null = create | Task object = edit
 *   allTasks     — all tasks in the project (for "Depende de" select)
 *   onClose()
 *   onSubmit(task)
 */
export default function TaskFormModal({ initialTask = null, allTasks = [], onClose, onSubmit }) {
  const isEdit    = initialTask !== null;
  const currentId = initialTask?.id ?? null;

  const [form,   setForm]   = useState(isEdit ? taskToForm(initialTask) : createEmptyForm);
  const [errors, setErrors] = useState({});
  const firstRef = useRef(null);

  // Autofocus on open
  useEffect(() => { firstRef.current?.focus(); }, []);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'El nombre es obligatorio.';
    if (form.startDate && form.dueDate && form.startDate > form.dueDate) {
      next.startDate = 'La fecha de inicio no puede ser posterior a la entrega.';
    }
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(buildTask(form, isEdit ? initialTask : null));
    onClose();
  }

  // Valid "Depende de" options — exclude self + cycle-creating tasks
  const dependsOnOptions = allTasks
    .filter((t) => t.id !== currentId && !wouldCreateCycle(allTasks, currentId, t.id))
    .map((t) => ({ value: t.id, label: t.name }));

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Editar tarea' : 'Nueva tarea'}
      description={isEdit ? 'Modifica los campos que necesitas.' : 'Completa los datos de la tarea.'}
      maxWidth="520px"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 24px' }}>

          {/* Nombre */}
          <Input
            ref={firstRef}
            label="Nombre de la tarea"
            isRequired
            isInvalid={!!errors.name}
            hint={errors.name}
            placeholder="Ej. Diseñar pantalla de login"
            value={form.name}
            onChange={(v) => set('name', v)}
            maxLength={120}
          />

          {/* Descripción */}
          <TextArea
            label="Descripción"
            placeholder="Detalla el alcance de la tarea…"
            value={form.description}
            onChange={(v) => set('description', v)}
            rows={3}
            maxLength={400}
          />

          {/* Estado + Tiempo estimado */}
          <Row>
            <Select
              label="Estado"
              isRequired
              items={STATUS_OPTIONS}
              value={form.status}
              onChange={(v) => set('status', v)}
            />

            {/* Tiempo estimado: número + unidad */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#344054', lineHeight: '20px' }}>
                Tiempo estimado
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input
                  placeholder="0"
                  type="number"
                  value={form.estimatedTime}
                  onChange={(v) => set('estimatedTime', v)}
                  style={{ width: '80px', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <Select
                    items={UNIT_OPTIONS}
                    value={form.estimatedUnit}
                    onChange={(v) => set('estimatedUnit', v)}
                  />
                </div>
              </div>
            </div>
          </Row>

          {/* Fechas */}
          <Row>
            <Input
              label="Fecha de inicio"
              isInvalid={!!errors.startDate}
              hint={errors.startDate}
              type="date"
              value={form.startDate}
              onChange={(v) => set('startDate', v)}
            />
            <Input
              label="Fecha de entrega"
              type="date"
              value={form.dueDate}
              onChange={(v) => set('dueDate', v)}
            />
          </Row>

          {/* Depende de */}
          {dependsOnOptions.length > 0 && (
            <Select
              label="Depende de"
              placeholder="Sin dependencia"
              items={dependsOnOptions}
              value={form.dependsOn}
              onChange={(v) => set('dependsOn', v)}
              hint={form.dependsOn
                ? 'Esta tarea no puede comenzar hasta que la tarea seleccionada esté completa.'
                : undefined}
            />
          )}

        </div>

        {/* Footer */}
        <Modal.Footer>
          <Button color="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="primary" type="submit">
            {isEdit ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
