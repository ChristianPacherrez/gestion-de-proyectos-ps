import { useEffect, useRef, useState } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcTotal(items) {
  return items.reduce((sum, item) => {
    const qty   = parseFloat(item.quantity)  || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
}

function emptyItem() {
  return { id: crypto.randomUUID(), description: '', quantity: '1', unitPrice: '' };
}

const EMPTY_FORM = { name: '', client: '', date: '' };

function quoteToForm(quote) {
  return {
    name:   quote.name   ?? '',
    client: quote.client ?? '',
    date:   quote.date   ?? '',
  };
}

function buildQuote(fields, items, projectId, existing = null) {
  const base = {
    name:      fields.name.trim(),
    client:    fields.client.trim(),
    date:      fields.date,
    projectId,
    items,
    total:     calcTotal(items),
  };
  return existing
    ? { ...existing, ...base }
    : { ...base, id: crypto.randomUUID() };
}

// ─── Shared style helpers ─────────────────────────────────────────────────────
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

// ─── Field wrapper ────────────────────────────────────────────────────────────
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

// ─── Item row ─────────────────────────────────────────────────────────────────
function ItemRow({ item, onChange, onRemove, canRemove }) {
  const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 96px 84px 28px', gap: '8px', alignItems: 'center' }}>
      <input
        type="text"
        placeholder="Descripción"
        value={item.description}
        onChange={(e) => onChange(item.id, 'description', e.target.value)}
        maxLength={120}
        style={inputBase()}
        onFocus={onFocus}
        onBlur={(e) => onBlur(e, false)}
      />
      <input
        type="number"
        placeholder="Cant."
        value={item.quantity}
        min="0"
        step="any"
        onChange={(e) => onChange(item.id, 'quantity', e.target.value)}
        style={inputBase()}
        onFocus={onFocus}
        onBlur={(e) => onBlur(e, false)}
      />
      <input
        type="number"
        placeholder="P. unitario"
        value={item.unitPrice}
        min="0"
        step="any"
        onChange={(e) => onChange(item.id, 'unitPrice', e.target.value)}
        style={inputBase()}
        onFocus={onFocus}
        onBlur={(e) => onBlur(e, false)}
      />
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#101828', textAlign: 'right', paddingRight: '4px' }}>
        {subtotal.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 })}
      </span>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        disabled={!canRemove}
        aria-label="Eliminar ítem"
        style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          width:           '24px',
          height:          '24px',
          borderRadius:    '6px',
          border:          'none',
          backgroundColor: 'transparent',
          color:           canRemove ? '#98a2b3' : '#d0d5dd',
          cursor:          canRemove ? 'pointer' : 'not-allowed',
          fontSize:        '14px',
          lineHeight:      1,
          flexShrink:      0,
          transition:      'color 0.1s, background-color 0.1s',
        }}
        onMouseEnter={(e) => { if (canRemove) { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#f04438'; } }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = canRemove ? '#98a2b3' : '#d0d5dd'; }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Dual-mode modal for creating and editing quotes.
 *
 * Props:
 *   projectId     — required: the project this quote belongs to
 *   initialQuote  — null = create | Quote object = edit
 *   onClose()
 *   onSubmit(quote)
 */
export default function QuoteFormModal({ projectId, initialQuote = null, onClose, onSubmit }) {
  const isEdit  = initialQuote !== null;
  const [form,  setForm]  = useState(isEdit ? quoteToForm(initialQuote) : EMPTY_FORM);
  const [items, setItems] = useState(
    isEdit && initialQuote.items?.length
      ? initialQuote.items
      : [emptyItem()]
  );
  const [errors, setErrors] = useState({});
  const firstRef = useRef(null);

  // Autofocus + Escape
  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const total = calcTotal(items);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function changeItem(id, field, value) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function validate() {
    const next = {};
    if (!form.name.trim())   next.name   = 'El nombre es obligatorio.';
    if (!form.client.trim()) next.client = 'El cliente es obligatorio.';
    if (!form.date)          next.date   = 'La fecha es obligatoria.';
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(buildQuote(form, items, projectId, isEdit ? initialQuote : null));
    onClose();
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose();
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Editar cotización' : 'Nueva cotización'}
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
        maxWidth:        '680px',
        maxHeight:       '90vh',
        display:         'flex',
        flexDirection:   'column',
        overflow:        'hidden',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 24px 0', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#101828' }}>
              {isEdit ? 'Editar cotización' : 'Nueva cotización'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#475467' }}>
              {isEdit ? 'Modifica los campos que necesitas.' : 'Completa los datos de la cotización.'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#98a2b3', fontSize: '18px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <div style={{ height: '1px', backgroundColor: '#eaecf0', margin: '16px 0 0', flexShrink: 0 }} />

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Row: Nombre + Cliente */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Nombre de la cotización" required error={errors.name}>
                <input
                  ref={firstRef}
                  type="text"
                  placeholder="Ej. Propuesta web corporativa"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  maxLength={120}
                  style={inputBase(!!errors.name)}
                  onFocus={onFocus}
                  onBlur={(e) => onBlur(e, !!errors.name)}
                />
              </Field>

              <Field label="Cliente" required error={errors.client}>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  value={form.client}
                  onChange={(e) => setField('client', e.target.value)}
                  maxLength={100}
                  style={inputBase(!!errors.client)}
                  onFocus={onFocus}
                  onBlur={(e) => onBlur(e, !!errors.client)}
                />
              </Field>
            </div>

            {/* Fecha */}
            <Field label="Fecha" required error={errors.date} style={{ maxWidth: '220px' }}>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
                style={{ ...inputBase(!!errors.date), cursor: 'pointer', colorScheme: 'light' }}
                onFocus={onFocus}
                onBlur={(e) => onBlur(e, !!errors.date)}
              />
            </Field>

            {/* Items section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#344054' }}>Ítems</span>
                <button
                  type="button"
                  onClick={addItem}
                  style={{
                    padding:         '5px 12px',
                    borderRadius:    '6px',
                    border:          '1px solid #d0d5dd',
                    backgroundColor: '#fff',
                    color:           '#344054',
                    fontSize:        '12px',
                    fontWeight:      500,
                    cursor:          'pointer',
                    transition:      'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  + Agregar ítem
                </button>
              </div>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 96px 84px 28px', gap: '8px', paddingBottom: '4px', borderBottom: '1px solid #f2f4f7' }}>
                {['Descripción', 'Cantidad', 'P. unitario', 'Subtotal', ''].map((h) => (
                  <span key={h} style={{ fontSize: '11px', fontWeight: 500, color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Item rows */}
              {items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onChange={changeItem}
                  onRemove={removeItem}
                  canRemove={items.length > 1}
                />
              ))}

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #eaecf0', gap: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#475467' }}>Total</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#101828' }}>
                  {total.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

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
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d0d5dd', backgroundColor: '#fff', color: '#344054', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #6941c6', backgroundColor: '#7f56d9', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
            >
              {isEdit ? 'Guardar cambios' : 'Crear cotización'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
