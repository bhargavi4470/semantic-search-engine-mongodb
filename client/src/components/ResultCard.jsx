/**
 * Search result card — demo-optimized.
 * Shows: document title, highlighted matched context, semantic similarity score.
 * Clean card layout for presentation.
 */
import { FileText, Search, Tag, ExternalLink } from 'lucide-react';

export default function ResultCard({ doc, rank }) {
  const title = doc.metadata?.title || 'Untitled';
  const snippet = doc.excerpt ?? (doc.content?.slice(0, 280) + (doc.content?.length > 280 ? '…' : '')) ?? '';
  const score = doc.similarityScore != null ? doc.similarityScore : null;
  const scorePercent = score != null ? Math.round(score * 100) : null;

  return (
    <article
      className="group overflow-hidden rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md transition-all duration-300 ease-out hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/60 shadow-sm dark:shadow-none"
      role="article"
    >
      {/* Card header: rank + title + score */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900/50 px-6 py-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
              Match {rank + 1}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <FileText className="h-3.5 w-3.5" />
              Document
            </span>
          </div>
          <h3 className="text-xl font-black leading-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">
            {title}
          </h3>
        </div>
        {scorePercent != null && (
          <div
            className="flex shrink-0 flex-col items-center rounded-2xl bg-white dark:bg-slate-800/50 px-5 py-3 border border-slate-100 dark:border-slate-700/50 shadow-sm"
            aria-label={`Similarity: ${scorePercent}%`}
          >
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black tabular-nums text-indigo-600 dark:text-indigo-400">
                {scorePercent}
              </span>
              <span className="text-sm font-black text-slate-400 dark:text-slate-500">%</span>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">similarity</span>
          </div>
        )}
      </header>

      {/* Snippet content */}
      <div className="px-6 py-5 space-y-4">
        {snippet && (
          <div className="relative">
            <div className={`absolute -left-6 top-1 bottom-1 w-1 rounded-r shadow-[0_0_15px_rgba(99,102,241,0.2)] ${doc.resultType === 'keyword' ? 'bg-indigo-500' : 'bg-indigo-500/30'
              }`} />
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
              {(() => {
                if (!doc.metadata?.highlightQuery) return snippet;
                // Simple case-insensitive highlight
                const parts = snippet.split(new RegExp(`(${doc.metadata.highlightQuery})`, 'gi'));
                return parts.map((part, i) =>
                  part.toLowerCase() === doc.metadata.highlightQuery.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-slate-900 dark:text-white rounded-sm px-0.5">
                      {part}
                    </mark>
                  ) : (
                    part
                  )
                );
              })()}
            </p>
          </div>
        )}

        {/* Optional: AI explanation */}
        {doc.explanation && (
          <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-500/5 p-4 border border-indigo-100 dark:border-indigo-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400/70">
                AI Reasoning
              </span>
            </div>
            <p className="text-xs italic text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              &ldquo;{doc.explanation}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Source / metadata */}
      {(doc.metadata?.source || doc.metadata?.tags?.length) && (
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/50 px-6 py-4 bg-slate-50/50 dark:bg-transparent">
          <div className="flex items-center gap-4 min-w-0">
            {doc.metadata.source && (
              <span className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 dark:hover:text-slate-300 transition-colors truncate" title={doc.metadata.source}>
                <ExternalLink className="h-3.5 w-3.5" />
                {doc.metadata.source}
              </span>
            )}
          </div>
          {doc.metadata.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {doc.metadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 px-3 py-1 text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400 shadow-sm"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </footer>
      )}
    </article>
  );
}
