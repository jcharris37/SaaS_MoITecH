import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Activity, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import '../components/Sidebar.css';

const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      <div className="glow-orb orb-1" style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)' }}></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>

      {/* Super Admin Sidebar */}
      <aside className="sidebar d-flex flex-column p-4 glass-panel position-relative z-1" style={{ borderRight: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="sidebar-brand mb-5 d-flex align-items-center gap-2">
          <div className="text-white d-flex justify-content-center align-items-center rounded shadow-lg" style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #ef4444, #9333ea)' }}>
            <Shield size={20} />
          </div>
          <div>
            <h3 className="mb-0 fw-bold" style={{ background: 'linear-gradient(135deg, #ef4444, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Moihub</h3>
            <p className="mb-0 text-muted" style={{ fontSize: '0.7rem' }}>Super Admin</p>
          </div>
        </div>

        <nav className="nav flex-column gap-2 flex-grow-1">
          <NavLink to="/admin" end className={({ isActive }) => `nav-link sidebar-link ${isActive ? 'active' : ''}`}>
            <Activity size={20} /> Centro de Control
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <hr style={{ borderColor: 'rgba(239,68,68,0.3)' }} />
          <button
            onClick={handleLogout}
            className="nav-link sidebar-link w-100 text-start border-0 bg-transparent text-danger d-flex align-items-center gap-2"
            style={{ cursor: 'pointer' }}
          >
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Super Admin Content */}
      <main className="main-content position-relative z-1">
        <header className="header glass-panel d-flex justify-content-between align-items-center p-3 rounded mb-4" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
          <div>
            <h5 className="mb-0 text-white fw-bold">Portal de Super Administrador</h5>
            <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>Control total de la plataforma Moihub.</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="badge px-3 py-2 rounded-pill" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
              <Shield size={14} className="me-1" /> Admin Principal
            </span>
          </div>
        </header>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
