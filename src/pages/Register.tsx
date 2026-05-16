import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useAuth } from '../context/useAuth';
import './Login.css'; 

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    owner_email: '',
    password: '',
    advisor_phone: '',
    business_type: 'retail',
    captcha_token: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'superadmin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    // Validaciones Estrictas
    if (!formData.owner_email.endsWith('@gmail.com')) {
      setErrorMsg('Por favor, usa un correo de @gmail.com');
      setLoading(false);
      return;
    }

    if (formData.advisor_phone.length !== 10 || !/^\d+$/.test(formData.advisor_phone)) {
      setErrorMsg('El teléfono debe tener exactamente 10 dígitos numéricos');
      setLoading(false);
      return;
    }

    if (!formData.captcha_token) {
      setErrorMsg('Por favor, resuelve el captcha de seguridad');
      setLoading(false);
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al registrar la tienda');
      }

      setSuccessMsg(`¡Tienda creada exitosamente! Tu enlace será moihub.com/tienda/${data.slug}`);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg('Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
      <div className="glow-orb orb-3"></div>

      <div className="container d-flex justify-content-center align-items-center min-vh-100 position-relative z-1 py-5">
        <div className="row w-100 justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-4"
            >
              <h1 className="login-title mb-2 text-gradient" style={{fontSize: '3rem'}}>Únete a Moihub</h1>
              <p className="login-subtitle text-white">Crea tu tienda online inteligente en minutos.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="login-glass-card p-4 p-md-5"
            >
              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label className="login-label">Nombre de tu Negocio</label>
                  <div className="login-input-group">
                    <Store size={18} className="input-icon" />
                    <input 
                      type="text" 
                      className="login-input" 
                      placeholder="Ej. Zapatería El Paso" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required 
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="login-label">Correo Electrónico</label>
                  <div className="login-input-group">
                    <Mail size={18} className="input-icon" />
                    <input 
                      type="email" 
                      className="login-input" 
                      placeholder="contacto@minegocio.com" 
                      value={formData.owner_email}
                      onChange={(e) => setFormData({...formData, owner_email: e.target.value})}
                      required 
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="login-label">Número de WhatsApp (Ventas)</label>
                  <div className="login-input-group">
                    <Phone size={18} className="input-icon" />
                    <input 
                      type="text" 
                      className="login-input" 
                      placeholder="Ej. 573001234567" 
                      value={formData.advisor_phone}
                      onChange={(e) => setFormData({...formData, advisor_phone: e.target.value})}
                      required 
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="login-label">Tipo de Negocio</label>
                  <div className="login-input-group">
                    <Store size={18} className="input-icon" />
                    <select 
                      className="login-input" 
                      style={{backgroundColor: 'transparent', border: 'none', color: '#fff'}}
                      value={formData.business_type}
                      onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                    >
                      <option value="retail" style={{color: '#000'}}>Tienda de Productos</option>
                      <option value="appointments" style={{color: '#000'}}>Citas / Reservas (Barbería, Odontología, etc.)</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="login-label">Contraseña</label>
                  <div className="login-input-group">
                    <Lock size={18} className="input-icon" />
                    <input 
                      type="password" 
                      className="login-input" 
                      placeholder="••••••••" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required 
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="mb-4 d-flex justify-content-center" style={{minHeight: '80px'}}>
                  <HCaptcha
                    sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001"}
                    onVerify={(token) => {
                      setFormData(prev => ({...prev, captcha_token: token}));
                      setErrorMsg('');
                    }}
                    onExpire={() => setFormData(prev => ({...prev, captcha_token: ''}))}
                  />
                </div>

                {errorMsg && (
                  <div className="alert alert-danger py-2 border-0 rounded-3 text-center mb-3" style={{backgroundColor: 'rgba(220, 53, 69, 0.1)', color: '#ff6b6b'}}>
                    <small>{errorMsg}</small>
                  </div>
                )}

                {successMsg && (
                  <div className="alert alert-success py-2 border-0 rounded-3 text-center mb-3" style={{backgroundColor: 'rgba(25, 135, 84, 0.1)', color: '#20c997'}}>
                    <small>{successMsg}</small>
                  </div>
                )}

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading}
                  className="login-submit-btn btn-glow-orange w-100 mb-3"
                >
                  {loading ? <span className="spinner-border spinner-border-sm"></span> : <>Crear Mi Tienda <ArrowRight size={18} /></>}
                </motion.button>

                <div className="text-center mt-3">
                  <p className="text-muted small mb-0">
                    ¿Ya tienes una cuenta? <Link to="/login" className="text-gradient text-decoration-none fw-bold">Inicia Sesión</Link>
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
