import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '../services/api';
import './Login.css';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await apiFetch('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, new_password: newPassword })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Error al restablecer la contraseña');
      }

      setSuccessMsg('Contraseña actualizada correctamente. Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 2500);

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
              <h1 className="login-title mb-2 text-gradient" style={{ fontSize: '3rem' }}>Restablecer</h1>
              <p className="login-subtitle fs-5 fw-medium text-white">Recupera el acceso a tu cuenta.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="login-glass-card p-5"
            >
              <form onSubmit={handleReset}>
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
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="login-label">Nueva Contraseña</label>
                  <div className="login-input-group position-relative">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="login-input pe-5"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      className="btn position-absolute end-0 top-50 translate-middle-y border-0 text-muted p-2" 
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      style={{ background: 'transparent' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <small className="text-muted d-block mt-2">
                    Mínimo 8 caracteres, al menos 1 letra y 1 número.
                  </small>
                </div>

                {errorMsg && (
                  <div className="alert py-2 border-0 rounded-3 text-center mb-4" style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)', color: '#ff6b6b' }}>
                    <small>{errorMsg}</small>
                  </div>
                )}
                
                {successMsg && (
                  <div className="alert py-2 border-0 rounded-3 text-center mb-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <small>{successMsg}</small>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="login-submit-btn w-100 btn-glow-orange mt-2"
                >
                  {loading
                    ? <span className="spinner-border spinner-border-sm"></span>
                    : <>Actualizar Contraseña <ArrowRight size={18} /></>
                  }
                </motion.button>
              </form>

              <div className="text-center mt-4">
                <Link to="/login" className="text-muted small text-decoration-none hover-text-accent">
                  ← Volver al inicio de sesión
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
