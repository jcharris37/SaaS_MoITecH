import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { apiFetch, API_URL } from '../services/api';
import type { User } from '../context/AuthContext';
import {
  TrendingUp, Users, Package, FileText, Calendar, CheckCircle,
  Clock, Store, Upload, Link2, Scissors, Sparkles, Receipt,
  Activity, UtensilsCrossed, Dumbbell, GraduationCap, Wrench, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

interface Stats {
  total_sales: number;
  active_clients: number;
  total_products: number;
  total_messages: number;
  paid_invoices: number;
  pending_invoices: number;
  total_appointments_today: number;
  completed_appointments_today: number;
}

interface Appointment {
  id: number;
  client_name: string;
  client_phone?: string;
  date: string;
  time: string;
  status: string;
  service_name?: string;
  price?: number;
  provider_id?: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  total: number;
  status: string;
  created_at: string;
}

const THEME_PRESETS = [
  { name: 'Naranja Fuego', color: '#ea580c', gradient: 'linear-gradient(135deg,#ea580c,#f97316)' },
  { name: 'Violeta Pro', color: '#7c3aed', gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
  { name: 'Cyan Neon', color: '#0891b2', gradient: 'linear-gradient(135deg,#0891b2,#06b6d4)' },
  { name: 'Verde Esmeralda', color: '#059669', gradient: 'linear-gradient(135deg,#059669,#10b981)' },
  { name: 'Rosa Premium', color: '#db2777', gradient: 'linear-gradient(135deg,#db2777,#f472b6)' },
  { name: 'Dorado', color: '#d97706', gradient: 'linear-gradient(135deg,#d97706,#fbbf24)' },
];

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
const fmtShort = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n/1_000).toFixed(0)}K` : `$${n.toFixed(0)}`;

const getImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { color: string; label: string }> = {
    Pendiente:   { color: '#f59e0b', label: 'Pendiente' },
    Completada:  { color: '#10b981', label: 'Completada' },
    Cancelada:   { color: '#ef4444', label: 'Cancelada' },
    Pagada:      { color: '#10b981', label: 'Pagada' },
    Anulada:     { color: '#6b7280', label: 'Anulada' },
  };
  const s = map[status] ?? { color: '#6b7280', label: status };
  return (
    <span style={{ background: s.color + '22', color: s.color, border: `1px solid ${s.color}44`,
      borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

// ────────────────────────────────────────────────────────
// COMPONENTES COMPARTIDOS PREMIUM
// ────────────────────────────────────────────────────────

const DashboardHeader: React.FC<{
  title: string;
  icon: React.ReactNode;
  subtitle: string;
  user: User;
  onNewInvoice: () => void;
  onAppointments?: () => void;
}> = ({ title, icon, subtitle, user, onNewInvoice, onAppointments }) => {
  const copyLink = () => {
    const url = `${window.location.origin}/tienda/${user.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    } else {
      const el = document.createElement('textarea');
      el.value = url; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    alert('¡Enlace del portal público copiado!');
  };

  return (
    <motion.div variants={item} className="dash-header">
      <div>
        <h2 className="dash-title">{icon} {title}</h2>
        <p className="dash-subtitle">{subtitle}</p>
      </div>
      <div className="dash-header-actions">
        <button className="btn-dash-outline" onClick={copyLink}><Link2 size={16}/> Compartir Portal</button>
        {onAppointments && (
          <button className="btn-dash-outline" onClick={onAppointments}><Calendar size={16}/> Ver Agenda</button>
        )}
        <button className="btn-dash-primary" onClick={onNewInvoice}><Receipt size={16}/> Nueva Factura</button>
      </div>
    </motion.div>
  );
};

