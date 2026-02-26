import { useState, useCallback } from 'react';
import SearchBox from '../components/SearchBox';
import SearchResults from '../components/SearchResults';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SearchContext from '../components/SearchContext';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [aiContext, setAiContext] = useState(null);

  const handleSearch = useCallback(async (q, explain = false) => {
    if (!q?.trim()) return;
    setLoading(true);
    setAiLoading(false);
    setError(null);
    setResults(null);
    setAiContext(null);

    try {
      // Phase 1: Fast Vector Search (explain=false)
      const params = new URLSearchParams({ q: q.trim(), limit: 5 });
      const res = await fetch(`/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || res.statusText);

      setQuery(q.trim());
      setResults(data.results ?? []);
      setLoading(false); // Results are visible now!

      // Phase 2: Background AI Analysis (if explain=true)
      if (explain) {
        setAiLoading(true);
        params.set('explain', 'true');
        const aiRes = await fetch(`/search?${params.toString()}`);
        const aiData = await aiRes.json();

        if (aiRes.ok) {
          // Update only with AI results and context
          setResults(aiData.results ?? []);
          setAiContext(aiData.aiContext ?? null);
        }
        setAiLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Search failed');
      setResults([]);
      setLoading(false);
      setAiLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setResults(null);
    setAiContext(null);
    setQuery('');
  }, []);

  const showInitialEmpty = results === null && !loading && !error;

  return (
    <div className="space-y-8 animate-fade-in transition-colors duration-300">
      {!error && (
        <>
          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight sm:text-4xl">
              Search by Meaning
            </h1>
            <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
              Ask in plain language. Results are ranked by semantic similarity.
            </p>
          </div>
          <SearchBox onSearch={handleSearch} disabled={loading} />
        </>
      )}

      {aiContext && !loading && !error && <SearchContext context={aiContext} query={query} />}

      {aiLoading && (
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 animate-pulse">
          <LoadingSpinner size="sm" />
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            AI Strategy Agent is analyzing results...
          </span>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-14 animate-fade-in">
          <LoadingSpinner />
          <p className="text-sm font-medium text-slate-500">Finding matches…</p>
        </div>
      )}

      {showInitialEmpty && (
        <EmptyState
          title="Try a search above"
          description="Enter a question or phrase and tap Search now to see semantic matches from your documents."
          actionLabel="Search now"
          onAction={() => document.getElementById('search-input')?.focus()}
        />
      )}

      <SearchResults
        query={query}
        results={results}
        loading={loading}
        error={error}
        onRetry={handleRetry}
      />
    </div>
  );
}
