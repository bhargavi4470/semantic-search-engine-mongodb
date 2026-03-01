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
      // Ensure user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authorization token required. Please sign in and try again.');
      }

      // Phase 1: Fast Vector Search (explain=false)
      const params = new URLSearchParams({ q: q.trim(), limit: 5 });
      const res = await fetch(`/search?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || res.statusText);

      setQuery(q.trim());
      setResults(data.results ?? []);
      setLoading(false); // Results are visible now!

      // Phase 2: Background AI Analysis (if explain=true)
      if (explain) {
        setAiLoading(true);
        params.set('explain', 'true');
        const aiRes = await fetch(`/search?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
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
        <div className="mb-10 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900 p-8 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="rounded-xl bg-indigo-200 dark:bg-indigo-800 p-3.5 text-indigo-400 dark:text-indigo-500 animate-pulse">
              <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
            </div>
            <div className="space-y-4 flex-1">
              <h3 className="font-black text-slate-300 dark:text-slate-700 text-2xl tracking-tight">AI Insights</h3>
              <div className="flex items-center gap-3">
                <LoadingSpinner size="sm" />
                <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest animate-pulse">
                  AI Strategy Agent is analyzing results...
                </span>
              </div>
            </div>
          </div>
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
