import { useState } from 'react';
import QuoteFormModal from './QuoteFormModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(amount) {
  return (amount ?? 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Back button ──────────────────────────────────────────────────────────────
function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:    'inline-flex',
        alignItems: 'center',
        gap:        '6px',
        background: 'none',
        border:     'none',
        cursor:     'pointer',
        fontSize:   '13px',
        fontWeight: 500,
        color:      '#475467',
        padding:    0,
        alignSelf:  'flex-start',
        transition: 'color 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#7f56d9'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#475467'; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      Volver a cotizaciones
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   quote         — the full quote object
 *   projectName   — display name of the associated project
 *   onBack()
 *   onUpdate(id, changes)
 *   onDelete(id)
 */
export default function QuoteDetail({ quote, projectName, onBack, onUpdate, onDelete }) {
  const [editOpen, setEditOpen] = useState(false);

  if (!quote) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#98a2b3' }}>
        <p>Cotización no encontrada.</p>
        <button onClick={onBack} style={{ marginTop: '12px', cursor: 'pointer', color: '#7f56d9', background: 'none', border: 'none', fontSize: '14px' }}>
          ← Volver
        </button>
      </div>
    );
  }

  function handleEdit(updated) {
    onUpdate(updated.id, updated);
  }

  function handleDelete() {
    if (window.confirm('¿Eliminar esta cotización?')) {
      onDelete(quote.id);
      onBack();
    }
  }

  const items = quote.items ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <BackButton onClick={onBack} />

      {/* Header card */}
      <div style={{
        backgroundColor: '#fff',
        border:          '1px solid #eaecf0',
        borderRadius:    '16px',
        padding:         '28px 32px',
        boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#101828', lineHeight: 1.3 }}>
              {quote.name}
            </h1>
            {projectName && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667085' }}>
                Proyecto: <strong style={{ color: '#344054' }}>{projectName}</strong>
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setEditOpen(true)}
              style={{
                padding:         '7px 14px',
                borderRadius:    '8px',
                border:          '1px solid #d0d5dd',
                backgroundColor: '#fff',
                color:           '#344054',
                fontSize:        '13px',
                fontWeight:      500,
                cursor:          'pointer',
                transition:      'background-color 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
            >
              Editar
            </button>
            <button
              onClick={handleDelete}
              style={{
                padding:         '7px 14px',
                borderRadius:    '8px',
                border:          '1px solid #fda29b',
                backgroundColor: '#fff',
                color:           '#f04438',
                fontSize:        '13px',
                fontWeight:      500,
                cursor:          'pointer',
                transition:      'background-color 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef3f2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
            >
              Eliminar
            </button>
          </div>
        </div>

        {/* Meta stats */}
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          {[
            { label: 'Cliente',    value: quote.client || '—' },
            { label: 'Fecha',      value: fmtDate(quote.date)  },
            { label: 'N.° ítems',  value: items.length          },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#101828' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Items table */}
      <div style={{
        backgroundColor: '#fff',
        border:          '1px solid #eaecf0',
        borderRadius:    '16px',
        overflow:        'hidden',
        boxShadow:       '0px 1px 2px rgba(0,0,0,0.05)',
      }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px', padding: '12px 24px', borderBottom: '1px solid #f2f4f7', backgroundColor: '#f9fafb' }}>
          {['Descripción', 'Cant.', 'P. unitario', 'Subtotal'].map((h) => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {items.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#98a2b3', fontSize: '14px' }}>
            Sin ítems.
          </div>
        ) : (
          items.map((item, i) => {
            const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
            return (
              <div
                key={item.id}
                style={{
                  display:         'grid',
                  gridTemplateColumns: '1fr 80px 120px 120px',
                  padding:         '12px 24px',
                  borderBottom:    i < items.length - 1 ? '1px solid #f2f4f7' : 'none',
                  alignItems:      'center',
                }}
              >
                <span style={{ fontSize: '14px', color: '#101828' }}>{item.description || '—'}</span>
                <span style={{ fontSize: '14px', color: '#475467' }}>{item.quantity}</span>
                <span style={{ fontSize: '14px', color: '#475467' }}>{fmt(parseFloat(item.unitPrice))}</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#101828' }}>{fmt(subtotal)}</span>
              </div>
            );
          })
        )}

        {/* Total row */}
        <div style={{
          display:         'flex',
          justifyContent:  'flex-end',
          alignItems:      'center',
          gap:             '24px',
          padding:         '16px 24px',
          borderTop:       '2px solid #eaecf0',
          backgroundColor: '#f9fafb',
        }}>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#475467' }}>Total</span>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#101828' }}>
            {fmt(quote.total)}
          </span>
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <QuoteFormModal
          projectId={quote.projectId}
          initialQuote={quote}
          onClose={() => setEditOpen(false)}
          onSubmit={handleEdit}
        />
      )}
    </div>
  );
}
