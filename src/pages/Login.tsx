import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Building, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Credenciales incorrectas');
      }

      const data = await response.json();
      
      // Obtener datos del usuario con el token recién creado
      const userRes = await fetch('http://localhost:8000/api/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      const userData = await userRes.json();
      
      login(data.access_token, userData);

      if (userData.role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background Glowing Orbs */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>

      <div className="container d-flex justify-content-center align-items-center min-vh-100 position-relative z-1">
        <div className="row w-100 justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center mb-5"
            >
              <h1 className="login-title mb-2 text-gradient" style={{fontSize: '3.5rem'}}>Moihub</h1>
              <p className="login-subtitle fs-5 fw-medium text-white">Organiza tu negocio con tu mejor aliado inteligente.</p>
              <p className="login-subtitle">Aumenta tus ventas exponencialmente dejando que nuestra IA responda a tus clientes, agende citas y controle tu inventario 24/7 sin que muevas un dedo.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="login-glass-card p-5"
            >
              <div className="text-center mb-4">
                <span className="badge bg-secondary bg-opacity-25 text-white px-3 py-2 rounded-pill fw-normal">Acceso Seguro</span>
              </div>

              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="login-label">Correo Electrónico</label>
                  <div className="login-input-group">
                    <Mail size={18} className="input-icon" />
                    <input 
                      type="email" 
                      className="login-input" 
                      placeholder="admin@voltix.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="login-label d-flex justify-content-between">
                    Contraseña
                  </label>
                  <div className="login-input-group">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type="password" 
                      className="login-input" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="alert alert-danger py-2 border-0 rounded-3 text-center mb-4" style={{backgroundColor: 'rgba(220, 53, 69, 0.1)', color: '#ff6b6b'}}>
                    <small>{errorMsg}</small>
                  </div>
                )}

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  className="login-submit-btn btn-glow-orange w-100"
                >
                  {loading ? <span className="spinner-border spinner-border-sm"></span> : <>Iniciar Sesión <ArrowRight size={18} /></>}
                </motion.button>
              </form>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-4 text-white-50"
            >
              <small>Developed for the Next Era of SaaS Platforms.</small>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
