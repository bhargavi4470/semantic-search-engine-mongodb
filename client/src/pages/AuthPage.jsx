import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { Layers, User, Lock, ArrowRight, Github, Mail, Chrome } from 'lucide-react';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuth();
    const { success, error: toastError } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setLoading(true);

        try {
            const result = isLogin
                ? await login(username, password)
                : await signup(username, password);

            if (result.success) {
                success(isLogin ? 'Welcome back!' : 'Account created successfully!');
                navigate('/');
            } else {
                setLocalError(result.message);
                toastError(result.message);
            }
        } catch (err) {
            setLocalError('An unexpected error occurred. Please try again.');
            toastError('Connection failed. Please check your network.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md space-y-8 animate-fade-in">
                {/* Logo & Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 mb-4 ring-4 ring-indigo-500/10">
                        <Layers className="h-6 w-6" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {isLogin
                            ? 'Enter your credentials to access your index'
                            : 'Join the next generation of semantic search'}
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl shadow-indigo-500/5 dark:shadow-none">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {localError && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest animate-shake">
                                {localError}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">USERNAME</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">PASSWORD</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Social Auth Separator */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                            <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 dark:text-slate-500 transition-colors">OR CONTINUE WITH</span>
                        </div>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 transition-all text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm hover:shadow-md dark:shadow-none">
                            <Chrome className="h-4 w-4 text-red-500" />
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 transition-all text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white shadow-sm hover:shadow-md dark:shadow-none">
                            <Mail className="h-4 w-4 text-blue-500" />
                            Microsoft
                        </button>
                    </div>
                </div>

                {/* Footer Link */}
                <p className="text-center text-sm font-bold text-slate-500">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-xs ml-2 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
}
