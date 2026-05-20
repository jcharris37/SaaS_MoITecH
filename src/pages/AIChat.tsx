import React, { useState, useEffect } from 'react';
import { Trash2, Save, MessageSquare, Plus } from 'lucide-react';
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
  const [isRedirect, setIsRedirect] = useState(false);
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
    fetchRules();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommand || (!newResponse && !isRedirect)) return;
    
    try {
      const response = await apiFetch(`/api/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_keyword: newCommand,
          response_text: isRedirect ? '__REDIRECT_WHATSAPP__' : newResponse
        })
      });

      if (response.ok) {
        setNewCommand('');
        setNewResponse('');
        setIsRedirect(false);
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

  const defaultRule = rules.find(r => r.trigger_keyword === 'default');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-100 d-flex flex-column" style={{minHeight: '80vh'}}>
      <div className="mb-4">
        <h2 className="dashboard-title text-gradient">Constructor de Bot de WhatsApp</h2>
        <p className="text-muted">Configura respuestas automáticas y visualiza cómo lo verán tus clientes.</p>
      </div>

      <div className="row g-4 flex-grow-1">
        {/* Formulario de Configuración */}
        <div className="col-lg-5 col-md-6">
          <div className="card p-4 glass-panel border-0 shadow-lg mb-4" style={{background: 'var(--card-bg)', backdropFilter: 'blur(20px)'}}>
            <h5 className="text-white mb-4 d-flex align-items-center gap-2"><Plus size={20}/> Agregar / Editar Regla</h5>
            <form onSubmit={handleAddRule}>
              <div className="mb-3">
                <label className="text-muted mb-2">Comando (ej: 'default', '1', 'precio')</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: 1" 
                  value={newCommand}
                  onChange={(e) => setNewCommand(e.target.value)}
                  style={{background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff'}}
                  required
                />
              </div>
              
              <div className="mb-3 form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  id="redirectCheck" 
                  checked={isRedirect}
                  onChange={(e) => setIsRedirect(e.target.checked)}
                />
                <label className="form-check-label text-white" htmlFor="redirectCheck">
                  Al enviar esto, redirigir al chat humano (WhatsApp)
                </label>
              </div>
              {!isRedirect && (
                <div className="mb-4">
                  <label className="text-muted mb-2">Respuesta del Bot</label>
                  <textarea 
                    className="form-control" 
                    rows={4} 
                    placeholder="Lo que el bot contestará..."
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    style={{background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff'}}
                    required={!isRedirect}
                  ></textarea>
                </div>
              )}
              <button type="submit" className="btn text-white w-100 d-flex justify-content-center align-items-center gap-2" style={{background: 'linear-gradient(135deg, var(--accent-color), #ea580c)', border: 'none'}}>
                <Save size={18} /> Guardar Regla
              </button>
            </form>
          </div>
          
          <div className="card p-4 glass-panel border-0 shadow-lg" style={{background: 'var(--card-bg)', backdropFilter: 'blur(20px)'}}>
            <h6 className="text-white mb-3">Lista de Reglas</h6>
            {loading ? <div className="spinner-border text-primary"></div> : (
              <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                {rules.map(r => (
                  <div key={r.id} className="d-flex justify-content-between align-items-center p-2 mb-2 rounded bg-dark border border-secondary">
                    <div>
                      <span className="badge bg-secondary me-2">{r.trigger_keyword}</span>
                      <small className="text-muted text-truncate d-inline-block" style={{maxWidth: '150px', verticalAlign: 'bottom'}}>
                        {r.response_text === '__REDIRECT_WHATSAPP__' ? 'Redirección Humana' : r.response_text}
                      </small>
                    </div>
                    <button onClick={() => deleteRule(r.id)} className="btn btn-sm text-danger p-0"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vista Previa del Bot */}
        <div className="col-lg-7 col-md-6 d-flex justify-content-center">
          <div className="phone-preview shadow-lg position-relative" style={{width: '320px', height: '600px', backgroundColor: '#e5ddd5', borderRadius: '40px', border: '10px solid #222', overflow: 'hidden'}}>
            {/* Header */}
            <div className="bg-success text-white d-flex align-items-center px-3 py-3 shadow-sm" style={{backgroundColor: '#075e54'}}>
              <MessageSquare size={20} className="me-2"/>
              <strong>Bot de tu Negocio</strong>
            </div>
            
            {/* Background pattern */}
            <div className="chat-bg p-3" style={{height: '100%', overflowY: 'auto', backgroundImage: 'url(https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png)'}}>
              
              <div className="message-bubble received p-2 rounded-3 mb-3" style={{backgroundColor: '#fff', maxWidth: '85%', boxShadow: '0 1px 1px rgba(0,0,0,0.1)', color: '#000'}}>
                <p className="mb-0 small" style={{whiteSpace: 'pre-line'}}>
                  {defaultRule ? defaultRule.response_text : 'Hola, ¿en qué podemos ayudarte?'}
                </p>
                <small className="text-muted d-block text-end mt-1" style={{fontSize: '0.65rem'}}>10:00 AM</small>
              </div>

              <div className="d-flex justify-content-end mb-3">
                <div className="message-bubble sent p-2 rounded-3" style={{backgroundColor: '#dcf8c6', maxWidth: '85%', boxShadow: '0 1px 1px rgba(0,0,0,0.1)', color: '#000'}}>
                  <p className="mb-0 small">1</p>
                  <small className="text-muted d-block text-end mt-1" style={{fontSize: '0.65rem'}}>10:01 AM</small>
                </div>
              </div>

              {rules.find(r => r.trigger_keyword === '1') && (
                <div className="message-bubble received p-2 rounded-3 mb-3" style={{backgroundColor: '#fff', maxWidth: '85%', boxShadow: '0 1px 1px rgba(0,0,0,0.1)', color: '#000'}}>
                  <p className="mb-0 small" style={{whiteSpace: 'pre-line'}}>
                    {rules.find(r => r.trigger_keyword === '1')?.response_text === '__REDIRECT_WHATSAPP__' 
                      ? 'Conectando con un asesor humano...' 
                      : rules.find(r => r.trigger_keyword === '1')?.response_text}
                  </p>
                  <small className="text-muted d-block text-end mt-1" style={{fontSize: '0.65rem'}}>10:01 AM</small>
                </div>
              )}

            </div>
            
            {/* Input simulation */}
            <div className="position-absolute bottom-0 w-100 bg-light p-2 d-flex align-items-center border-top border-secondary" style={{height: '60px'}}>
              <div className="bg-white rounded-pill flex-grow-1 px-3 py-2 text-muted small border border-secondary">
                Escribe un mensaje...
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AIChat;