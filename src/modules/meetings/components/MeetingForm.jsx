import { useEffect, useRef, useState } from 'react';

// ─── Duration options ─────────────────────────────────────────────────────────
const DURATION_OPTIONS = [
  { value: 15,  label: '15 min' },
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '1 hora' },
  { value: 90,  label: '1h 30 min' },
  { value: 120, label: '2 horas' },
];

const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function meetingToForm(m) {
  return {
    title:          m.title          ?? '',
    projectId:      m.projectId      ?? '',
    date:           m.date           ?? '',
    time:           m.time           ?? '',
    duration:       m.duration       ?? 60,
    description:    m.description    ?? '',
    participantIds: m.participantIds ?? [],
  };
}

const EMPTY_FORM = {
  title: '', projectId: '', date: '', time: '',
  duration: 60, description: '', participantIds: [],
};

function buildMeeting(fields, existing = null) {
  const base = {
    title:          fields.title.trim(),
    projectId:      fields.projectId,
    date:           fields.date,
    time:           fields.time,
    duration:       Number(fields.duration),
    description:    fields.description.trim(),
    participantIds: fields.participantIds,
  };
  return existing ? { ...existing, ...base } : { ...base, id: crypto.randomUUID() };
}

// ─── Style helpers ────────────────────────────────────────────────────────────
function inputBase(hasError = false) {
  return {
    width:           '100%',
    padding:         '9px 13px',
    fontSize:        '14px',
    color:           '#101828',
    backgroundColor: '#fff',
    border:          `1px solid ${hasError ? '#f04438' : '#d0d5dd'}`,
    borderRadius:    '8px',
    outline:         'none',
    boxSizing:       'border-box',
    fontFamily:      'inherit',
    transition:      'border-color 0.15s, box-shadow 0.15s',
  };
}

const FOCUS_ON  = { borderColor: '#7f56d9', boxShadow: '0 0 0 3px rgba(127,86,217,0.12)' };
const FOCUS_OFF = { borderColor: '#d0d5dd', boxShadow: 'none' };
const ERR_OFF   = { borderColor: '#f04438', boxShadow: 'none' };

const onFocus = (e) => Object.assign(e.target.style, FOCUS_ON);
const onBlur  = (e, hasError) => Object.assign(e.target.style, hasError ? ERR_OFF : FOCUS_OFF);

function Field({ label, required, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500, color: '#344054' }}>
        {label}
        {required && <span style={{ color: '#f04438', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: '12px', color: '#f04438' }}>{error}</span>}
    </div>
  );
}