const BrandingSettings: React.FC<{
  user: User;
  onRefresh: () => void;
  logoUploading: boolean;
  setLogoUploading: (u: boolean) => void;
  savingTheme: boolean;
  setSavingTheme: (s: boolean) => void;
}> = ({ user, onRefresh, logoUploading, setLogoUploading, savingTheme, setSavingTheme }) => {
  const { refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setLogoUploading(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token') || '';
      const r = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: fd,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Error subiendo logo');
      const { url } = await r.json();
      await apiFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: url })
      });
      await refreshUser();
      onRefresh();
    } catch {
      alert('Error al subir el logo');
    } finally {
      setLogoUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveTheme = async (color: string) => {
    setSavingTheme(true);
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_color: color })
      });
      document.documentElement.style.setProperty('--accent-color', color);
      onRefresh();
    } finally {
      setSavingTheme(false);
    }
  };

  return (
    <>
      <motion.div variants={item} className="dash-card">
        <h5 className="card-title"><Upload size={18}/> Logo de tu Empresa</h5>
        <p className="dash-subtitle mb-2">El logo aparece en tu portal público y facturas.</p>
        <div className="logo-upload-area" onClick={() => fileRef.current?.click()}>
          {user.logo_url
            ? <img src={getImageUrl(user.logo_url)} alt="Logo" className="logo-preview"/>
            : <div className="logo-placeholder"><Upload size={28}/><span>Click para subir logo</span></div>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} style={{display:'none'}}/>
        {logoUploading && <p className="text-accent small mt-2">Subiendo...</p>}
      </motion.div>

      <motion.div variants={item} className="dash-card">
        <h5 className="card-title"><Sparkles size={18}/> Tema de Color</h5>
        <p className="dash-subtitle mb-3">Elige la paleta de colores de tu portal.</p>
        <div className="theme-presets">
          {THEME_PRESETS.map(p => (
            <button key={p.color} title={p.name}
              className={`theme-dot ${user.theme_color === p.color ? 'active' : ''}`}
              style={{ background: p.gradient }}
              onClick={() => saveTheme(p.color)}
              disabled={savingTheme}
            />
          ))}
        </div>
        {savingTheme && <p className="text-accent small mt-2">Guardando...</p>}
      </motion.div>
    </>
  );
};

