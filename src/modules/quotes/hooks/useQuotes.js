import { useQuotesContext } from '../context/QuotesContext';

/**
 * Convenience hook.
 * Pass a projectId to get quotes scoped to that project,
 * or omit it to get all quotes.
 */
export function useQuotes(projectId) {
  const { quotes, addQuote, updateQuote, deleteQuote, getProjectQuotes } =
    useQuotesContext();

  const projectQuotes = projectId ? getProjectQuotes(projectId) : quotes;

  return {
    quotes:    projectQuotes,
    allQuotes: quotes,
    addQuote,
    updateQuote,
    deleteQuote,
  };
}
