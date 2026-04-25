import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Products from './pages/Products';
import AIChat from './pages/AIChat';
import Admin from './pages/Admin';
import Storefront from './pages/Storefront';
import Register from './pages/Register';

const ProtectedRoute = ({ children, requireAdmin }: { children: JSX.Element, requireAdmin?: boolean }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100 bg-dark"><div className="spinner-border text-primary"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'superadmin') return <Navigate to="/dashboard" replace />;
  if (!requireAdmin && user.role === 'superadmin') return <Navigate to="/admin" replace />;
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          
      
          <Route path="/tienda/:slug" element={<Storefront />} />

      
          
        
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
  
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="products" element={<Products />} />
            <Route path="chat" element={<AIChat />} />
          </Route>


          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Admin />} />
          </Route>

        </Routes>
      </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