const AppointmentsList: React.FC<{
  appointments: Appointment[];
  updatingId: number | null;
  updateStatus: (id: number, status: string) => void;
  title: string;
  emptyText: string;
  clientLabel: string;
}> = ({ appointments, updatingId, updateStatus, title, emptyText, clientLabel }) => {
  const todayISO = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === todayISO).sort((a,b) => a.time.localeCompare(b.time));
  const navigate = useNavigate();

  return (
    <motion.div variants={item} className="dash-card dash-card-wide">
      <div className="card-header-row">
        <h5 className="card-title"><Calendar size={18}/> {title}</h5>
        <button className="btn-link" onClick={() => navigate('/appointments')}>Ver Agenda Completa →</button>
      </div>
      {todayAppts.length === 0 ? (
        <div className="empty-state">
          <Calendar size={36} opacity={0.3}/>
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="appt-list">
          {todayAppts.map(a => (
            <div key={a.id} className={`appt-row ${a.status === 'Completada' ? 'completed' : ''}`}>
              <div className="appt-time">{a.time}</div>
              <div className="appt-client">
                <strong>{a.client_name}</strong>
                <span className="text-muted small d-block">{clientLabel}</span>
                {a.service_name && <span>{a.service_name}</span>}
              </div>
              {a.price ? <div className="appt-price">{fmt(a.price)}</div> : null}
              <StatusBadge status={a.status}/>
              {a.status === 'Pendiente' && (
                <button
                  className="btn-complete"
                  disabled={updatingId === a.id}
                  onClick={() => updateStatus(a.id, 'Completada')}
                >
                  {updatingId === a.id ? '...' : '✓ Completar'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const InvoicesList: React.FC<{
  invoices: Invoice[];
  title: string;
  emptyText: string;
  clientLabel: string;
}> = ({ invoices, title, emptyText, clientLabel }) => {
  const navigate = useNavigate();
  const recentInvoices = invoices.slice(0, 5);

  return (
    <motion.div variants={item} className="dash-card dash-card-wide">
      <div className="card-header-row">
        <h5 className="card-title"><FileText size={18}/> {title}</h5>
        <button className="btn-link" onClick={() => navigate('/invoices')}>Ver Facturación →</button>
      </div>
      {recentInvoices.length === 0 ? (
        <div className="empty-state">
          <FileText size={36} opacity={0.3}/>
          <p>{emptyText} <span className="text-accent" style={{cursor:'pointer'}} onClick={() => navigate('/invoices')}>Crea la primera</span></p>
        </div>
      ) : (
        <div className="invoice-list">
          {recentInvoices.map(inv => (
            <div key={inv.id} className="invoice-row">
              <div className="invoice-num">{inv.invoice_number}</div>
              <div className="invoice-client">
                <strong>{inv.client_name}</strong>
                <span className="text-muted small d-block">{clientLabel}</span>
              </div>
              <div className="invoice-total">{fmt(inv.total)}</div>
              <StatusBadge status={inv.status}/>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ────────────────────────────────────────────────────────
// 1. TIENDA / RETAIL DASHBOARD
// ────────────────────────────────────────────────────────
const RetailDashboard: React.FC<{ stats: Stats; invoices: Invoice[]; loading: boolean; user: User; onRefresh: () => void }> = ({ stats, invoices, loading, user, onRefresh }) => {
  const navigate = useNavigate();
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="dash-grid">
      <DashboardHeader
        title={user.name || "Mi Tienda"}
        icon={<Store size={22} className="text-primary" />}
        subtitle="Panel de Gestión Comercial — Tienda Minorista"
        user={user}
        onNewInvoice={() => navigate('/invoices')}
      />

      <motion.div variants={item} className="kpi-grid">
        {[
          { icon: <TrendingUp size={20}/>, label: 'Ingresos Totales', value: loading ? '—' : fmtShort(stats.total_sales), sub: `${stats.paid_invoices} facturas cobradas`, color: '#10b981' },
          { icon: <Users size={20}/>, label: 'Clientes', value: loading ? '—' : stats.active_clients.toString(), sub: 'Registrados en base de datos', color: '#6366f1' },
          { icon: <Package size={20}/>, label: 'Productos', value: loading ? '—' : stats.total_products.toString(), sub: 'En catálogo activo', color: '#f59e0b' },
          { icon: <FileText size={20}/>, label: 'Facturas Pendientes', value: loading ? '—' : stats.pending_invoices.toString(), sub: 'Cuentas por cobrar', color: '#ef4444' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon" style={{ background: k.color + '22', color: k.color }}>{k.icon}</div>
            <div>
              <p className="kpi-label">{k.label}</p>
              <h3 className="kpi-value">{k.value}</h3>
              <p className="kpi-sub">{k.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <InvoicesList
        invoices={invoices}
        title="Últimas Ventas y Facturas"
        emptyText="Aún no has registrado facturas comerciales."
        clientLabel="Cliente"
      />

      <BrandingSettings
        user={user}
        onRefresh={onRefresh}
        logoUploading={logoUploading}
        setLogoUploading={setLogoUploading}
        savingTheme={savingTheme}
        setSavingTheme={setSavingTheme}
      />
    </motion.div>
  );
};

// ────────────────────────────────────────────────────────
// 2. NEGOCIO CON CITAS / APPOINTMENTS DASHBOARD
// ────────────────────────────────────────────────────────
const AppointmentsDashboard: React.FC<{ stats: Stats; appointments: Appointment[]; loading: boolean; user: User; onRefresh: () => void }> = ({ stats, appointments, loading, user, onRefresh }) => {
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/api/appointments/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      onRefresh();
    } finally { setUpdatingId(null); }
  };

  const businessIcon = user.name?.toLowerCase().includes('barber') || user.name?.toLowerCase().includes('barberi')
    ? <Scissors size={22} className="text-info" />
    : <Sparkles size={22} className="text-info" />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="dash-grid">
      <DashboardHeader
        title={user.name || "Salón de Estética"}
        icon={businessIcon}
        subtitle={`Agenda y Reservas — Hoy: ${today}`}
        user={user}
        onNewInvoice={() => navigate('/invoices')}
        onAppointments={() => navigate('/appointments')}
      />

      <motion.div variants={item} className="kpi-grid">
        {[
          { icon: <Calendar size={20}/>, label: 'Citas Hoy', value: loading ? '—' : stats.total_appointments_today.toString(), sub: 'Reservas totales', color: '#6366f1' },
          { icon: <CheckCircle size={20}/>, label: 'Completadas', value: loading ? '—' : stats.completed_appointments_today.toString(), sub: 'Servicios atendidos', color: '#10b981' },
          { icon: <Clock size={20}/>, label: 'Pendientes', value: loading ? '—' : (stats.total_appointments_today - stats.completed_appointments_today).toString(), sub: 'Clientes en espera', color: '#f59e0b' },
          { icon: <TrendingUp size={20}/>, label: 'Ingresos Citas', value: loading ? '—' : fmtShort(stats.total_sales), sub: `${stats.paid_invoices} cobros recibidos`, color: '#ec4899' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon" style={{ background: k.color + '22', color: k.color }}>{k.icon}</div>
            <div>
              <p className="kpi-label">{k.label}</p>
              <h3 className="kpi-value">{k.value}</h3>
              <p className="kpi-sub">{k.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <AppointmentsList
        appointments={appointments}
        updatingId={updatingId}
        updateStatus={updateStatus}
        title="Agenda y Citas del Día"
        emptyText="No se registran citas de clientes para hoy."
        clientLabel="Cliente del Salón"
      />

      <BrandingSettings
        user={user}
        onRefresh={onRefresh}
        logoUploading={logoUploading}
        setLogoUploading={setLogoUploading}
        savingTheme={savingTheme}
        setSavingTheme={setSavingTheme}
      />
    </motion.div>
  );
};

// ────────────────────────────────────────────────────────
// 3. CONSULTORIO / SALUD / HEALTH DASHBOARD
// ────────────────────────────────────────────────────────
const HealthDashboard: React.FC<{ stats: Stats; appointments: Appointment[]; loading: boolean; user: User; onRefresh: () => void }> = ({ stats, appointments, loading, user, onRefresh }) => {
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/api/appointments/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      onRefresh();
    } finally { setUpdatingId(null); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="dash-grid">
      <DashboardHeader
        title={user.name || "Consultorio Médico"}
        icon={<Activity size={22} className="text-danger" />}
        subtitle={`Panel Clínico / Pacientes — Citas para hoy: ${today}`}
        user={user}
        onNewInvoice={() => navigate('/invoices')}
        onAppointments={() => navigate('/appointments')}
      />

      <motion.div variants={item} className="kpi-grid">
        {[
          { icon: <Calendar size={20}/>, label: 'Consultas Hoy', value: loading ? '—' : stats.total_appointments_today.toString(), sub: 'Pacientes agendados hoy', color: '#6366f1' },
          { icon: <CheckCircle size={20}/>, label: 'Pacientes Atendidos', value: loading ? '—' : stats.completed_appointments_today.toString(), sub: 'Consultas finalizadas', color: '#10b981' },
          { icon: <Clock size={20}/>, label: 'Citas Pendientes', value: loading ? '—' : (stats.total_appointments_today - stats.completed_appointments_today).toString(), sub: 'Pendientes de atención', color: '#f59e0b' },
          { icon: <TrendingUp size={20}/>, label: 'Copagos e Ingresos', value: loading ? '—' : fmtShort(stats.total_sales), sub: `${stats.paid_invoices} facturas emitidas`, color: '#ec4899' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon" style={{ background: k.color + '22', color: k.color }}>{k.icon}</div>
            <div>
              <p className="kpi-label">{k.label}</p>
              <h3 className="kpi-value">{k.value}</h3>
              <p className="kpi-sub">{k.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <AppointmentsList
        appointments={appointments}
        updatingId={updatingId}
        updateStatus={updateStatus}
        title="Agenda Médica y Pacientes de Hoy"
        emptyText="No hay consultas médicas programadas para el día de hoy."
        clientLabel="Paciente"
      />

      <BrandingSettings
        user={user}
        onRefresh={onRefresh}
        logoUploading={logoUploading}
        setLogoUploading={setLogoUploading}
        savingTheme={savingTheme}
        setSavingTheme={setSavingTheme}
      />
    </motion.div>
  );
};

// ────────────────────────────────────────────────────────
// 4. RESTAURANTE / COMIDA / RESTAURANT DASHBOARD
// ────────────────────────────────────────────────────────
const RestaurantDashboard: React.FC<{ stats: Stats; invoices: Invoice[]; loading: boolean; user: User; onRefresh: () => void }> = ({ stats, invoices, loading, user, onRefresh }) => {
  const navigate = useNavigate();
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="dash-grid">
      <DashboardHeader
        title={user.name || "Restaurante"}
        icon={<UtensilsCrossed size={22} className="text-warning" />}
        subtitle="Consola de Mesas, Comandas y Facturación de Caja"
        user={user}
        onNewInvoice={() => navigate('/invoices')}
      />

      <motion.div variants={item} className="kpi-grid">
        {[
          { icon: <TrendingUp size={20}/>, label: 'Ingresos Totales', value: loading ? '—' : fmtShort(stats.total_sales), sub: `${stats.paid_invoices} pedidos facturados`, color: '#10b981' },
          { icon: <Users size={20}/>, label: 'Clientes Registrados', value: loading ? '—' : stats.active_clients.toString(), sub: 'Base de comensales', color: '#6366f1' },
          { icon: <Package size={20}/>, label: 'Platos / Menú', value: loading ? '—' : stats.total_products.toString(), sub: 'Especialidades en el catálogo', color: '#f59e0b' },
          { icon: <FileText size={20}/>, label: 'Cuentas Pendientes', value: loading ? '—' : stats.pending_invoices.toString(), sub: 'Mesas activas por cobrar', color: '#ef4444' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon" style={{ background: k.color + '22', color: k.color }}>{k.icon}</div>
            <div>
              <p className="kpi-label">{k.label}</p>
              <h3 className="kpi-value">{k.value}</h3>
              <p className="kpi-sub">{k.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <InvoicesList
        invoices={invoices}
        title="Comandas y Mesas Recientes"
        emptyText="No hay comandas registradas en caja."
        clientLabel="Mesa / Comensal"
      />

      <BrandingSettings
        user={user}
        onRefresh={onRefresh}
        logoUploading={logoUploading}
        setLogoUploading={setLogoUploading}
        savingTheme={savingTheme}
        setSavingTheme={setSavingTheme}
      />
    </motion.div>
  );
};

// ────────────────────────────────────────────────────────
// 5. GIMNASIO / GYM DASHBOARD
// ────────────────────────────────────────────────────────
const GymDashboard: React.FC<{ stats: Stats; invoices: Invoice[]; loading: boolean; user: User; onRefresh: () => void }> = ({ stats, invoices, loading, user, onRefresh }) => {
  const navigate = useNavigate();
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="dash-grid">
      <DashboardHeader
        title={user.name || "Gimnasio"}
        icon={<Dumbbell size={22} className="text-info" />}
        subtitle="Portal de Socios, Matrículas y Planes de Entrenamiento"
        user={user}
        onNewInvoice={() => navigate('/invoices')}
      />

      <motion.div variants={item} className="kpi-grid">
        {[
          { icon: <Users size={20}/>, label: 'Miembros Activos', value: loading ? '—' : stats.active_clients.toString(), sub: 'Afiliaciones vigentes', color: '#6366f1' },
          { icon: <TrendingUp size={20}/>, label: 'Mensualidades Recaudadas', value: loading ? '—' : fmtShort(stats.total_sales), sub: `${stats.paid_invoices} pagos recibidos`, color: '#10b981' },
          { icon: <Package size={20}/>, label: 'Planes y Clases', value: loading ? '—' : stats.total_products.toString(), sub: 'Suscripciones disponibles', color: '#f59e0b' },
          { icon: <FileText size={20}/>, label: 'Suscripciones por Cobrar', value: loading ? '—' : stats.pending_invoices.toString(), sub: 'Mensualidades pendientes', color: '#ef4444' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon" style={{ background: k.color + '22', color: k.color }}>{k.icon}</div>
            <div>
              <p className="kpi-label">{k.label}</p>
              <h3 className="kpi-value">{k.value}</h3>
              <p className="kpi-sub">{k.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <InvoicesList
        invoices={invoices}
        title="Membresías Facturadas Recientemente"
        emptyText="No se registran mensualidades facturadas."
        clientLabel="Socio / Miembro"
      />

      <BrandingSettings
        user={user}
        onRefresh={onRefresh}
        logoUploading={logoUploading}
        setLogoUploading={setLogoUploading}
        savingTheme={savingTheme}
        setSavingTheme={setSavingTheme}
      />
    </motion.div>
  );
};

// ────────────────────────────────────────────────────────
// 6. ACADEMIA / CURSOS / EDUCATION DASHBOARD
// ────────────────────────────────────────────────────────
const EducationDashboard: React.FC<{ stats: Stats; invoices: Invoice[]; loading: boolean; user: User; onRefresh: () => void }> = ({ stats, invoices, loading, user, onRefresh }) => {
  const navigate = useNavigate();
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="dash-grid">
      <DashboardHeader
        title={user.name || "Academia"}
        icon={<GraduationCap size={22} className="text-success" />}
        subtitle="Administración de Cursos, Matrículas y Alumnos"
        user={user}
        onNewInvoice={() => navigate('/invoices')}
      />

      <motion.div variants={item} className="kpi-grid">
        {[
          { icon: <Users size={20}/>, label: 'Alumnos Matriculados', value: loading ? '—' : stats.active_clients.toString(), sub: 'Inscripciones vigentes', color: '#6366f1' },
          { icon: <TrendingUp size={20}/>, label: 'Recaudado por Cursos', value: loading ? '—' : fmtShort(stats.total_sales), sub: `${stats.paid_invoices} mensualidades cobradas`, color: '#10b981' },
          { icon: <Package size={20}/>, label: 'Programas / Cursos', value: loading ? '—' : stats.total_products.toString(), sub: 'Programas educativos', color: '#f59e0b' },
          { icon: <FileText size={20}/>, label: 'Pensiones Pendientes', value: loading ? '—' : stats.pending_invoices.toString(), sub: 'Cuotas académicas pendientes', color: '#ef4444' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon" style={{ background: k.color + '22', color: k.color }}>{k.icon}</div>
            <div>
              <p className="kpi-label">{k.label}</p>
              <h3 className="kpi-value">{k.value}</h3>
              <p className="kpi-sub">{k.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <InvoicesList
        invoices={invoices}
        title="Historial de Matrículas e Inscripciones"
        emptyText="No se registran matrículas cobradas."
        clientLabel="Estudiante / Alumno"
      />

      <BrandingSettings
        user={user}
        onRefresh={onRefresh}
        logoUploading={logoUploading}
        setLogoUploading={setLogoUploading}
        savingTheme={savingTheme}
        setSavingTheme={setSavingTheme}
      />
    </motion.div>
  );
};

// ────────────────────────────────────────────────────────
// 7. SERVICIOS TÉCNICOS / SERVICES DASHBOARD
// ────────────────────────────────────────────────────────
const ServicesDashboard: React.FC<{ stats: Stats; appointments: Appointment[]; loading: boolean; user: User; onRefresh: () => void }> = ({ stats, appointments, loading, user, onRefresh }) => {
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/api/appointments/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      onRefresh();
    } finally { setUpdatingId(null); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="dash-grid">
      <DashboardHeader
        title={user.name || "Servicios Técnicos"}
        icon={<Wrench size={22} className="text-secondary" />}
        subtitle={`Órdenes de Trabajo y Visitas a Domicilio — Hoy: ${today}`}
        user={user}
        onNewInvoice={() => navigate('/invoices')}
        onAppointments={() => navigate('/appointments')}
      />

      <motion.div variants={item} className="kpi-grid">
        {[
          { icon: <Calendar size={20}/>, label: 'Visitas Técnicas Hoy', value: loading ? '—' : stats.total_appointments_today.toString(), sub: 'Órdenes de trabajo agendadas', color: '#6366f1' },
          { icon: <CheckCircle size={20}/>, label: 'Trabajos Finalizados', value: loading ? '—' : stats.completed_appointments_today.toString(), sub: 'Servicios entregados hoy', color: '#10b981' },
          { icon: <Clock size={20}/>, label: 'Órdenes Pendientes', value: loading ? '—' : (stats.total_appointments_today - stats.completed_appointments_today).toString(), sub: 'Visitas técnicas por realizar', color: '#f59e0b' },
          { icon: <TrendingUp size={20}/>, label: 'Mano de Obra e Ingresos', value: loading ? '—' : fmtShort(stats.total_sales), sub: `${stats.paid_invoices} órdenes cobradas`, color: '#ec4899' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon" style={{ background: k.color + '22', color: k.color }}>{k.icon}</div>
            <div>
              <p className="kpi-label">{k.label}</p>
              <h3 className="kpi-value">{k.value}</h3>
              <p className="kpi-sub">{k.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <AppointmentsList
        appointments={appointments}
        updatingId={updatingId}
        updateStatus={updateStatus}
        title="Agenda de Visitas Técnicas de Hoy"
        emptyText="No hay visitas técnicas a domicilio agendadas para hoy."
        clientLabel="Cliente / Solicitante"
      />

      <BrandingSettings
        user={user}
        onRefresh={onRefresh}
        logoUploading={logoUploading}
        setLogoUploading={setLogoUploading}
        savingTheme={savingTheme}
        setSavingTheme={setSavingTheme}
      />
    </motion.div>
  );
};

// ────────────────────────────────────────────────────────
// 8. OTRO / CUSTOM / OTHER DASHBOARD
// ────────────────────────────────────────────────────────
const OtherDashboard: React.FC<{ stats: Stats; invoices: Invoice[]; loading: boolean; user: User; onRefresh: () => void }> = ({ stats, invoices, loading, user, onRefresh }) => {
  const navigate = useNavigate();
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="dash-grid">
      <DashboardHeader
        title={user.name || "Control de Negocio"}
        icon={<Building2 size={22} className="text-light" />}
        subtitle="Consola Operativa General del Negocio"
        user={user}
        onNewInvoice={() => navigate('/invoices')}
      />

      <motion.div variants={item} className="kpi-grid">
        {[
          { icon: <TrendingUp size={20}/>, label: 'Ingresos Totales', value: loading ? '—' : fmtShort(stats.total_sales), sub: `${stats.paid_invoices} cobros procesados`, color: '#10b981' },
          { icon: <Users size={20}/>, label: 'Contactos / Clientes', value: loading ? '—' : stats.active_clients.toString(), sub: 'Base de datos registrada', color: '#6366f1' },
          { icon: <Package size={20}/>, label: 'Catálogo de Activos', value: loading ? '—' : stats.total_products.toString(), sub: 'Productos y servicios totales', color: '#f59e0b' },
          { icon: <FileText size={20}/>, label: 'Facturas Emitidas', value: loading ? '—' : (stats.paid_invoices + stats.pending_invoices).toString(), sub: 'Cuentas emitidas totales', color: '#ef4444' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-icon" style={{ background: k.color + '22', color: k.color }}>{k.icon}</div>
            <div>
              <p className="kpi-label">{k.label}</p>
              <h3 className="kpi-value">{k.value}</h3>
              <p className="kpi-sub">{k.sub}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <InvoicesList
        invoices={invoices}
        title="Historial Operativo Reciente"
        emptyText="No se ha registrado actividad de facturación recientemente."
        clientLabel="Cliente / Cuenta"
      />

      <BrandingSettings
        user={user}
        onRefresh={onRefresh}
        logoUploading={logoUploading}
        setLogoUploading={setLogoUploading}
        savingTheme={savingTheme}
        setSavingTheme={setSavingTheme}
      />
    </motion.div>
  );
};

// ────────────────────────────────────────────────────────
// MAIN DASHBOARD ROUTER COMPONENT
// ────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ total_sales:0, active_clients:0, total_products:0, total_messages:0, paid_invoices:0, pending_invoices:0, total_appointments_today:0, completed_appointments_today:0 });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Evitamos cascading rendering warning con asincronía
      await Promise.resolve();
      setLoading(true);
      try {
        const [sr, ir, ar] = await Promise.all([
          apiFetch('/api/stats'),
          apiFetch('/api/invoices'),
          ['appointments', 'health', 'services'].includes(user.business_type || '') ? apiFetch('/api/appointments') : Promise.resolve(null),
        ]);
        if (sr.ok) setStats(await sr.json());
        if (ir.ok) setInvoices(await ir.json());
        if (ar?.ok) setAppointments(await ar.json());
      } finally { setLoading(false); }
    };
    load();
  }, [user, tick]);

  const refresh = () => {
    setTick(t => t + 1);
  };

  if (!user) return <div className="text-white p-4">Cargando...</div>;

  const bt = user.business_type || 'retail';

  switch (bt) {
    case 'retail':
      return <RetailDashboard stats={stats} invoices={invoices} loading={loading} user={user} onRefresh={refresh}/>;
    case 'appointments':
      return <AppointmentsDashboard stats={stats} appointments={appointments} loading={loading} user={user} onRefresh={refresh}/>;
    case 'health':
      return <HealthDashboard stats={stats} appointments={appointments} loading={loading} user={user} onRefresh={refresh}/>;
    case 'restaurant':
      return <RestaurantDashboard stats={stats} invoices={invoices} loading={loading} user={user} onRefresh={refresh}/>;
    case 'gym':
      return <GymDashboard stats={stats} invoices={invoices} loading={loading} user={user} onRefresh={refresh}/>;
    case 'education':
      return <EducationDashboard stats={stats} invoices={invoices} loading={loading} user={user} onRefresh={refresh}/>;
    case 'services':
      return <ServicesDashboard stats={stats} appointments={appointments} loading={loading} user={user} onRefresh={refresh}/>;
    default:
      return <OtherDashboard stats={stats} invoices={invoices} loading={loading} user={user} onRefresh={refresh}/>;
  }
};

export default Dashboard;