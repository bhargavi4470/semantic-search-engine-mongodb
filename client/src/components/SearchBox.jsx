import { useState } from 'react';

export default function SearchBox({ onSearch, disabled }) {
  const [input, setInput] = useState('');
  const [explain, setExplain] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(input, explain);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
        <input
          id="search-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. How does vector search work?"
          className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition-all duration-300 focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/10"
          disabled={disabled}
          autoFocus
          aria-label="Search query"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-indigo-600 px-8 py-4 font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:bg-indigo-500 hover:shadow-indigo-500/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
        >
          Search
        </button>
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 px-1 py-1 group">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={explain}
            onChange={(e) => setExplain(e.target.checked)}
            className="h-5 w-5 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
          />
        </div>
        <span className="group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">Include AI agent context for results</span>
      </label>
    </form>
  );
}
