import { createContext, useContext, useState, useEffect } from 'react';
import { load, save } from '../../../utils/storage';

// ─── Context ──────────────────────────────────────────────────────────────────
const QuotesContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function QuotesProvider({ children }) {
  const [quotes, setQuotes] = useState(() => load('quotes', []));

  useEffect(() => {
    save('quotes', quotes);
  }, [quotes]);

  /** Prepend a new quote */
  function addQuote(quote) {
    setQuotes((prev) => [quote, ...prev]);
  }

  /** Merge changes into an existing quote by id */
  function updateQuote(id, changes) {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...changes } : q))
    );
  }

  /** Remove a quote by id */
  function deleteQuote(id) {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  }

  /** Get all quotes for a project */
  function getProjectQuotes(projectId) {
    return quotes.filter((q) => q.projectId === projectId);
  }

  const value = { quotes, addQuote, updateQuote, deleteQuote, getProjectQuotes };

  return (
    <QuotesContext.Provider value={value}>
      {children}
    </QuotesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useQuotesContext() {
  const ctx = useContext(QuotesContext);
  if (!ctx) throw new Error('useQuotesContext must be inside <QuotesProvider>');
  return ctx;
}
