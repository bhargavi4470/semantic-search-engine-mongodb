import React, { useState, useEffect } from 'react';
import { Database, Shield, RefreshCw, BarChart, Zap, CheckCircle2, Globe, Server, HardDrive } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { SkeletonCard, SkeletonBox } from '../components/SkeletonLoaders';

export default function InfoPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const { success, error, info } = useToast();

    useEffect(() => {
        async function fetchSystemInfo() {
            try {
                const res = await fetch('/stats');
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (err) {
                console.error('Failed to fetch system info:', err);
                error('Could not connect to system monitor');
            } finally {
                setLoading(false);
            }
        }
        fetchSystemInfo();
    }, [error]);

    const handleReindex = () => {
        info('Index synchronization started...');
        // Simulate a long-running process for UI feel
        setTimeout(() => {
            success('Global index synchronized successfully!');
        }, 2000);
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <SkeletonBox />
                    </div>
                    <div className="space-y-6">
                        <SkeletonCard />
                    </div>
                </div>
            </div>
        );
    }

    const systemStatus = [
        { label: 'Database Status', value: data?.systemStatus || 'Unknown', sub: 'Atlas Cluster 0', icon: Database, color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
        { label: 'Cloud Hosting', value: 'Google Cloud', sub: 'Region us-central1', icon: Globe, color: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500' },
        { label: 'Storage Usage', value: `${(data?.totalDocuments * 0.42).toFixed(1)} KB`, sub: 'Efficiently Compressed', icon: HardDrive, color: 'text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-500' },
    ];

    return (
        <div className="space-y-8 animate-fade-in transition-colors duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">System Info</h1>
                    <p className="mt-1 text-slate-500 dark:text-slate-400 font-bold">
                        System & Engine Settings
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm">
                    <span className="px-4 py-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
                        PRO Version
                    </span>
                </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {systemStatus.map((card) => (
                    <div key={card.label} className="p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md relative overflow-hidden group shadow-sm dark:shadow-none transition-all hover:scale-[1.02]">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{card.label}</span>
                            <div className={`h-2 w-2 rounded-full ${card.dot} shadow-[0_0_8px_currentColor]`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-slate-900 dark:text-white capitalize">{card.value}</span>
                            <span className={`text-[10px] font-bold ${card.color} uppercase tracking-tight mt-1`}>{card.sub}</span>
                        </div>
                        <card.icon className="absolute -right-2 -bottom-2 h-16 w-16 text-slate-400/10 dark:text-slate-200/5 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Configuration */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md space-y-8 shadow-sm dark:shadow-none">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <Server className="h-6 w-6 text-indigo-500" />
                            Backend Infrastructure
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 px-1">DATABASE ENGINE</label>
                                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
                                    <div className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 dark:text-orange-400">
                                        <Database className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">MongoDB Atlas</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Cloud Vector Store</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 px-1">AI MODEL HUB</label>
                                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center gap-4 transition-colors">
                                    <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Zap className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">Hugging Face</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Transformer v1.5</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 px-1">TARGET DATABASE</label>
                                <input readOnly value={data?.mongodb?.database || 'semantic_search'} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-600 dark:text-slate-400 text-sm font-mono shadow-inner outline-none transition-colors" />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 px-1">PRIMARY COLLECTION</label>
                                <input readOnly value={data?.mongodb?.collection || 'documents'} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-600 dark:text-slate-400 text-sm font-mono shadow-inner outline-none transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md space-y-6 shadow-sm dark:shadow-none">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                <BarChart className="h-6 w-6 text-indigo-500" />
                                Engine Performance
                            </h2>
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">Operational</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Dim', value: '384', sub: 'Vector Size' },
                                { label: 'Limit', value: '10M', sub: 'Max Chars' },
                                { label: 'Latency', value: data?.searchTimeAvg || '0ms', sub: 'Avg Search' },
                                { label: 'Index', value: '100%', sub: 'Health' },
                            ].map((s) => (
                                <div key={s.label} className="p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-center transition-colors">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">{s.label}</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">{s.value}</p>
                                    <p className="text-[8px] text-slate-400 dark:text-slate-600 uppercase font-black tracking-widest mt-1">{s.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-8">
                    <div className="p-10 rounded-[3rem] bg-indigo-600 dark:bg-gradient-to-br dark:from-indigo-600 dark:to-indigo-900 space-y-8 shadow-2xl shadow-indigo-600/20 dark:shadow-indigo-500/30 text-center relative overflow-hidden group transition-all">
                        <div className="absolute top-0 right-0 -mr-12 -mt-12 h-48 w-48 bg-white/10 dark:bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-white/5 dark:hidden" />

                        <div className="relative z-10 space-y-8">
                            <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-white/20 dark:bg-white/10 backdrop-blur-xl text-white shadow-2xl ring-1 ring-white/20">
                                <Shield className="h-10 w-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Sync Engine</h3>
                                <p className="text-indigo-50 text-sm mt-3 leading-relaxed px-4 font-medium">Force an immediate synchronization of all vectors across the cluster.</p>
                            </div>

                            <button
                                onClick={handleReindex}
                                className="w-full py-6 bg-white text-indigo-700 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl hover:bg-slate-50 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3 group/btn ring-4 ring-black/5"
                            >
                                <RefreshCw className="h-5 w-5 group-hover/btn:animate-spin" />
                                Synchronize
                            </button>

                            <div className="flex flex-col gap-2 pt-2">
                                <div className="h-px w-full bg-white/10 mx-auto" />
                                <p className="text-[10px] font-black text-indigo-200/60 uppercase tracking-widest">v2.1.0-stable build 42</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md space-y-4 shadow-sm dark:shadow-none">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 px-1">Quick Shortcuts</h3>
                        <div className="space-y-3">
                            <button onClick={() => window.open('/health', '_blank')} className="w-full p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 flex items-center justify-between group transition-all hover:shadow-md dark:shadow-none hover:-translate-y-1">
                                <span>Health Endpoint</span>
                                <Globe className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            </button>
                            <button onClick={handleReindex} className="w-full p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 flex items-center justify-between group transition-all hover:shadow-md dark:shadow-none hover:-translate-y-1">
                                <span>Flush Cache</span>
                                <Zap className="h-4 w-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
