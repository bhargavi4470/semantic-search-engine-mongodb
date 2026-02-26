import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Clock, Database, FileText, RefreshCw } from 'lucide-react';
import { SkeletonCard, SkeletonBox } from '../components/SkeletonLoaders';

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchStats = useCallback(async (manual = false) => {
        if (manual) setIsRefreshing(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
            if (manual) setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        // Auto-refresh every 5 seconds
        const interval = setInterval(() => fetchStats(), 5000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const stats = [
        {
            name: 'Total Documents',
            value: data?.totalDocuments?.toLocaleString() || '0',
            change: '+12.5%',
            icon: FileText,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        },
        {
            name: 'Indexed Vectors',
            value: data?.indexedVectors?.toLocaleString() || '0',
            change: 'Synced',
            icon: Database,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            progress: 94,
        },
        {
            name: 'Search Time',
            value: data?.searchTimeAvg || '0ms',
            change: 'Live',
            icon: Clock,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
        },
        {
            name: 'System Status',
            value: data?.systemStatus?.toUpperCase() || 'OFFLINE',
            change: 'Healthy',
            icon: BarChart3,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
        },
    ];

    if (loading) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="space-y-2">
                    <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse" />
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SkeletonBox className="lg:col-span-2" />
                    <SkeletonBox />
                </div>

                <SkeletonBox />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Semantic Engine Dashboard</h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
                        Monitor your vector distribution and semantic search performance.
                    </p>
                </div>
                <button
                    onClick={() => fetchStats(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900/40 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-bold text-xs uppercase tracking-wider shadow-sm backdrop-blur-md"
                    disabled={isRefreshing}
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
                    {isRefreshing ? 'Updating...' : 'Refresh Data'}
                </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 backdrop-blur-md shadow-sm dark:shadow-none transition-all hover:scale-[1.02]"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${stat.bg} shadow-inner`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.name}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">{stat.value}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${stat.change.includes('+') || stat.change === 'Synced' || stat.change === 'Healthy' ? 'text-emerald-600 dark:text-emerald-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                {stat.change}
                            </span>
                            {stat.progress && (
                                <div className="h-1.5 w-24 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                                        style={{ width: `${stat.progress}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 rounded-[40px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 shadow-sm dark:shadow-none backdrop-blur-md">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <Clock className="h-6 w-6 text-indigo-500" />
                            Recent Searches
                        </h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Activity</span>
                    </div>
                    <div className="space-y-3">
                        {data?.recentSearches?.length > 0 ? (
                            data.recentSearches.map((s, idx) => (
                                <div key={idx} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500 group-hover:animate-pulse" />
                                        <span className="text-slate-700 dark:text-slate-300 font-bold">"{s.query}"</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                                        {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-8 text-center">
                                <p className="text-slate-400 text-sm font-medium italic">No recent searches yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-[40px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 shadow-sm dark:shadow-none backdrop-blur-md">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                        <BarChart3 className="h-6 w-6 text-indigo-500" />
                        File Types
                    </h2>
                    <div className="space-y-4">
                        {data?.fileDistribution?.length > 0 ? (
                            data.fileDistribution.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${item.type === 'pdf' ? 'bg-red-500/10 text-red-500' :
                                            item.type === 'json' ? 'bg-yellow-500/10 text-yellow-500' :
                                                item.type === 'text' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            <Database className="h-4 w-4" />
                                        </div>
                                        <span className="text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest">{item.type}</span>
                                    </div>
                                    <span className="text-slate-900 dark:text-white font-black tabular-nums">{item.count}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 text-sm italic text-center py-4">Waiting for data...</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-[40px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 shadow-sm dark:shadow-none backdrop-blur-md">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                    <FileText className="h-6 w-6 text-indigo-500" />
                    Latest Knowledge
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data?.recentFiles?.length > 0 ? (
                        data.recentFiles.map((file, idx) => (
                            <div key={idx} className="group p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-indigo-500" />
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 text-sm font-bold truncate">{file.title}</span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${file.fileType === 'pdf' ? 'bg-red-500/10 text-red-500' :
                                    file.fileType === 'json' ? 'bg-yellow-500/10 text-yellow-500' :
                                        file.fileType === 'text' ? 'bg-emerald-500/10 text-emerald-500' :
                                            'bg-blue-500/10 text-blue-500'
                                    }`}>
                                    {file.fileType}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-950/50 rounded-3xl">
                            <p className="text-slate-400 text-sm font-medium italic">Your indexed knowledge will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
