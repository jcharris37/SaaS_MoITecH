import React, { useState, useEffect } from 'react';
// import { TrendingUp, Users, Package, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/useAuth';
import { Image, Palette } from 'lucide-react';

import { apiFetch } from '../services/api';

const salesData = [
  { name: 'Lun', ventas: 4000 },
  { name: 'Mar', ventas: 3000 },
  { name: 'Mie', ventas: 2000 },
  { name: 'Jue', ventas: 2780 },
  { name: 'Vie', ventas: 1890 },
  { name: 'Sab', ventas: 2390 },
  { name: 'Dom', ventas: 3490 },
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();

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
        const response = await apiFetch(`/api/stats`);

        if (!response.ok) {
          throw new Error('Error al obtener estadísticas');
        }

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

  const [themeColor, setThemeColor] = useState('#ea580c');
  const [logoUrl, setLogoUrl] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
      setSavingSettings(true);
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setLogoUrl(data.url);
      await apiFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: data.url })
      });
      alert('Logo actualizado');
    } catch (error) {
      console.error(error);
      alert('Error subiendo logo');
    } finally {
      setSavingSettings(false);
    }
  };

  const saveColor = async () => {
    try {
      setSavingSettings(true);
      await apiFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_color: themeColor })
      });
      alert('Color actualizado');
    } catch (error) {
      console.error(error);
    } finally {
      setSavingSettings(false);
    }
  };

  // 🔥 evita crash si user aún no carga
  if (!user) {
    return <div className="text-white p-4">Cargando usuario...</div>;
  }

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
      
      {/* HEADER */}
      <motion.div variants={itemVariants} className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="dashboard-title text-gradient">Resumen de tu Negocio</h2>
          <p className="text-muted">Bienvenido de vuelta. Aquí está el desempeño de hoy actualizado.</p>
        </div>

        <button 
          onClick={() => {
              const url = `${window.location.origin}/tienda/${user.slug}`;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(url);
              } else {
                const el = document.createElement('textarea');
                el.value = url;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
              }
              alert('¡Enlace de tu tienda copiado!');
           }}
          className="btn text-white fw-bold d-flex align-items-center gap-2 shadow-lg"
          style={{background: 'linear-gradient(135deg, var(--accent-color), #ea580c)', border: 'none', borderRadius: '12px'}}
        >
          Compartir mi Tienda
        </button>
      </motion.div>

      {/* CARDS */}
      <div className="row g-4 mb-4">
        
        <motion.div variants={itemVariants} className="col-md-3">
          <div className="card p-4 border-0 shadow-lg glass-panel h-100">
            <p className="text-muted mb-1">Ganancias</p>
            {loading ? <div className="spinner-border"></div> :
              <h3 className="text-white">${stats.total_sales.toFixed(2)}</h3>
            }
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-md-3">
          <div className="card p-4 border-0 shadow-lg glass-panel h-100">
            <p className="text-muted mb-1">Clientes</p>
            {loading ? <div className="spinner-border"></div> :
              <h3 className="text-white">{stats.active_clients}</h3>
            }
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-md-3">
          <div className="card p-4 border-0 shadow-lg glass-panel h-100">
            <p className="text-muted mb-1">Productos</p>
            {loading ? <div className="spinner-border"></div> :
              <h3 className="text-white">{stats.total_products}</h3>
            }
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="col-md-3">
          <div className="card p-4 border-0 shadow-lg glass-panel h-100">
            <p className="text-muted mb-1">Mensajes</p>
            {loading ? <div className="spinner-border"></div> :
              <h3 className="text-white">{stats.total_messages}</h3>
            }
          </div>
        </motion.div>

      </div>

      {/* GRÁFICO */}
      <motion.div variants={itemVariants} className="card p-4 border-0 shadow-lg glass-panel">
        <h5 className="text-white mb-3">Ventas Semanales</h5>

        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="ventas" stroke="#ea580c" fill="#ea580c" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* AJUSTES DE TIENDA */}
      <div className="row g-4 mt-2 mb-4">
        <motion.div variants={itemVariants} className="col-md-6">
          <div className="card p-4 border-0 shadow-lg glass-panel h-100">
            <h5 className="text-white mb-3 d-flex align-items-center gap-2"><Image size={20}/> Logo de la Tienda</h5>
            <input type="file" accept="image/*" onChange={handleUploadLogo} className="form-control mb-3" style={{background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none'}} />
            {logoUrl && <img src={logoUrl} alt="Logo" style={{height: '60px', objectFit: 'contain'}} />}
            {savingSettings && <p className="text-muted small">Guardando...</p>}
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="col-md-6">
          <div className="card p-4 border-0 shadow-lg glass-panel h-100">
            <h5 className="text-white mb-3 d-flex align-items-center gap-2"><Palette size={20}/> Color de Tema</h5>
            <div className="d-flex align-items-center gap-3">
              <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} style={{width: '60px', height: '40px', cursor: 'pointer', border: 'none', background: 'transparent'}} />
              <button onClick={saveColor} disabled={savingSettings} className="btn text-white" style={{background: 'linear-gradient(135deg, var(--accent-color), #ea580c)'}}>Guardar Color</button>
            </div>
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
};

export default Dashboard;
