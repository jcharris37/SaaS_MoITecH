
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Building, ShieldCheck } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useAuth } from '../context/useAuth';
import { apiFetch, saveTokens } from '../services/api';
import './Login.css';


const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'tenant' | 'superadmin'>('tenant');
  const [captchaToken, setCaptchaToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'superadmin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!captchaToken && role === 'tenant') {
      setErrorMsg('Por favor, resuelve el captcha');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, captcha_token: captchaToken })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Credenciales incorrectas');
      }

      const data = await response.json();


      if (!data.access_token) {
        throw new Error("Token no recibido del servidor");
      }


      saveTokens(data.access_token, data.refresh_token);

      const userRes = await apiFetch('/api/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });

      if (!userRes.ok) {
        throw new Error("Error obteniendo información del usuario");
      }

      const userData = await userRes.json();


      login(data.access_token, userData, data.refresh_token);

      if (userData.role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg('Error de conexión con el servidor');
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

      <div className="container d-flex justify-content-center align-items-center min-vh-100 position-relative z-1">
        <div className="row w-100 justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center mb-5"
            >
              <h1 className="login-title mb-2 text-gradient" style={{ fontSize: '3.5rem' }}>Moihub</h1>
              <p className="login-subtitle fs-5 fw-medium text-white">Organiza tu negocio con tu mejor aliado inteligente.</p>
              <p className="login-subtitle">Aumenta tus ventas exponencialmente dejando que nuestra IA responda a tus clientes 24/7.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="login-glass-card p-5"
            >
              <div className="role-toggle-container mb-4">
                <button
                  className={`role-btn ${role === 'tenant' ? 'active' : ''}`}
                  onClick={() => setRole('tenant')}
                  type="button"
                >
                  <Building size={16} /> Dueño de Negocio
                </button>
                <button
                  className={`role-btn ${role === 'superadmin' ? 'active admin-mode' : ''}`}
                  onClick={() => setRole('superadmin')}
                  type="button"
                >
                  <ShieldCheck size={16} /> Super Admin
                </button>
              </div>

              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="login-label">Correo Electrónico</label>
                  <div className="login-input-group">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      className="login-input"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required={role ==='tenant'}
                    />
                  </div>
                </div>

                {role === 'tenant' && (
                  <div className="mb-4 d-flex justify-content-center" style={{minHeight: '80px'}}>
                    <HCaptcha
                      sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001"}
                      onVerify={(token) => {
                        setCaptchaToken(token);
                        setErrorMsg('');
                      }}
                      onExpire={() => setCaptchaToken('')}
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="login-label">
                    {role === 'superadmin' ? 'Contraseña Admin' : 'Contraseña'}
                  </label>
                  <div className="login-input-group">
                    <Lock size={18} className="input-icon" />
                    <input
                      type="password"
                      className="login-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={role === 'tenant'}
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div
                    className="alert py-2 border-0 rounded-3 text-center mb-4"
                    style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)', color: '#ff6b6b' }}
                  >
                    <small>{errorMsg}</small>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={`login-submit-btn w-100 ${role === 'superadmin' ? 'btn-glow-danger' : 'btn-glow-orange'}`}
                >
                  {loading
                    ? <span className="spinner-border spinner-border-sm"></span>
                    : <>{role === 'superadmin' ? 'Acceder al Control Total' : 'Iniciar Sesión'} <ArrowRight size={18} /></>
                  }
                </motion.button>
              </form>

              <div className="text-center mt-4">
                <p className="text-muted small mb-0">
                  ¿No tienes cuenta? <Link to="/register" className="text-gradient text-decoration-none fw-bold">Registra tu negocio gratis</Link>
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-4 text-white-50"
            >
                <small>Developer Joseph Charris Silvera.</small>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