// ─── Participant checkbox item ────────────────────────────────────────────────
function ParticipantRow({ user, checked, onToggle }) {
  return (
    <label
      style={{
        display:         'flex',
        alignItems:      'center',
        gap:             '10px',
        padding:         '7px 10px',
        borderRadius:    '8px',
        cursor:          'pointer',
        transition:      'background-color 0.1s',
        backgroundColor: checked ? '#f9f5ff' : 'transparent',
        border:          `1px solid ${checked ? '#e9d7fe' : 'transparent'}`,
      }}
      onMouseEnter={(e) => { if (!checked) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = checked ? '#f9f5ff' : 'transparent'; }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        style={{ width: '15px', height: '15px', accentColor: '#7f56d9', cursor: 'pointer', flexShrink: 0 }}
      />
      <div style={{
        width:           '28px',
        height:          '28px',
        borderRadius:    '50%',
        backgroundColor: '#f4f3ff',
        border:          '1.5px solid #e9d7fe',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        fontSize:        '10px',
        fontWeight:      700,
        color:           '#6941c6',
        flexShrink:      0,
      }}>
        {user.initials}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#101828' }}>{user.name}</div>
        <div style={{ fontSize: '11px', color: '#98a2b3' }}>{user.email}</div>
      </div>
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   initialMeeting — null = create | Meeting object = edit
 *   projects       — array of projects for the select
 *   users          — array of users for participants
 *   onClose()
 *   onSubmit(meeting)
 */
export default function MeetingForm({ initialMeeting = null, projects, users, onClose, onSubmit }) {
  const isEdit  = initialMeeting !== null && !!initialMeeting.id;
  const [form,   setForm]   = useState(isEdit ? meetingToForm(initialMeeting) : EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const firstRef = useRef(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function toggleParticipant(userId) {
    setForm((prev) => ({
      ...prev,
      participantIds: prev.participantIds.includes(userId)
        ? prev.participantIds.filter((id) => id !== userId)
        : [...prev.participantIds, userId],
    }));
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = 'El título es obligatorio.';
    if (!form.date)          next.date  = 'La fecha es obligatoria.';
    if (!form.time)          next.time  = 'La hora es obligatoria.';
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(buildMeeting(form, isEdit ? initialMeeting : null));
    onClose();
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  const selectStyle = {
    ...inputBase(),
    appearance:         'none',
    backgroundImage:    CHEVRON_SVG,
    backgroundRepeat:   'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight:       '32px',
    cursor:             'pointer',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Editar reunión' : 'Nueva reunión'}
      onClick={handleBackdrop}
      style={{
        position:        'fixed',
        inset:           0,
        backgroundColor: 'rgba(16,24,40,0.5)',
        backdropFilter:  'blur(2px)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        zIndex:          1000,
        padding:         '16px',
      }}
    >
      {/* Card */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius:    '16px',
        boxShadow:       '0px 24px 48px -12px rgba(0,0,0,0.18)',
        width:           '100%',
        maxWidth:        '560px',
        maxHeight:       '90vh',
        display:         'flex',
        flexDirection:   'column',
        overflow:        'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 0', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#101828' }}>
              {isEdit ? 'Editar reunión' : 'Nueva reunión'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#475467' }}>
              {isEdit ? 'Modifica los campos que necesitas.' : 'Completa los datos de la reunión.'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#98a2b3', fontSize: '18px', lineHeight: 1 }}>
            ✕
          </button>
        </div>

        <div style={{ height: '1px', backgroundColor: '#eaecf0', margin: '16px 0 0', flexShrink: 0 }} />

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Título */}
            <Field label="Título" required error={errors.title}>
              <input
                ref={firstRef}
                type="text"
                placeholder="Ej. Revisión de sprint, Demo de producto…"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                maxLength={120}
                style={inputBase(!!errors.title)}
                onFocus={onFocus}
                onBlur={(e) => onBlur(e, !!errors.title)}
              />
            </Field>

            {/* Proyecto */}
            <Field label="Proyecto">
              <select
                value={form.projectId}
                onChange={(e) => set('projectId', e.target.value)}
                style={selectStyle}
                onFocus={onFocus}
                onBlur={(e) => onBlur(e, false)}
              >
                <option value="">Sin proyecto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>

            {/* Row: Fecha + Hora */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Fecha" required error={errors.date}>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  style={{ ...inputBase(!!errors.date), cursor: 'pointer', colorScheme: 'light' }}
                  onFocus={onFocus}
                  onBlur={(e) => onBlur(e, !!errors.date)}
                />
              </Field>
              <Field label="Hora" required error={errors.time}>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => set('time', e.target.value)}
                  style={{ ...inputBase(!!errors.time), cursor: 'pointer', colorScheme: 'light' }}
                  onFocus={onFocus}
                  onBlur={(e) => onBlur(e, !!errors.time)}
                />
              </Field>
            </div>

            {/* Duración */}
            <Field label="Duración">
              <select
                value={form.duration}
                onChange={(e) => set('duration', e.target.value)}
                style={selectStyle}
                onFocus={onFocus}
                onBlur={(e) => onBlur(e, false)}
              >
                {DURATION_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>

            {/* Descripción */}
            <Field label="Descripción">
              <textarea
                placeholder="Agenda, contexto o notas previas…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                maxLength={500}
                style={{ ...inputBase(), resize: 'vertical', minHeight: '80px' }}
                onFocus={onFocus}
                onBlur={(e) => onBlur(e, false)}
              />
            </Field>

            {/* Participantes */}
            {users.length > 0 && (
              <Field label={`Participantes${form.participantIds.length ? ` (${form.participantIds.length})` : ''}`}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                  {users.map((user) => (
                    <ParticipantRow
                      key={user.id}
                      user={user}
                      checked={form.participantIds.includes(user.id)}
                      onToggle={() => toggleParticipant(user.id)}
                    />
                  ))}
                </div>
              </Field>
            )}

          </div>

          {/* Footer */}
          <div style={{
            display:         'flex',
            justifyContent:  'flex-end',
            gap:             '10px',
            padding:         '14px 24px',
            borderTop:       '1px solid #eaecf0',
            backgroundColor: '#f9fafb',
            flexShrink:      0,
          }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d0d5dd', backgroundColor: '#fff', color: '#344054', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              type="submit"
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #6941c6', backgroundColor: '#7f56d9', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
            >
              {isEdit ? 'Guardar cambios' : 'Crear reunión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
