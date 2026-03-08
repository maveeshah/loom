import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DynamicRoute from './pages/DynamicRoute';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';
import ProfileSettings from './pages/ProfileSettings';
import SystemSettings from './pages/SystemSettings';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeConfig } from './components/ThemeConfig';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <ThemeConfig>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute><ProfileSettings /></ProtectedRoute>
            } />

            <Route path="/app/:module" element={
              <ProtectedRoute><DynamicRoute type="List" /></ProtectedRoute>
            } />
            <Route path="/app/:module/new" element={
              <ProtectedRoute><DynamicRoute type="Form" /></ProtectedRoute>
            } />
            <Route path="/app/:module/:id" element={
              <ProtectedRoute><DynamicRoute type="View" /></ProtectedRoute>
            } />
            <Route path="/app/:module/:id/edit" element={
              <ProtectedRoute><DynamicRoute type="Form" /></ProtectedRoute>
            } />

            <Route path="/admin/dashboard" element={
              <ProtectedRoute><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute><UserManagement /></ProtectedRoute>
            } />
            <Route path="/admin/roles" element={
              <ProtectedRoute><RoleManagement /></ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute><SystemSettings /></ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeConfig>
  );
}

export default App;