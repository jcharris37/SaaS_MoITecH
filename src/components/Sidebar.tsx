import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  PackageSearch, 
  MessageSquareText, 
  Settings 
} from 'lucide-react';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar d-flex flex-column p-4 glass-panel position-relative z-1" style={{borderRight: '1px solid var(--border-color)'}}>
      <div className="sidebar-brand mb-5 d-flex align-items-center gap-2">
        <div className="logo-icon text-white d-flex justify-content-center align-items-center rounded shadow-lg" style={{background: 'linear-gradient(135deg, #ff5e00, #9333ea)'}}>
          <span className="fw-bold fs-5">M</span>
        </div>
        <h3 className="mb-0 fw-bold text-gradient">Moihub</h3>
      </div>
      
      <nav className="nav flex-column gap-2 flex-grow-1">
        <NavLink to="/dashboard" className={({isActive}) => `nav-link sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/clients" className={({isActive}) => `nav-link sidebar-link ${isActive ? 'active' : ''}`}>
          <Users size={20} /> Clientes
        </NavLink>
        <NavLink to="/products" className={({isActive}) => `nav-link sidebar-link ${isActive ? 'active' : ''}`}>
          <PackageSearch size={20} /> Productos
        </NavLink>
        <NavLink to="/chat" className={({isActive}) => `nav-link sidebar-link ${isActive ? 'active' : ''}`}>
          <MessageSquareText size={20} /> IA Chat WhatsApp
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <hr />
        <div className="nav-link sidebar-link text-muted">
          <Settings size={20} /> Configuración
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
