import React, { useState, useEffect } from 'react';
import { Shield, Activity, DollarSign, Server, ExternalLink, Trash2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../services/api';

interface Tenant {
  id: number;
  name: string;
  owner_email: string;
  slug: string;
  advisor_phone: string;
}

const Admin: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/tenants`);
      const data = await res.json();
      setTenants(data);
    } catch {
      console.error('Error cargando tenants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTenants();
  }, []);

  const deleteTenant = async (id: number) => {
    if (!window.confirm('¿Eliminar este negocio permanentemente?')) return;
    try {
      await apiFetch(`/api/tenants/${id}`, {
        method: 'DELETE'
      });
      fetchTenants();
    } catch {
      console.error('Error eliminando tenant');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-5">
        <h2 className="dashboard-title" style={{ background: 'linear-gradient(135deg, #ef4444, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Centro de Control SaaS
        </h2>
        <p className="text-muted">Gestión global de todos los negocios suscritos a Moihub.</p>
      </div>

      {/* Métricas Reales */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card p-4 border-0 shadow-lg glass-panel h-100">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <p className="text-muted mb-1 fw-medium">Negocios Registrados</p>
                <h3 className="fw-bold text-white mb-0">{loading ? '...' : tenants.length}</h3>
              </div>
              <div className="p-2 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <Activity size={20} color="#3b82f6" />
              </div>
            </div>
            <p className="text-success mb-0 small fw-medium">En tiempo real desde la BD</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-4 border-0 shadow-lg glass-panel h-100">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <p className="text-muted mb-1 fw-medium">MRR Estimado</p>
                <h3 className="fw-bold text-white mb-0">${(tenants.length * 15).toFixed(0)}/mes</h3>
              </div>
              <div className="p-2 rounded" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                <DollarSign size={20} color="#22c55e" />
              </div>
            </div>
            <p className="text-muted small">Calculado a $15/tenant</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-4 border-0 shadow-lg glass-panel h-100">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <p className="text-muted mb-1 fw-medium">Estado del Sistema</p>
                <h3 className="fw-bold text-success mb-0">● Online</h3>
              </div>
              <div className="p-2 rounded" style={{ background: 'rgba(255, 94, 0, 0.1)' }}>
                <Server size={20} color="#ff5e00" />
              </div>
            </div>
            <p className="text-muted small">FastAPI + SQLite activos</p>
          </div>
        </div>
      </div>

      {/* Tabla Real de Tenants */}
      <div className="card border-0 shadow-lg glass-panel overflow-hidden">
        <div className="p-4 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2 text-white">
            <Shield size={20} color="#ef4444" /> Negocios Activos
          </h5>
          <button
            onClick={fetchTenants}
            className="btn btn-sm d-flex align-items-center gap-2 text-white"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table border-0 mb-0" style={{ color: 'var(--text-main)', backgroundColor: 'transparent' }}>
              <thead>
                <tr style={{ borderColor: 'var(--border-color)' }}>
                  <th className="text-muted fw-normal bg-transparent border-bottom px-4">ID</th>
                  <th className="text-muted fw-normal bg-transparent border-bottom">Nombre del Negocio</th>
                  <th className="text-muted fw-normal bg-transparent border-bottom">Email del Dueño</th>
                  <th className="text-muted fw-normal bg-transparent border-bottom">Slug / Link</th>
                  <th className="text-muted fw-normal bg-transparent border-bottom">WhatsApp</th>
                  <th className="text-muted fw-normal bg-transparent border-bottom text-end px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} style={{ borderColor: 'var(--border-color)' }}>
                    <td className="bg-transparent border-bottom px-4 text-muted">#{String(t.id).padStart(3, '0')}</td>
                    <td className="fw-bold bg-transparent border-bottom text-white">{t.name}</td>
                    <td className="bg-transparent border-bottom text-muted">{t.owner_email}</td>
                    <td className="bg-transparent border-bottom">
                      <span className="badge rounded-pill px-3 py-2" style={{ background: 'rgba(255,94,0,0.15)', color: '#ff5e00' }}>
                        /tienda/{t.slug}
                      </span>
                    </td>
                    <td className="bg-transparent border-bottom text-muted">{t.advisor_phone || '—'}</td>
                    <td className="bg-transparent border-bottom text-end px-4">
                      <a
                        href={`/tienda/${t.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm me-2"
                        style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'none' }}
                        title="Ver tienda"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        onClick={() => deleteTenant(t.id)}
                        className="btn btn-sm"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none' }}
                        title="Eliminar negocio"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-5 bg-transparent text-muted">
                      No hay negocios registrados aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Admin;
