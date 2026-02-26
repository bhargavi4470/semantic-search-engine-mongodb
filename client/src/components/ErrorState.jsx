/**
 * Reusable error state — message + suggestion + retry CTA. Hackathon-judge friendly.
 */
export default function ErrorState({
  message,
  suggestion = 'Check your connection and try again.',
  retryLabel = 'Try again',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`animate-fade-in rounded-[2rem] border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-500/5 px-6 py-6 ${className}`}
      role="alert"
    >
      <div className="flex gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 shadow-sm">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-red-900 dark:text-red-200 uppercase tracking-tight">Something went wrong</h3>
          <p className="mt-1 text-sm font-medium text-red-700 dark:text-red-400/90">{message}</p>
          <p className="mt-2 text-xs font-bold text-red-600/90 dark:text-red-500/70">{suggestion}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 px-6 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 text-sm font-black text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-all shadow-sm active:scale-95"
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
