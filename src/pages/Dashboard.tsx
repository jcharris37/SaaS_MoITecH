import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { apiFetch, API_URL } from '../services/api';
import type { User } from '../context/AuthContext';
import {
  TrendingUp, Users, Package, FileText, Calendar, CheckCircle,
  Clock, Store, Upload, Link2, Scissors, Sparkles, Receipt
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

// ─────────────── RETAIL DASHBOARD ───────────────
const RetailDashboard: React.FC<{ stats: Stats; invoices: Invoice[]; loading: boolean; user: User; onRefresh: () => void }> = ({ stats, invoices, loading, user, onRefresh }) => {
  const navigate = useNavigate();
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const { refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const copyLink = () => {
    const url = `${window.location.origin}/tienda/${user.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    } else {
      const el = document.createElement('textarea');
      el.value = url; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    alert('¡Enlace copiado!');
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setLogoUploading(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token') || '';
      const r = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Error subiendo');
      const { url } = await r.json();
      await apiFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo_url: url }) });
      await refreshUser();
      onRefresh();
    } catch {
      alert('Error subiendo el logo');
    } finally {
      setLogoUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveTheme = async (color: string) => {
    setSavingTheme(true);
    try {
      await apiFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme_color: color }) });
      document.documentElement.style.setProperty('--accent-color', color);
      onRefresh();
    } finally {
      setSavingTheme(false);
    }
  };

  const recentInvoices = invoices.slice(0, 5);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="dash-grid">
      <motion.div variants={item} className="dash-header">
        <div>
          <h2 className="dash-title"><Store size={22} /> Panel de tu Tienda</h2>
          <p className="dash-subtitle">Hola, {user.name} — Aquí está el resumen de tu negocio.</p>
        </div>
        <div className="dash-header-actions">
          <button className="btn-dash-outline" onClick={copyLink}><Link2 size={16}/> Compartir Tienda</button>
          <button className="btn-dash-primary" onClick={() => navigate('/invoices')}><Receipt size={16}/> Nueva Factura</button>
        </div>
      </motion.div>

      <motion.div variants={item} className="kpi-grid">
        {[
          { icon: <TrendingUp size={20}/>, label: 'Ingresos Totales', value: loading ? '—' : fmtShort(stats.total_sales), sub: `${stats.paid_invoices} facturas pagadas`, color: '#10b981' },
          { icon: <Users size={20}/>, label: 'Clientes', value: loading ? '—' : stats.active_clients.toString(), sub: 'Registrados en tu base', color: '#6366f1' },
          { icon: <Package size={20}/>, label: 'Productos', value: loading ? '—' : stats.total_products.toString(), sub: 'En catálogo activo', color: '#f59e0b' },
          { icon: <FileText size={20}/>, label: 'Fact. Pendientes', value: loading ? '—' : stats.pending_invoices.toString(), sub: 'Por cobrar', color: '#ef4444' },
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

      <motion.div variants={item} className="dash-card">
        <div className="card-header-row">
          <h5 className="card-title"><FileText size={18}/> Últimas Facturas</h5>
          <button className="btn-link" onClick={() => navigate('/invoices')}>Ver todas →</button>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="empty-state">
            <FileText size={36} opacity={0.3}/>
            <p>Aún no hay facturas. <span className="text-accent" style={{cursor:'pointer'}} onClick={() => navigate('/invoices')}>Crea la primera</span></p>
          </div>
        ) : (
          <div className="invoice-list">
            {recentInvoices.map(inv => (
              <div key={inv.id} className="invoice-row">
                <div className="invoice-num">{inv.invoice_number}</div>
                <div className="invoice-client">{inv.client_name}</div>
                <div className="invoice-total">{fmt(inv.total)}</div>
                <StatusBadge status={inv.status}/>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div variants={item} className="dash-card">
        <h5 className="card-title"><Upload size={18}/> Logo de la Tienda</h5>
        <p className="dash-subtitle mb-2">El logo aparece en tu tienda pública y facturas.</p>
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
        <p className="dash-subtitle mb-3">Elige la paleta de colores de tu tienda.</p>
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
    </motion.div>
  );
};

// ─────────────── APPOINTMENTS DASHBOARD ───────────────
const AppointmentsDashboard: React.FC<{ stats: Stats; appointments: Appointment[]; loading: boolean; user: User; onRefresh: () => void }> = ({ stats, appointments, loading, user, onRefresh }) => {
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const { refreshUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayISO = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === todayISO).sort((a,b) => a.time.localeCompare(b.time));

  const updateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/api/appointments/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      onRefresh();
    } finally { setUpdatingId(null); }
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setLogoUploading(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token') || '';
      const r = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Error');
      const { url } = await r.json();
      await apiFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo_url: url }) });
      await refreshUser();
      onRefresh();
    } catch { alert('Error subiendo logo'); }
    finally { setLogoUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const saveTheme = async (color: string) => {
    setSavingTheme(true);
    try {
      await apiFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme_color: color }) });
      document.documentElement.style.setProperty('--accent-color', color);
      onRefresh();
    } finally { setSavingTheme(false); }
  };

  const userName = user.name ?? '';
  const businessIcon = userName.toLowerCase().includes('barber') || userName.toLowerCase().includes('barberi')
    ? <Scissors size={22}/>
    : <Sparkles size={22}/>;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="dash-grid">
      <motion.div variants={item} className="dash-header">
        <div>
          <h2 className="dash-title">{businessIcon} {userName}</h2>
          <p className="dash-subtitle">{today}</p>
        </div>
        <div className="dash-header-actions">
          <button className="btn-dash-outline" onClick={() => navigate('/appointments')}><Calendar size={16}/> Ver Agenda</button>
          <button className="btn-dash-primary" onClick={() => navigate('/invoices')}><Receipt size={16}/> Cobro Rápido</button>
        </div>
      </motion.div>

      <motion.div variants={item} className="kpi-grid">
        {[
          { icon: <Calendar size={20}/>, label: 'Citas Hoy', value: loading ? '—' : stats.total_appointments_today.toString(), sub: 'Total programadas', color: '#6366f1' },
          { icon: <CheckCircle size={20}/>, label: 'Completadas', value: loading ? '—' : stats.completed_appointments_today.toString(), sub: 'Servicios realizados', color: '#10b981' },
          { icon: <Clock size={20}/>, label: 'Pendientes', value: loading ? '—' : (stats.total_appointments_today - stats.completed_appointments_today).toString(), sub: 'Por atender', color: '#f59e0b' },
          { icon: <TrendingUp size={20}/>, label: 'Ingresos', value: loading ? '—' : fmtShort(stats.total_sales), sub: `${stats.paid_invoices} facturas cobradas`, color: '#ec4899' },
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

      <motion.div variants={item} className="dash-card dash-card-wide">
        <div className="card-header-row">
          <h5 className="card-title"><Calendar size={18}/> Agenda de Hoy</h5>
          <button className="btn-link" onClick={() => navigate('/appointments')}>Ver completa →</button>
        </div>
        {todayAppts.length === 0 ? (
          <div className="empty-state">
            <Calendar size={36} opacity={0.3}/>
            <p>No hay citas programadas para hoy.</p>
          </div>
        ) : (
          <div className="appt-list">
            {todayAppts.map(a => (
              <div key={a.id} className={`appt-row ${a.status === 'Completada' ? 'completed' : ''}`}>
                <div className="appt-time">{a.time}</div>
                <div className="appt-client">
                  <strong>{a.client_name}</strong>
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

      <motion.div variants={item} className="dash-card">
        <h5 className="card-title"><Upload size={18}/> Logo del Negocio</h5>
        <div className="logo-upload-area" onClick={() => fileRef.current?.click()}>
          {user.logo_url
            ? <img src={getImageUrl(user.logo_url)} alt="Logo" className="logo-preview"/>
            : <div className="logo-placeholder"><Upload size={28}/><span>Click para subir</span></div>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} style={{display:'none'}}/>
        {logoUploading && <p className="text-accent small mt-2">Subiendo...</p>}
      </motion.div>

      <motion.div variants={item} className="dash-card">
        <h5 className="card-title"><Sparkles size={18}/> Tema de Color</h5>
        <p className="dash-subtitle mb-3">Personaliza los colores de tu negocio.</p>
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
      </motion.div>
    </motion.div>
  );
};

// ─────────────── MAIN DASHBOARD ───────────────
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
      // Forzamos asincronía para evitar el warning de cascading renders
      await Promise.resolve();
      setLoading(true);
      try {
        const [sr, ir, ar] = await Promise.all([
          apiFetch('/api/stats'),
          apiFetch('/api/invoices'),
          user.business_type === 'appointments' ? apiFetch('/api/appointments') : Promise.resolve(null),
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

  return user.business_type === 'appointments'
    ? <AppointmentsDashboard stats={stats} appointments={appointments} loading={loading} user={user} onRefresh={refresh}/>
    : <RetailDashboard stats={stats} invoices={invoices} loading={loading} user={user} onRefresh={refresh}/>;
};

export default Dashboard;