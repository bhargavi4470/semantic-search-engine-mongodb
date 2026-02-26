import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
                    <div className="max-w-md space-y-6 animate-fade-in">
                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-xl shadow-red-500/10 mb-4">
                            <AlertTriangle className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-white tracking-tight">Something went wrong</h1>
                            <p className="text-slate-400 leading-relaxed">
                                The application encountered an unexpected error. Don't worry, your data is safe.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reload Application
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <Home className="h-4 w-4" />
                                Return to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
