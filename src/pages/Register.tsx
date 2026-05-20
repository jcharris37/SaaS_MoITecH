import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Mail, Lock, Phone, ArrowRight, ArrowLeft, Eye, EyeOff, Scissors, HeartPulse, Utensils, Dumbbell, GraduationCap, Wrench, Package } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { useAuth } from '../context/useAuth';
import './Login.css';

const businessTypes = [
  { id: 'retail', icon: <Package size={24} />, label: 'Tienda de productos físicos' },
  { id: 'appointments', icon: <Scissors size={24} />, label: 'Negocio con citas (barbería, salón, spa)' },
  { id: 'health', icon: <HeartPulse size={24} />, label: 'Consultorio / Salud (odontólogo, médico, psicólogo)' },
  { id: 'restaurant', icon: <Utensils size={24} />, label: 'Restaurante / Comida' },
  { id: 'gym', icon: <Dumbbell size={24} />, label: 'Gimnasio / Entrenamiento' },
  { id: 'education', icon: <GraduationCap size={24} />, label: 'Academia / Clases / Cursos' },
  { id: 'services', icon: <Wrench size={24} />, label: 'Servicios técnicos (electricista, plomero, etc.)' },
  { id: 'other', icon: <Store size={24} />, label: 'Otro (personalizado)' }
];

const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    owner_email: '',
    password: '',
    advisor_phone: '',
    business_type: '',
    captcha_token: ''
  });
  const [showPassword, setShowPassword] = useState(false);
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

  const nextStep = () => {
    if (step === 1 && !formData.business_type) {
      setErrorMsg('Por favor selecciona un tipo de negocio.');
      return;
    }
    setErrorMsg('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setErrorMsg('');
    setStep(step - 1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!formData.owner_email.includes('@')) {
      setErrorMsg('Por favor, ingresa un correo válido');
      setLoading(false);
      return;
    }

    if (formData.advisor_phone.length !== 10 || !/^\d+$/.test(formData.advisor_phone)) {
      setErrorMsg('El teléfono debe tener exactamente 10 dígitos numéricos');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
       setErrorMsg('La contraseña debe tener al menos 8 caracteres');
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
        let msg = 'Error al registrar la tienda';
        if (data.detail) {
          msg = Array.isArray(data.detail) ? data.detail.map((d: any) => d.msg).join(', ') : data.detail;
        } else if (data.message) {
          msg = data.message;
        }
        throw new Error(msg);
      }

      setSuccessMsg(`¡Negocio creado exitosamente!`);

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
          <div className="col-12 col-md-10 col-lg-6">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-4"
            >
              <h1 className="login-title mb-2 text-gradient" style={{fontSize: '2.5rem'}}>Únete a Moihub</h1>
              <p className="login-subtitle text-white">Configura tu plataforma en simples pasos.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="login-glass-card p-4 p-md-5"
            >
              
              <div className="d-flex justify-content-between mb-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`flex-grow-1 text-center ${step >= i ? 'text-gradient fw-bold' : 'text-muted'}`} style={{ borderBottom: step >= i ? '2px solid #ea580c' : '2px solid #444', paddingBottom: '10px' }}>
                    Paso {i}
                  </div>
                ))}
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

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <h5 className="text-white mb-3 text-center">¿Qué tipo de negocio tienes?</h5>
                    <div className="row g-3">
                      {businessTypes.map(type => (
                        <div className="col-12 col-sm-6" key={type.id}>
                          <div 
                            className={`p-3 rounded-3 cursor-pointer transition-all ${formData.business_type === type.id ? 'bg-orange-500 text-white' : 'bg-dark text-white border border-secondary'}`}
                            style={{ cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: formData.business_type === type.id ? 'rgba(234, 88, 12, 0.2)' : 'rgba(255, 255, 255, 0.05)', borderColor: formData.business_type === type.id ? '#ea580c' : 'rgba(255, 255, 255, 0.1)' }}
                            onClick={() => setFormData({...formData, business_type: type.id})}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ color: formData.business_type === type.id ? '#ea580c' : '#ccc' }}>{type.icon}</span>
                              <span style={{ fontSize: '0.9rem' }}>{type.label}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={nextStep} className="login-submit-btn btn-glow-orange w-100 mt-4">Continuar <ArrowRight size={18} /></button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <h5 className="text-white mb-3 text-center">Datos de tu negocio</h5>
                    
                    <div className="mb-3">
                      <label className="login-label">Nombre de tu Negocio</label>
                      <div className="login-input-group">
                        <Store size={18} className="input-icon" />
                        <input type="text" className="login-input" placeholder="Ej. Zapatería El Paso" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="login-label">Correo Electrónico</label>
                      <div className="login-input-group">
                        <Mail size={18} className="input-icon" />
                        <input type="email" className="login-input" placeholder="contacto@gmail.com" value={formData.owner_email} onChange={(e) => setFormData({...formData, owner_email: e.target.value})} required />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="login-label">Número de WhatsApp (Ventas)</label>
                      <div className="login-input-group">
                        <Phone size={18} className="input-icon" />
                        <input type="text" className="login-input" placeholder="Ej. 3001234567" value={formData.advisor_phone} onChange={(e) => setFormData({...formData, advisor_phone: e.target.value})} required />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="login-label">Contraseña</label>
                      <div className="login-input-group">
                        <Lock size={18} className="input-icon" />
                        <input type={showPassword ? "text" : "password"} className="login-input pe-5" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={8} />
                        <button type="button" className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button type="button" onClick={prevStep} className="btn btn-outline-light w-50"><ArrowLeft size={18} /> Volver</button>
                      <button type="button" onClick={nextStep} className="login-submit-btn btn-glow-orange w-50">Continuar <ArrowRight size={18} /></button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                     <h5 className="text-white mb-3 text-center">Verificación final</h5>
                     <p className="text-muted text-center small mb-4">Resuelve el captcha para crear tu negocio y empezar a vender.</p>
                     
                     <form onSubmit={handleRegister}>
                        <div className="mb-4 d-flex justify-content-center" style={{minHeight: '80px'}}>
                          <HCaptcha
                            sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001"}
                            onVerify={(token) => { setFormData(prev => ({...prev, captcha_token: token})); setErrorMsg(''); }}
                            onExpire={() => setFormData(prev => ({...prev, captcha_token: ''}))}
                          />
                        </div>

                        <div className="d-flex gap-2">
                          <button type="button" onClick={prevStep} className="btn btn-outline-light w-50"><ArrowLeft size={18} /> Volver</button>
                          <button type="submit" disabled={loading} className="login-submit-btn btn-glow-orange w-50">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Finalizar'}
                          </button>
                        </div>
                     </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-center mt-4 pt-3 border-top border-secondary">
                <p className="text-muted small mb-0">
                  ¿Ya tienes una cuenta? <Link to="/login" className="text-gradient text-decoration-none fw-bold">Inicia Sesión</Link>
                </p>
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

