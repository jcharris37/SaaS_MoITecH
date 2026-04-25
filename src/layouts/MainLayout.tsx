import React from 'react';
import { Outlet } from 'react-router-dom';
import { Palette } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';

const MainLayout: React.FC = () => {
  const { setAccentColor } = useTheme();

  return (
    <div className="app-container">
      {/* Background Glowing Orbs */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>

      <Sidebar />
      <main className="main-content position-relative z-1">
        <header className="header glass-panel d-flex justify-content-between align-items-center p-3 rounded mb-4" style={{border: '1px solid var(--border-color)'}}>
          <div>
            <h5 className="text-muted mb-0 fw-bold">Entorno de Trabajo</h5>
          </div>
          <div className="d-flex align-items-center gap-3">
            {/* Tema Neon */}
            <div className="dropdown">
              <button className="btn btn-dark btn-sm rounded-circle p-2 d-flex align-items-center" data-bs-toggle="dropdown" aria-expanded="false" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)'}}>
                <Palette size={18} color="var(--text-main)" />
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-lg glass-panel border-0 mt-2">
                <li><button className="dropdown-item text-white d-flex align-items-center gap-2" onClick={() => setAccentColor('#ff5e00')}><div className="rounded-circle" style={{width: 15, height: 15, background: 'linear-gradient(135deg, #ff5e00, #ff9100)'}}></div> Naranja Volcán</button></li>
                <li><button className="dropdown-item text-white d-flex align-items-center gap-2" onClick={() => setAccentColor('#8b5cf6')}><div className="rounded-circle" style={{width: 15, height: 15, background: 'linear-gradient(135deg, #8b5cf6, #c084fc)'}}></div> Púrpura SaaS</button></li>
                <li><button className="dropdown-item text-white d-flex align-items-center gap-2" onClick={() => setAccentColor('#3b82f6')}><div className="rounded-circle" style={{width: 15, height: 15, background: 'linear-gradient(135deg, #3b82f6, #60a5fa)'}}></div> Azul Eléctrico</button></li>
              </ul>
            </div>
            
            <div className="border-start ms-2 ps-3 d-flex align-items-center gap-2" style={{borderColor: 'var(--border-color) !important'}}>
              <span className="text-muted d-none d-md-block fs-6">Plan Pro</span>
              <div className="rounded-circle text-white d-flex justify-content-center align-items-center shadow-lg" style={{width: 35, height: 35, background: 'linear-gradient(135deg, var(--accent-color), #ffffff50)'}}>
                <strong>US</strong>
              </div>
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
