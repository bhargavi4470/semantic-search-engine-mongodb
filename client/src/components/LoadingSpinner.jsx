export default function LoadingSpinner() {
  return (
    <div
      className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-400 transition-opacity duration-300"
      role="status"
      aria-label="Loading"
    />
  );
}
