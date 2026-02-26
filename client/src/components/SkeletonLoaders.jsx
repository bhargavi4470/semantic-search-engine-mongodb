import React from 'react';

export const SkeletonCard = ({ className = "" }) => (
    <div className={`p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 animate-pulse ${className}`}>
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
        </div>
        <div className="mt-4 h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
    </div>
);

export const SkeletonBox = ({ className = "" }) => (
    <div className={`rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 animate-pulse ${className}`}>
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded-lg mb-8" />
        <div className="space-y-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
                        <div className="space-y-2">
                            <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
                            <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                        </div>
                    </div>
                    <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                </div>
            ))}
        </div>
    </div>
);
