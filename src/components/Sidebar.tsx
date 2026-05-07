import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PackageSearch,
  MessageSquareText,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Initials from name
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'US';

  return (
    <aside className="sidebar d-flex flex-column p-4 glass-panel position-relative z-1" style={{ borderRight: '1px solid var(--border-color)' }}>
      <div className="sidebar-brand mb-5 d-flex align-items-center gap-2">
        <div className="logo-icon text-white d-flex justify-content-center align-items-center rounded shadow-lg" style={{ background: 'linear-gradient(135deg, #ff5e00, #9333ea)' }}>
          <span className="fw-bold fs-5">M</span>
        </div>
        <h3 className="mb-0 fw-bold text-gradient">Moihub</h3>
      </div>

      {/* Info del usuario logueado */}
      {user && (
        <div className="mb-4 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle text-white d-flex justify-content-center align-items-center flex-shrink-0" style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--accent-color), #9333ea)', fontSize: '0.8rem', fontWeight: 700 }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p className="mb-0 fw-bold text-white" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
              <p className="mb-0 text-muted" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="nav flex-column gap-2 flex-grow-1">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/clients" className={({ isActive }) => `nav-link sidebar-link ${isActive ? 'active' : ''}`}>
          <Users size={20} /> Clientes
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `nav-link sidebar-link ${isActive ? 'active' : ''}`}>
          <PackageSearch size={20} /> Productos
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `nav-link sidebar-link ${isActive ? 'active' : ''}`}>
          <MessageSquareText size={20} /> Constructor de Bot
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <hr style={{ borderColor: 'var(--border-color)' }} />
        <button
          onClick={handleLogout}
          className="nav-link sidebar-link w-100 text-start border-0 bg-transparent text-danger d-flex align-items-center gap-2"
          style={{ cursor: 'pointer' }}
        >
          <LogOut size={20} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
