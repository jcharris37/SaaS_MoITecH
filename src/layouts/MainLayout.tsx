import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Palette, LogOut, Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/useTheme';
import { useAuth } from '../context/useAuth';

const MainLayout: React.FC = () => {
  const { setAccentColor } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'US';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-container">
      {/* Background Glowing Orbs */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {sidebarOpen && (
        <div className="sidebar-backdrop d-lg-none" onClick={() => setSidebarOpen(false)}></div>
      )}

      <main className="main-content position-relative z-1">
        <header className="header glass-panel d-flex justify-content-between align-items-center p-3 rounded mb-4" style={{ border: '1px solid var(--border-color)' }}>
          <div className="d-flex align-items-center">
            <button
              className="btn btn-sm d-lg-none me-3 p-2 d-flex align-items-center"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
              title="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <div>
              <h5 className="text-white mb-0 fw-bold">{user?.name || 'Panel de Control'}</h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>Bienvenido de vuelta, gestiona tu negocio.</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            {/* Selector de Tema */}
            <div className="dropdown">
              <button
                className="btn btn-sm rounded-circle p-2 d-flex align-items-center"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}
              >
                <Palette size={18} color="var(--text-main)" />
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-lg glass-panel border-0 mt-2">
                <li><button className="dropdown-item text-white d-flex align-items-center gap-2" onClick={() => setAccentColor('#ff5e00')}><div className="rounded-circle" style={{ width: 15, height: 15, background: 'linear-gradient(135deg, #ff5e00, #ff9100)' }}></div> Naranja Volcán</button></li>
                <li><button className="dropdown-item text-white d-flex align-items-center gap-2" onClick={() => setAccentColor('#8b5cf6')}><div className="rounded-circle" style={{ width: 15, height: 15, background: 'linear-gradient(135deg, #8b5cf6, #c084fc)' }}></div> Púrpura SaaS</button></li>
                <li><button className="dropdown-item text-white d-flex align-items-center gap-2" onClick={() => setAccentColor('#3b82f6')}><div className="rounded-circle" style={{ width: 15, height: 15, background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}></div> Azul Eléctrico</button></li>
              </ul>
            </div>

            {/* Avatar + Logout */}
            <div className="border-start ms-2 ps-3 d-flex align-items-center gap-2" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-muted d-none d-md-block fs-6">{user?.slug ? `/${user.slug}` : 'Plan Pro'}</span>
              <div
                className="rounded-circle text-white d-flex justify-content-center align-items-center shadow-lg"
                style={{ width: 35, height: 35, background: 'linear-gradient(135deg, var(--accent-color), #9333ea)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                title={user?.name}
              >
                {initials}
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-sm border-0 p-1"
                style={{ background: 'transparent', color: '#ef4444' }}
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
