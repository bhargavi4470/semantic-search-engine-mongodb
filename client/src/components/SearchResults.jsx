/**
 * Search results list — empty/error states + smooth animations. Hackathon-judge friendly.
 */
import ResultCard from './ResultCard';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

const STAGGER = [
  'animate-fade-in-up animate-fade-in-up-delay-1',
  'animate-fade-in-up animate-fade-in-up-delay-2',
  'animate-fade-in-up animate-fade-in-up-delay-3',
  'animate-fade-in-up animate-fade-in-up-delay-4',
  'animate-fade-in-up animate-fade-in-up-delay-5',
];

export default function SearchResults({ query, results, loading, error, onRetry }) {
  if (loading) return null;

  if (error) {
    return (
      <ErrorState
        message={error}
        suggestion="Make sure the API is running and try your search again."
        retryLabel="Try search again"
        onRetry={onRetry}
      />
    );
  }

  if (results == null) return null;

  if (results.length === 0) {
    return (
      <EmptyState
        title={`No results for "${query}"`}
        description="Try different words or add documents first so there’s something to search."
        actionLabel="Add documents"
        actionTo="/upload"
      />
    );
  }

  return (
    <section
      className="space-y-6 animate-fade-in"
      aria-label="Search results"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Results for &ldquo;{query}&rdquo;
        </h2>
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest tabular-nums">
          {results.length} {results.length === 1 ? 'result' : 'results'} found
        </span>
      </div>

      <ul className="space-y-5" role="list">
        {results.map((doc, index) => (
          <li
            key={doc._id}
            className={STAGGER[index % STAGGER.length]}
            style={{ opacity: 0 }}
          >
            <ResultCard doc={{ ...doc, metadata: { ...doc.metadata, highlightQuery: query } }} rank={index} />
          </li>
        ))}
      </ul>
    </section>
  );
}
