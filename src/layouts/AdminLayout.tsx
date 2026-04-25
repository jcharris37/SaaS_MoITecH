import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Activity, Users, Settings, Database, Server } from 'lucide-react';
import '../components/Sidebar.css'; 

const AdminLayout: React.FC = () => {
  return (
    <div className="app-container">
      {/* Background Glowing Orbs */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>

      {/* Super Admin Sidebar */}
      <aside className="sidebar d-flex flex-column p-4 glass-panel position-relative z-1" style={{borderRight: '1px solid var(--border-color)'}}>
        <div className="sidebar-brand mb-5 d-flex align-items-center gap-2">
          <div className="bg-danger text-white d-flex justify-content-center align-items-center rounded shadow-lg" style={{width: 40, height: 40, background: 'linear-gradient(135deg, #ef4444, #b91c1c)'}}>
            <span className="fw-bold fs-5">S</span>
          </div>
          <h3 className="mb-0 fw-bold text-gradient">Moihub Admin</h3>
        </div>
        
        <nav className="nav flex-column gap-2 flex-grow-1">
          <NavLink to="/admin" end className={({isActive}) => `nav-link sidebar-link text-white-50 ${isActive ? 'bg-danger text-white' : ''}`}>
             <Activity size={20} /> Visión General
          </NavLink>
          <NavLink to="/admin/tenants" className={({isActive}) => `nav-link sidebar-link text-white-50 ${isActive ? 'bg-danger text-white' : ''}`}>
             <Users size={20} /> Inquilinos / Negocios
          </NavLink>
          <NavLink to="/admin/billing" className={({isActive}) => `nav-link sidebar-link text-white-50 ${isActive ? 'bg-danger text-white' : ''}`}>
             <Database size={20} /> Facturación SaaS
          </NavLink>
           <NavLink to="/admin/system" className={({isActive}) => `nav-link sidebar-link text-white-50 ${isActive ? 'bg-danger text-white' : ''}`}>
             <Server size={20} /> Estado del Sistema
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <hr className="border-secondary" />
          <Link to="/" className="nav-link sidebar-link text-white-50">
            <Settings size={20} /> Volver al App Cliente
          </Link>
        </div>
      </aside>

      {/* Super Admin Content */}
      <main className="main-content" style={{backgroundColor: '#f8fafc', minHeight: '100vh'}}>
        <header className="header d-flex justify-content-between align-items-center bg-white p-3 rounded shadow-sm mb-4">
          <div>
             <h5 className="mb-0 text-dark fw-bold">Portal del Dueño (Super Administrador)</h5>
          </div>
          <div className="d-flex align-items-center gap-3">
             <span className="text-secondary fw-medium">Admin Principal</span>
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
