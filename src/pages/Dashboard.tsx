import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Package, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


const salesData = [
  { name: 'Lun', ventas: 4000 },
  { name: 'Mar', ventas: 3000 },
  { name: 'Mie', ventas: 2000 },
  { name: 'Jue', ventas: 2780 },
  { name: 'Vie', ventas: 1890 },
  { name: 'Sab', ventas: 2390 },
  { name: 'Dom', ventas: 3490 },
];

import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const TENANT_ID = user?.id;
  
  const [stats, setStats] = useState({
    total_sales: 0,
    active_clients: 0,
    total_products: 0,
    total_messages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/stats/${TENANT_ID}`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error cargando stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants} className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="dashboard-title text-gradient">Resumen de tu Negocio</h2>
          <p className="text-muted">Bienvenido de vuelta. Aquí está el desempeño de hoy actualizado.</p>
        </div>
        <button 
          onClick={() => {
            if(user) {
              navigator.clipboard.writeText(`${window.location.origin}/tienda/${user.slug}`);
              alert('¡Enlace de tu tienda copiado al portapapeles!');
            }
          }}
          className="btn text-white fw-bold d-flex align-items-center gap-2 shadow-lg"
          style={{background: 'linear-gradient(135deg, var(--accent-color), #ea580c)', border: 'none', borderRadius: '12px'}}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          Compartir mi Tienda
        </button>
      </motion.div>

      {/* Tarjetas de Métricas */}
      <div className="row g-4 mb-4">
        <motion.div variants={itemVariants} className="col-md-3">
          <div className="card p-4 border-0 shadow-lg glass-panel transition h-100">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <p className="text-muted mb-1 fw-medium">Ganancias Netas</p>
                {loading ? <div className="spinner-border spinner-border-sm text-primary"></div> : <h3 className="fw-bold text-white mb-0">${stats.total_sales.toFixed(2)}</h3>}
              </div>
              <div className="p-2 rounded bg-success bg-opacity-10 text-success">
                <TrendingUp size={20} />
              </div>
            </div>
            <p className="text-success mb-0 small fw-medium"><TrendingUp size={14} className="me-1"/>+12.5% vs ayer</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-md-3">
          <div className="card p-4 border-0 shadow-lg glass-panel transition h-100">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <p className="text-muted mb-1 fw-medium">Clientes Activos</p>
                {loading ? <div className="spinner-border spinner-border-sm text-primary"></div> : <h3 className="fw-bold text-white mb-0">{stats.active_clients}</h3>}
              </div>
              <div className="p-2 rounded text-white" style={{background: 'rgba(59, 130, 246, 0.1)'}}>
                <Users size={20} color="#3b82f6" />
              </div>
            </div>
            <p className="text-muted mb-0 small">En tu base de datos CRM</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-md-3">
          <div className="card p-4 border-0 shadow-lg glass-panel transition h-100">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <p className="text-muted mb-1 fw-medium">Catálogo</p>
                {loading ? <div className="spinner-border spinner-border-sm text-primary"></div> : <h3 className="fw-bold text-white mb-0">{stats.total_products} prod.</h3>}
              </div>
              <div className="p-2 rounded text-white" style={{background: 'rgba(234, 88, 12, 0.1)'}}>
                <Package size={20} color="#ea580c" />
              </div>
            </div>
            <p className="text-muted mb-0 small">Productos en línea</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-md-3">
          <div className="card p-4 border-0 shadow-lg glass-panel transition h-100">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <p className="text-muted mb-1 fw-medium">Mensajes Bot</p>
                {loading ? <div className="spinner-border spinner-border-sm text-primary"></div> : <h3 className="fw-bold text-white mb-0">{stats.total_messages}</h3>}
              </div>
              <div className="p-2 rounded text-white" style={{background: 'rgba(147, 51, 234, 0.1)'}}>
                <MessageSquare size={20} color="#9333ea" />
              </div>
            </div>
            <p className="text-muted mb-0 small">Respuestas enviadas hoy</p>
          </div>
        </motion.div>
      </div>

      {/* Gráfico Principal */}
      <motion.div variants={itemVariants} className="card p-4 border-0 shadow-lg glass-panel">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0 fw-bold text-white">Rendimiento de Ventas Semanal</h5>
          <select className="form-select w-auto bg-transparent border-secondary text-muted">
            <option>Esta Semana</option>
            <option>Mes Pasado</option>
          </select>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff'}}
                itemStyle={{color: '#fff'}}
              />
              <Area type="monotone" dataKey="ventas" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
