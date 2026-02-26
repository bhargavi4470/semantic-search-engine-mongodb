import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = (msg, dur) => addToast(msg, 'success', dur);
    const error = (msg, dur) => addToast(msg, 'error', dur);
    const info = (msg, dur) => addToast(msg, 'info', dur);
    const loading = (msg, dur) => addToast(msg, 'loading', dur);

    return (
        <ToastContext.Provider value={{ success, error, info, loading, removeToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ toast, onRemove }) => {
    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
        error: <AlertCircle className="h-5 w-5 text-red-400" />,
        info: <Info className="h-5 w-5 text-indigo-400" />,
        loading: <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />,
    };

    const colors = {
        success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
        error: 'border-red-500/20 bg-red-500/10 text-red-100',
        info: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-100',
        loading: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-100',
    };

    return (
        <div className={`pointer-events-auto min-w-[300px] max-w-md flex items-center justify-between gap-4 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-slide-in-right ${colors[toast.type]}`}>
            <div className="flex items-center gap-3">
                {icons[toast.type]}
                <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={onRemove} className="shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="h-4 w-4 opacity-50" />
            </button>
        </div>
    );
};

export const useToast = () => useContext(ToastContext);
