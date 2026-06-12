import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import TorkeeDashboard from './pages/TorkeeDashboard';
import TorkaDashboard  from './pages/TorkaDashboard';
import JobDetailPage from './pages/JobDetailPage';
import ProfilePage   from './pages/ProfilePage';
import NewJobPage    from './pages/NewJobPage';
import AdminDashboard from './pages/AdminDashboard';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ role, children }) {
  const { user } = useAuth();
  if (user?.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'torka'
    ? <Navigate to="/torka/dashboard" replace />
    : <Navigate to="/torkee/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"         element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardRedirect /></PrivateRoute>} />

        {/* Torkee routes */}
        <Route path="/torkee/dashboard" element={
          <PrivateRoute><RoleRoute role="torkee"><TorkeeDashboard /></RoleRoute></PrivateRoute>
        } />
        <Route path="/torkee/new-job" element={
          <PrivateRoute><RoleRoute role="torkee"><NewJobPage /></RoleRoute></PrivateRoute>
        } />

        {/* Torka routes */}
        <Route path="/torka/dashboard" element={
          <PrivateRoute><RoleRoute role="torka"><TorkaDashboard /></RoleRoute></PrivateRoute>
        } />

        {/* Shared */}
        <Route path="/jobs/:id"    element={<PrivateRoute><JobDetailPage /></PrivateRoute>} />
        <Route path="/profile/:id" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </AuthProvider>
  );
}