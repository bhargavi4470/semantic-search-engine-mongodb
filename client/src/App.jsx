import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import UploadPage from './pages/UploadPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import InfoPage from './pages/InfoPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';

function PrivateRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? children : <Navigate to="/auth" />;
}

function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user && user.role === 'admin' ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Layout>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                <Route path="/indices" element={<PrivateRoute><UploadPage /></PrivateRoute>} />
                <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
                <Route path="/info" element={<AdminRoute><InfoPage /></AdminRoute>} />
                <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              </Routes>
            </Layout>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
