import React, { useState, useEffect } from 'react';
import { Trash2, Save, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

import { apiFetch } from '../services/api';

interface BotRule {
  id: number;
  trigger_keyword: string;
  response_text: string;
}

const AIChat: React.FC = () => {

  const [rules, setRules] = useState<BotRule[]>([]);
  const [newCommand, setNewCommand] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    try {
      const response = await apiFetch(`/api/rules`);
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error("Error cargando reglas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRules();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommand || !newResponse) return;
    
    try {
      const response = await apiFetch(`/api/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_keyword: newCommand,
          response_text: newResponse
        })
      });

      if (response.ok) {
        setNewCommand('');
        setNewResponse('');
        fetchRules();
      }
    } catch {
      alert("Error guardando la regla");
    }
  };

  const deleteRule = async (id: number) => {
    try {
      await apiFetch(`/api/rules/${id}`, { method: 'DELETE' });
      fetchRules();
    } catch {
      console.error("Error eliminando regla");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-100 d-flex flex-column" style={{minHeight: '80vh'}}>
      <div className="mb-4">
        <h2 className="dashboard-title text-gradient">Constructor de Flujos</h2>
        <p className="text-muted">Programa qué responderá tu bot a los clientes en la tienda según la palabra que envíen.</p>
      </div>

      <div className="row g-4 flex-grow-1">
        {/* Formulario de Configuración */}
        <div className="col-md-5">
          <div className="card p-4 glass-panel h-100 border-0 shadow-lg" style={{background: 'var(--card-bg)', backdropFilter: 'blur(20px)'}}>
            <h5 className="text-white mb-4 d-flex align-items-center gap-2"><MessageSquare size={20}/> Nueva Regla</h5>
            <form onSubmit={handleAddRule}>
              <div className="mb-3">
                <label className="text-muted mb-2">Comando o Palabra Clave</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: precio, ayuda, horario" 
                  value={newCommand}
                  onChange={(e) => setNewCommand(e.target.value)}
                  style={{background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff'}}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="text-muted mb-2">Respuesta del Bot</label>
                <textarea 
                  className="form-control" 
                  rows={5} 
                  placeholder="Lo que el bot contestará exactamente..."
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  style={{background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff'}}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn text-white w-100 d-flex justify-content-center align-items-center gap-2" style={{background: 'linear-gradient(135deg, var(--accent-color), #ea580c)', border: 'none'}}>
                <Save size={18} /> Guardar Regla
              </button>
            </form>
          </div>
        </div>

        {/* Tabla de Reglas Guardadas */}
        <div className="col-md-7">
          <div className="card p-4 glass-panel h-100 border-0 shadow-lg" style={{background: 'var(--card-bg)', backdropFilter: 'blur(20px)'}}>
            <h5 className="text-white mb-4">Reglas Activas en tu Tienda</h5>
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
            ) : (
              <div className="table-responsive">
                <table className="table border-0" style={{color: 'var(--text-main)', backgroundColor: 'transparent'}}>
                  <thead>
                    <tr style={{borderColor: 'var(--border-color)'}}>
                      <th className="text-muted fw-normal bg-transparent border-bottom">Palabra Clave</th>
                      <th className="text-muted fw-normal bg-transparent border-bottom">Responde esto</th>
                      <th className="text-muted fw-normal bg-transparent border-bottom">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r) => (
                      <tr key={r.id} style={{borderColor: 'var(--border-color)'}}>
                        <td className="fw-bold bg-transparent border-bottom" style={{color: 'var(--accent-color)'}}>"{r.trigger_keyword}"</td>
                        <td className="bg-transparent border-bottom"><small>{r.response_text}</small></td>
                        <td className="bg-transparent border-bottom">
                          <button onClick={() => deleteRule(r.id)} className="btn btn-sm btn-outline-danger border-0">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rules.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-4 bg-transparent border-0">
                          Aún no hay reglas configuradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIChat;