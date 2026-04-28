import { useState } from 'react';
import { useQuotes }    from '../hooks/useQuotes';
import { useProjects }  from '../../projects/hooks/useProjects';
import { useNavigation, PAGES } from '../../../context/NavigationContext';
import QuoteDetail      from '../components/QuoteDetail';
import QuoteFormModal   from '../components/QuoteFormModal';

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNavigateProjects }) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '80px 24px',
      gap:            '12px',
      textAlign:      'center',
    }}>
      <span style={{ fontSize: '40px', opacity: 0.25 }}>📄</span>
      <p style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: '#344054' }}>
        Sin cotizaciones todavía
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: '#667085' }}>
        Crea cotizaciones desde el detalle de cada proyecto.
      </p>
      <button
        onClick={onNavigateProjects}
        style={{
          marginTop:       '8px',
          padding:         '8px 18px',
          borderRadius:    '8px',
          border:          '1px solid #6941c6',
          backgroundColor: '#7f56d9',
          color:           '#fff',
          fontSize:        '13px',
          fontWeight:      500,
          cursor:          'pointer',
          transition:      'background-color 0.1s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6941c6'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#7f56d9'; }}
      >
        Ver proyectos
      </button>
    </div>
  );
}

// ─── Quote card ───────────────────────────────────────────────────────────────
function QuoteCard({ quote, projectName, onClick }) {
  const formattedDate = quote.date
    ? new Date(quote.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const formattedTotal = (quote.total ?? 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 });

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#fff',
        border:          '1px solid #eaecf0',
        borderRadius:    '12px',
        padding:         '18px 20px',
        cursor:          'pointer',
        transition:      'box-shadow 0.15s, border-color 0.15s',
        display:         'flex',
        flexDirection:   'column',
        gap:             '12px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow     = '0px 4px 8px -2px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor   = '#d0d5dd';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow   = 'none';
        e.currentTarget.style.borderColor = '#eaecf0';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#101828', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {quote.name}
          </div>
          <div style={{ fontSize: '12px', color: '#667085', marginTop: '3px' }}>
            {quote.client}
          </div>
        </div>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#101828', flexShrink: 0 }}>
          {formattedTotal}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          display:         'inline-block',
          padding:         '2px 10px',
          borderRadius:    '9999px',
          fontSize:        '11px',
          fontWeight:      500,
          backgroundColor: '#f4f3ff',
          color:           '#6941c6',
          border:          '1px solid #e9d7fe',
          maxWidth:        '160px',
          whiteSpace:      'nowrap',
          overflow:        'hidden',
          textOverflow:    'ellipsis',
        }}>
          {projectName ?? 'Proyecto'}
        </span>
        <span style={{ fontSize: '12px', color: '#98a2b3' }}>{formattedDate}</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function QuotesPage() {
  const { navigate }                   = useNavigation();
  const { quotes, updateQuote, deleteQuote } = useQuotes();
  const { projects }                   = useProjects();
  const [activeQuoteId, setActiveQuoteId] = useState(null);

  function getProjectName(projectId) {
    return projects.find((p) => p.id === projectId)?.name ?? 'Proyecto';
  }

  const activeQuote = activeQuoteId ? quotes.find((q) => q.id === activeQuoteId) : null;

  if (activeQuote) {
    return (
      <QuoteDetail
        quote={activeQuote}
        projectName={getProjectName(activeQuote.projectId)}
        onBack={() => setActiveQuoteId(null)}
        onUpdate={(id, changes) => { updateQuote(id, changes); }}
        onDelete={(id) => { deleteQuote(id); setActiveQuoteId(null); }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#101828' }}>Cotizaciones</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#667085' }}>
            {quotes.length} cotización{quotes.length !== 1 ? 'es' : ''} en total
          </p>
        </div>
      </div>

      {/* Content */}
      {quotes.length === 0 ? (
        <EmptyState onNavigateProjects={() => navigate(PAGES.PROJECTS)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {quotes.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              projectName={getProjectName(q.projectId)}
              onClick={() => setActiveQuoteId(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
