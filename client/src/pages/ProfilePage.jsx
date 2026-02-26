import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { User, Lock, Shield, LogOut, CheckCircle2, AlertCircle, Eye, Sun, Moon } from 'lucide-react';

export default function ProfilePage() {
    const { user, logout, updatePassword } = useAuth();
    const { success, error } = useToast();
    const { theme, setTheme } = useTheme();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            error('New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await updatePassword(currentPassword, newPassword);
            if (res.success) {
                success('Password updated successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                error(res.message || 'Failed to update password');
            }
        } catch (err) {
            error('An error occurred during password update');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">User Profile</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your identity and security settings.</p>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Card */}
                <div className="space-y-6">
                    <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md text-center space-y-4 shadow-sm dark:shadow-none">
                        <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600 text-white text-3xl font-black shadow-2xl shadow-indigo-600/20">
                            {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.username}</h2>
                            <p className="text-slate-500 dark:text-slate-500 text-sm">Individual Member</p>
                        </div>
                        <div className="pt-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</span>
                                <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                                    <Shield className="h-3 w-3" /> Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security & Appearance */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Theme Settings */}
                    <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md space-y-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Eye className="h-5 w-5 text-indigo-500" />
                            Appearance
                        </h3>
                        <p className="text-sm text-slate-500">Choose how the application looks to you.</p>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setTheme('light')}
                                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${theme === 'light'
                                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}
                            >
                                <div className="h-12 w-12 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-amber-500 shadow-sm">
                                    <Sun className="h-6 w-6" />
                                </div>
                                <span className={`text-sm font-bold ${theme === 'light' ? 'text-indigo-600' : 'text-slate-500 dark:text-slate-500'}`}>Light Mode</span>
                            </button>

                            <button
                                onClick={() => setTheme('dark')}
                                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${theme === 'dark'
                                    ? 'bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20'
                                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                            >
                                <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-sm">
                                    <Moon className="h-6 w-6" />
                                </div>
                                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Dark Mode</span>
                            </button>
                        </div>
                    </div>

                    {/* Password Change */}
                    <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md space-y-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Lock className="h-5 w-5 text-indigo-500" />
                            Security Settings
                        </h3>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">CURRENT PASSWORD</label>
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-3 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">NEW PASSWORD</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-3 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 px-1">CONFIRM NEW PASSWORD</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-3 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] mt-4"
                            >
                                {loading ? 'Processing...' : 'Change Password'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
