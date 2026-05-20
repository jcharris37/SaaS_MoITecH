import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ClientData {
  id?: number;
  name: string;
  phone: string;
  total_orders: number;
  status: string;
}

const Clients: React.FC = () => {

  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', total_orders: '0', status: 'Activo' });
  const { showToast } = useToast();

  const fetchClients = async () => {
    try {
      const response = await apiFetch(`/api/clients`);
      const data = await response.json();
      setClients(data);
    } catch (err: any) {
      showToast(err.message || "Error al cargar clientes", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    try {
      await apiFetch(`/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          total_orders: parseInt(formData.total_orders) || 0,
          status: formData.status
        })
      });

      setFormData({ name: '', phone: '', total_orders: '0', status: 'Activo' });
      setShowForm(false);
      showToast('Cliente registrado con éxito', 'success');
      fetchClients();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar cliente', 'error');
    }
  };

  const deleteClient = async (id: number) => {
    try {
      await apiFetch(`/api/clients/${id}`, { method: 'DELETE' });
      showToast('Cliente eliminado', 'success');
      fetchClients();
    } catch (err: any) {
      showToast(err.message || "Error al eliminar cliente", "error");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title text-gradient">Base de Clientes</h2>
          <p className="text-muted">Gestiona el CRM inteligente de clientes recurrentes.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`btn ${showForm ? 'btn-danger' : 'text-white'} d-flex align-items-center gap-2 shadow`}
          style={!showForm ? {background: 'linear-gradient(135deg, var(--accent-color), #3b82f6)', border: 'none'} : {}}
        >
          {showForm ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Nuevo Cliente</>}
        </button>
      </div>

      {showForm && (
        <div className="card p-4 mb-4 border-0 shadow-lg glass-panel">
          <h5 className="mb-3 fw-bold text-white">Registrar Cliente</h5>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-3">
              <label className="text-muted">Nombre</label>
              <input type="text" className="form-control bg-transparent text-white border-secondary" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="col-md-3">
              <label className="text-muted">Teléfono / WhatsApp</label>
              <input type="text" className="form-control bg-transparent text-white border-secondary" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
            </div>
            <div className="col-md-3">
              <label className="text-muted">Total Pedidos</label>
              <input type="number" className="form-control bg-transparent text-white border-secondary" value={formData.total_orders} onChange={(e) => setFormData({...formData, total_orders: e.target.value})} />
            </div>
            <div className="col-md-3">
              <label className="text-muted">Estado</label>
              <select className="form-select bg-transparent text-white border-secondary" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="Activo" className="text-dark">Activo</option>
                <option value="Frecuente" className="text-dark">Frecuente</option>
                <option value="Inactivo" className="text-dark">Inactivo</option>
              </select>
            </div>
            <div className="col-12 text-end mt-3">
              <button type="submit" className="btn text-white px-4" style={{background: 'var(--accent-color)'}}>Guardar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card border-0 shadow-lg glass-panel overflow-hidden">
        <div className="p-4 border-bottom border-secondary d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold d-flex align-items-center gap-2 text-white"><Users size={20} className="text-primary"/> Directorio</h5>
        </div>
        
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
        ) : (
          <div className="table-responsive">
            <table className="table border-0 mb-0" style={{color: 'var(--text-main)', backgroundColor: 'transparent'}}>
              <thead>
                <tr style={{borderColor: 'var(--border-color)'}}>
                  <th className="text-muted fw-normal bg-transparent border-bottom px-4">Nombre Completo</th>
                  <th className="text-muted fw-normal bg-transparent border-bottom">Teléfono</th>
                  <th className="text-muted fw-normal bg-transparent border-bottom">Total Pedidos</th>
                  <th className="text-muted fw-normal bg-transparent border-bottom">Estado</th>
                  <th className="text-muted fw-normal bg-transparent border-bottom text-end px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id} style={{borderColor: 'var(--border-color)'}}>
                    <td className="fw-medium bg-transparent border-bottom text-white px-4">{client.name}</td>
                    <td className="bg-transparent border-bottom">{client.phone}</td>
                    <td className="bg-transparent border-bottom">{client.total_orders}</td>
                    <td className="bg-transparent border-bottom">
                      <span className={`badge px-3 py-2 rounded-pill ${
                        client.status === 'Activo' ? 'bg-success bg-opacity-25 text-success' :
                        client.status === 'Frecuente' ? 'bg-primary bg-opacity-25 text-primary' :
                        'bg-secondary bg-opacity-25 text-secondary'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="bg-transparent border-bottom text-end px-4">
                      <button onClick={() => deleteClient(client.id!)} className="btn btn-sm btn-outline-danger border-0"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                   <tr><td colSpan={5} className="text-center py-4 bg-transparent text-muted">Aún no hay clientes registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Clients;
