import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Layers, Search, Info, Upload, Database, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload', path: '/indices', icon: Upload },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Info', path: '/info', icon: Info },
  ];

  return (
    <div className="min-h-screen transition-colors duration-300 font-sans antialiased text-slate-900 dark:text-slate-200">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                <Layers className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">MongoSemantic AI</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {user && navItems.filter(item => item.name !== 'Info' || user.role === 'admin').map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/profile"
                className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all overflow-hidden group shadow-lg shadow-indigo-500/10"
              >
                <div className="text-xs font-black uppercase">{user.username.substring(0, 2)}</div>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/auth" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Login</Link>
                <Link to="/auth" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
