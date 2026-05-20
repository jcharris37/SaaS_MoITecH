import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';

import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Appointments from './pages/Appointments';
import AIChat from './pages/AIChat';
import Invoices from './pages/Invoices';
import Admin from './pages/Admin';
import Storefront from './pages/Storefront';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';

import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
          <Routes>

            {/* 🌐 TIENDA PÚBLICA */}
            <Route path="/tienda/:slug" element={<Storefront />} />

            {/* 🔓 PÚBLICAS */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* 🔐 TENANT */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="products" element={<Products />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="chat" element={<AIChat />} />
            </Route>

            {/* 👑 ADMIN */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Admin />} />
            </Route>

            {/* ❌ FALLBACK */}
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </Router>
      </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;