import { useEffect, useRef, useState } from 'react';
import { Button, Input, TextArea, Select, Modal } from '../../../components/ui';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'active',    label: 'Activo'     },
  { value: 'paused',    label: 'Pausado'    },
  { value: 'completed', label: 'Completado' },
];

const EMPTY_FORM = { name: '', description: '', status: 'active', dueDate: '' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Create mode → nuevo objeto con id, sin memberEmails.
 * Edit mode   → merge con existing, preserva status/dueDate/progress/tasks.
 */
function buildProject(fields, existing = null) {
  const shared = {
    name:        fields.name.trim(),
    description: fields.description.trim(),
    status:      fields.status  ?? existing?.status  ?? 'active',
    dueDate:     fields.dueDate ?? existing?.dueDate ?? null,
  };

  if (existing) {
    return { ...existing, ...shared };
  }

  return {
    ...shared,
    id:         crypto.randomUUID(),
    progress:   0,
    tasksTotal: 0,
    tasksDone:  0,
  };
}

function projectToForm(project) {
  return {
    name:        project.name,
    description: project.description,
    status:      project.status,
    dueDate:     project.dueDate,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Dual-mode modal — campos: nombre · descripción · estado · fecha de entrega.
 * Los miembros se gestionan exclusivamente desde la vista del proyecto (pestaña Equipo).
 */
export default function CreateProjectModal({ initialProject = null, onClose, onSubmit }) {
  const isEditMode = initialProject !== null;

  const [form,   setForm]   = useState(isEditMode ? projectToForm(initialProject) : EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);

  // Autofocus on open
  useEffect(() => { firstInputRef.current?.focus(); }, []);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'El nombre es obligatorio.';
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSubmit(buildProject(form, isEditMode ? initialProject : null));
    onClose();
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEditMode ? 'Editar proyecto' : 'Nuevo proyecto'}
      description={isEditMode
        ? 'Modifica los campos que necesitas actualizar.'
        : 'Dale un nombre a tu proyecto para empezar.'}
      maxWidth="480px"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 24px' }}>

          {/* Nombre */}
          <Input
            ref={firstInputRef}
            label="Nombre del proyecto"
            isRequired
            isInvalid={!!errors.name}
            hint={errors.name}
            placeholder="Ej. Rediseño de plataforma"
            value={form.name}
            onChange={(v) => set('name', v)}
            maxLength={80}
          />

          {/* Descripción */}
          <TextArea
            label="Descripción"
            placeholder="Describe brevemente el objetivo del proyecto…"
            value={form.description}
            onChange={(v) => set('description', v)}
            rows={3}
            maxLength={280}
          />

          {/* Estado + Fecha de entrega */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Estado"
              isRequired
              items={STATUS_OPTIONS}
              value={form.status ?? 'active'}
              onChange={(v) => set('status', v)}
            />
            <Input
              label="Fecha de entrega"
              isInvalid={!!errors.dueDate}
              hint={errors.dueDate}
              type="date"
              value={form.dueDate ?? ''}
              onChange={(v) => set('dueDate', v)}
            />
          </div>

        </div>

        {/* Footer */}
        <Modal.Footer>
          <Button color="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button color="primary" type="submit">
            {isEditMode ? 'Guardar cambios' : 'Crear proyecto'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
