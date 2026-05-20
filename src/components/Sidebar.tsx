import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PackageSearch,
  MessageSquareText,
  LogOut,
  CalendarDays,
  Receipt,
  X
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import './Sidebar.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Initials from name
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'US';

  return (
    <aside className={`sidebar d-flex flex-column p-4 glass-panel ${isOpen ? 'open' : ''}`} style={{ borderRight: '1px solid var(--border-color)' }}>
      <div className="sidebar-brand mb-5 d-flex align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          <div className="logo-icon text-white d-flex justify-content-center align-items-center rounded shadow-lg" style={{ background: 'linear-gradient(135deg, #ff5e00, #9333ea)' }}>
            <span className="fw-bold fs-5">M</span>
          </div>
          <h3 className="mb-0 fw-bold text-gradient">Moihub</h3>
        </div>
        <button
          className="btn btn-sm border-0 d-lg-none text-muted p-1"
          onClick={onClose}
          style={{ background: 'transparent' }}
          title="Cerrar menú"
        >
          <X size={20} />
        </button>
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
        {(() => {
          const bt = user?.business_type || 'retail';

          // 1. Dashboard
          let dashLabel = 'Dashboard';
          if (bt === 'retail') dashLabel = 'Dashboard Tienda';
          else if (bt === 'appointments') dashLabel = 'Dashboard Citas';
          else if (bt === 'health') dashLabel = 'Dashboard Consultorio';
          else if (bt === 'restaurant') dashLabel = 'Dashboard Restaurante';
          else if (bt === 'gym') dashLabel = 'Dashboard Gimnasio';
          else if (bt === 'education') dashLabel = 'Dashboard Academia';
          else if (bt === 'services') dashLabel = 'Dashboard de Servicios';
          else if (bt === 'other') dashLabel = 'Dashboard Control';

          // 2. Clients
          let clientsLabel = 'Clientes';
          if (bt === 'health') clientsLabel = 'Pacientes';
          else if (bt === 'gym') clientsLabel = 'Miembros / Socios';
          else if (bt === 'education') clientsLabel = 'Estudiantes / Alumnos';

          // 3. Products / Catalog
          let catalogLabel = 'Productos';
          let catalogTo = '/products';
          let CatalogIcon = PackageSearch;

          if (['appointments', 'health', 'services'].includes(bt)) {
            catalogTo = '/appointments';
            CatalogIcon = CalendarDays;
            if (bt === 'appointments') catalogLabel = 'Personal y Citas';
            else if (bt === 'health') catalogLabel = 'Médicos y Agenda';
            else if (bt === 'services') catalogLabel = 'Trabajos y Citas';
          } else {
            if (bt === 'restaurant') catalogLabel = 'Menú y Platos';
            else if (bt === 'gym') catalogLabel = 'Planes y Clases';
            else if (bt === 'education') catalogLabel = 'Cursos y Clases';
          }

          // 4. Invoices / Billing
          let invoiceLabel = 'Facturación';
          if (bt === 'retail' || bt === 'other') invoiceLabel = 'Facturas y Ventas';
          else if (bt === 'health') invoiceLabel = 'Consultas y Facturas';
          else if (bt === 'restaurant') invoiceLabel = 'Pedidos y Cuentas';
          else if (bt === 'gym') invoiceLabel = 'Membresías y Ventas';
          else if (bt === 'education') invoiceLabel = 'Matrículas y Pagos';
          else if (bt === 'services') invoiceLabel = 'Cotizaciones y Órdenes';

          // 5. Bot Builder
          let botLabel = 'Constructor de Bot';
          if (bt === 'appointments') botLabel = 'Bot de Citas';
          else if (bt === 'health') botLabel = 'Asistente Médico (Bot)';
          else if (bt === 'restaurant') botLabel = 'Tomador de Pedidos (Bot)';
          else if (bt === 'gym') botLabel = 'Asistente de Gimnasio (Bot)';
          else if (bt === 'education') botLabel = 'Inscripciones (Bot)';
          else if (bt === 'services') botLabel = 'Agendador de Trabajos (Bot)';
          else if (bt === 'retail' || bt === 'other') botLabel = 'Bot de Tienda';

          const links = [
            { to: '/dashboard', label: dashLabel, icon: LayoutDashboard },
            { to: '/clients', label: clientsLabel, icon: Users },
            { to: catalogTo, label: catalogLabel, icon: CatalogIcon },
            { to: '/invoices', label: invoiceLabel, icon: Receipt },
            { to: '/chat', label: botLabel, icon: MessageSquareText },
          ];

          return links.map(link => {
            const LinkIcon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} onClick={onClose} className={({ isActive }) => `nav-link sidebar-link ${isActive ? 'active' : ''}`}>
                <LinkIcon size={20} /> {link.label}
              </NavLink>
            );
          });
        })()}
      </nav>

      <div className="sidebar-footer">
        <hr style={{ borderColor: 'var(--border-color)' }} />
        <button
          onClick={() => { onClose?.(); handleLogout(); }}
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
