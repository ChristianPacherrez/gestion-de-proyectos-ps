import { useState } from 'react';
import QuoteFormModal from './QuoteFormModal';

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div style={{
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '48px 24px',
      backgroundColor: '#fff',
      border:          '1px dashed #d0d5dd',
      borderRadius:    '12px',
      gap:             '12px',
    }}>
      <span style={{ fontSize: '28px', opacity: 0.3 }}>📄</span>
      <p style={{ margin: 0, fontSize: '14px', color: '#667085', textAlign: 'center' }}>
        No hay cotizaciones para este proyecto.
      </p>
      <button
        onClick={onNew}
        style={{
          padding:         '7px 16px',
          borderRadius:    '8px',
          border:          '1px solid #6941c6',
          backgroundColor: '#7f56d9',
          color:           '#fff',
          fontSize:        '13px',
          fontWeight:      500,
          cursor:          'pointer',
          marginTop:       '4px',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
      >
        + Nueva cotización
      </button>
    </div>
  );
}

// ─── Quote row ────────────────────────────────────────────────────────────────
function QuoteRow({ quote, onView, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const formattedDate = quote.date
    ? new Date(quote.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const formattedTotal = quote.total?.toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }) ?? 'S/ 0.00';

  return (
    <div
      style={{
        display:         'grid',
        gridTemplateColumns: '1fr 140px 120px 120px 40px',
        alignItems:      'center',
        padding:         '12px 16px',
        borderBottom:    '1px solid #f2f4f7',
        transition:      'background-color 0.1s',
        cursor:          'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      onClick={() => onView(quote)}
    >
      {/* Name */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: '#101828' }}>{quote.name}</div>
        <div style={{ fontSize: '12px', color: '#98a2b3', marginTop: '1px' }}>{quote.items?.length ?? 0} ítem(s)</div>
      </div>

      {/* Client */}
      <span style={{ fontSize: '13px', color: '#475467', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {quote.client}
      </span>

      {/* Date */}
      <span style={{ fontSize: '13px', color: '#667085' }}>{formattedDate}</span>

      {/* Total */}
      <span style={{ fontSize: '14px', fontWeight: 600, color: '#101828', textAlign: 'right' }}>
        {formattedTotal}
      </span>

      {/* Actions */}
      <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Opciones"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#98a2b3', padding: '2px 6px', borderRadius: '4px' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f2f4f7'; e.currentTarget.style.color = '#344054'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#98a2b3'; }}
        >
          ⋯
        </button>
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
            <div style={{
              position:        'absolute',
              top:             'calc(100% + 4px)',
              right:           0,
              backgroundColor: '#fff',
              border:          '1px solid #eaecf0',
              borderRadius:    '8px',
              boxShadow:       '0px 8px 16px -4px rgba(0,0,0,0.08)',
              minWidth:        '140px',
              zIndex:          50,
              overflow:        'hidden',
            }}>
              {[
                { label: 'Ver detalle',  action: () => { onView(quote);   setMenuOpen(false); }, color: '#344054' },
                { label: 'Editar',       action: () => { onEdit(quote);   setMenuOpen(false); }, color: '#344054' },
                { label: 'Eliminar',     action: () => { onDelete(quote.id); setMenuOpen(false); }, color: '#f04438' },
              ].map(({ label, action, color }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{ display: 'block', width: '100%', padding: '9px 14px', border: 'none', backgroundColor: '#fff', color, fontSize: '13px', textAlign: 'left', cursor: 'pointer', transition: 'background-color 0.1s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   projectId  — required
 *   quotes     — array of quotes for this project
 *   onView(quote)
 *   onAdd(quote)
 *   onUpdate(id, changes)
 *   onDelete(id)
 */
export default function QuoteList({ projectId, quotes, onView, onAdd, onUpdate, onDelete }) {
  const [modal, setModal] = useState(null); // null | 'new' | <quote>

  function handleSubmit(quote) {
    if (modal === 'new') onAdd(quote);
    else                 onUpdate(quote.id, quote);
  }

  if (!quotes.length) {
    return (
      <>
        <EmptyState onNew={() => setModal('new')} />
        {modal && (
          <QuoteFormModal
            projectId={projectId}
            initialQuote={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSubmit={handleSubmit}
          />
        )}
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px 120px 40px', padding: '8px 16px', borderBottom: '2px solid #eaecf0' }}>
        {['Cotización', 'Cliente', 'Fecha', 'Total', ''].map((h) => (
          <span key={h} style={{ fontSize: '11px', fontWeight: 600, color: '#98a2b3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {quotes.map((q) => (
        <QuoteRow
          key={q.id}
          quote={q}
          onView={onView}
          onEdit={(quote) => setModal(quote)}
          onDelete={onDelete}
        />
      ))}

      {/* Footer: add new */}
      <div style={{ padding: '12px 16px' }}>
        <button
          onClick={() => setModal('new')}
          style={{
            padding:         '6px 14px',
            borderRadius:    '7px',
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
          + Nueva cotización
        </button>
      </div>

      {/* Modal */}
      {modal && (
        <QuoteFormModal
          projectId={projectId}
          initialQuote={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
