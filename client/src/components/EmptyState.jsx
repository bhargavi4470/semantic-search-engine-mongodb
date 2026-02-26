import { Link } from 'react-router-dom';

/**
 * Reusable empty state — clear message + CTA. Hackathon-judge friendly.
 */
export default function EmptyState({
  title,
  description,
  actionLabel = 'Get started',
  actionTo,
  onAction,
  className = '',
}) {
  const isLink = actionTo && !onAction;

  return (
    <div
      className={`animate-fade-in rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-6 py-12 text-center shadow-sm dark:shadow-none sm:px-10 sm:py-16 ${className}`}
      role="status"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[2rem] bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 shadow-inner">
        <svg
          className="h-7 w-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="mt-6 text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
      {(actionLabel && (actionTo || onAction)) && (
        <div className="mt-6">
          {isLink ? (
            <Link
              to={actionTo}
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 outline-none ring-4 ring-black/5"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 outline-none ring-4 ring-black/5"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
