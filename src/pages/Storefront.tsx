import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, ShoppingCart, Calendar, Clock, MapPin, 
  Phone, PackageSearch, X, Bot,
  Mail, ArrowRight, Star, ShieldCheck, Users, Camera, Globe
} from 'lucide-react';
import { API_URL } from '../services/api';
import StoreChatWidget from '../components/StoreChatWidget';
import './Storefront.css';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category?: string;
  image_url?: string;
  description?: string;
}

interface Provider {
  id: number;
  name: string;
  profile_image?: string;
  tenant_id: number;
}

interface StoreInfo {
  name: string;
  slug: string;
  logo_url?: string;
  theme_color?: string;
  business_type?: string;
  advisor_phone?: string;
  business_address?: string;
}

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [apptForm, setApptForm] = useState({ client_name: '', client_phone: '', date: '', time: '' });

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const infoRes = await fetch(`${API_URL}/api/store/${slug}/info`);
        if (!infoRes.ok) throw new Error('Tienda no encontrada');
        const infoData = await infoRes.json();
        setStoreInfo(infoData);
        
        if (infoData.theme_color) {
          document.documentElement.style.setProperty('--accent-color', infoData.theme_color);
        }

        if (infoData.business_type === 'appointments') {
          const provRes = await fetch(`${API_URL}/api/store/${slug}/providers`);
          if (provRes.ok) setProviders(await provRes.json());
        } else {
          const prodRes = await fetch(`${API_URL}/api/store/${slug}/products`);
          if (prodRes.ok) setProducts(await prodRes.json());
        }
      } catch (error) {
        console.error("Error cargando tienda:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !selectedProvider || !apptForm.client_name || !apptForm.date || !apptForm.time) return;
    try {
      const response = await fetch(`${API_URL}/api/store/${slug}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...apptForm, provider_id: selectedProvider.id })
      });
      if (response.ok) {
        alert('Cita agendada exitosamente. Te esperamos.');
        setApptForm({ client_name: '', client_phone: '', date: '', time: '' });
        setSelectedProvider(null);
      }
    } catch {
      alert('Error agendando cita');
    }
  };

  const handleBuyWhatsApp = (productName: string) => {
    const text = encodeURIComponent(`Hola, quisiera comprar: ${productName}. Vi esto en tu tienda online de ${storeInfo?.name}.`);
    const phone = storeInfo?.advisor_phone || '573000000000';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{backgroundColor: '#0a0a0f'}}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!storeInfo) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center text-white" style={{backgroundColor: '#0a0a0f'}}>
        <h2 className="display-4 fw-bold mb-3">404</h2>
        <p className="text-muted">Tienda no encontrada</p>
      </div>
    );
  }

  return (
    <div className="store-page">
      {/* Decorative Orbs */}
      <div className="premium-orb orb-1"></div>
      <div className="premium-orb orb-2"></div>
      
      {/* Minimalist Navbar */}
      <nav className="navbar navbar-dark sticky-top glass-header">
        <div className="container">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="navbar-brand d-flex align-items-center gap-3">
            {storeInfo.logo_url ? (
              <img src={getImageUrl(storeInfo.logo_url)} alt="Logo" className="nav-logo" />
            ) : (
              <div className="nav-logo-placeholder">{storeInfo.name[0]}</div>
            )}
            <span className="brand-name">{storeInfo.name}</span>
          </motion.div>
          <motion.button 
            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            onClick={() => setIsChatOpen(true)}
            className="btn-ia-assistant"
          >
            <Bot size={18} /> <span>Asistente IA</span>
          </motion.button>
        </div>
      </nav>

      <main className="container pt-5 pb-5 position-relative">
        {/* Hero Section */}
        <motion.section 
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="text-center mb-5 mt-4"
        >
          <div className="badge-premium mb-3">Oficial de {storeInfo.name}</div>
          <h1 className="hero-title">
            {storeInfo.business_type === 'appointments' ? 'Reserva tu Experiencia' : 'Catálogo Exclusivo'}
          </h1>
          <p className="hero-subtitle mx-auto">
            {storeInfo.business_type === 'appointments' 
              ? 'Agenda tu cita con los mejores profesionales en pocos clics.' 
              : 'Explora nuestra colección seleccionada de productos de alta calidad.'}
          </p>
        </motion.section>

        {/* Content Section */}
        <section className="store-content">
          {storeInfo.business_type === 'appointments' ? (
            <div className="row g-4 justify-content-center">
              <AnimatePresence mode="wait">
                {selectedProvider ? (
                  <motion.div 
                    key="booking-form"
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="col-md-6"
                  >
                    <div className="booking-card">
                      <div className="d-flex align-items-center gap-4 mb-4">
                        <div className="provider-avatar-lg">
                          {selectedProvider.profile_image ? (
                            <img src={getImageUrl(selectedProvider.profile_image)} alt={selectedProvider.name} />
                          ) : (
                            <span>{selectedProvider.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="mb-0 text-white fw-bold">Agendar con {selectedProvider.name}</h4>
                          <button className="btn-change-prov" onClick={() => setSelectedProvider(null)}>Cambiar profesional</button>
                        </div>
                      </div>
                      <form onSubmit={handleBookAppointment} className="booking-form">
                        <div className="row g-3">
                          <div className="col-12">
                            <label><Users size={14}/> Tu Nombre Completo</label>
                            <input type="text" placeholder="Ej. Juan Pérez" value={apptForm.client_name} onChange={e => setApptForm({...apptForm, client_name: e.target.value})} required />
                          </div>
                          <div className="col-12">
                            <label><Phone size={14}/> Teléfono de Contacto</label>
                            <input type="text" placeholder="Ej. 300 123 4567" value={apptForm.client_phone} onChange={e => setApptForm({...apptForm, client_phone: e.target.value})} required />
                          </div>
                          <div className="col-6">
                            <label><Calendar size={14}/> Fecha</label>
                            <input type="date" value={apptForm.date} onChange={e => setApptForm({...apptForm, date: e.target.value})} required />
                          </div>
                          <div className="col-6">
                            <label><Clock size={14}/> Hora</label>
                            <input type="time" value={apptForm.time} onChange={e => setApptForm({...apptForm, time: e.target.value})} required />
                          </div>
                        </div>
                        <button type="submit" className="btn-confirm-booking mt-4">
                          Confirmar Reserva <ArrowRight size={18} />
                        </button>
                      </form>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="provider-list"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="row g-4 justify-content-center"
                  >
                    {providers.map(prov => (
                      <div className="col-md-3 col-sm-6" key={prov.id}>
                        <motion.div 
                          whileHover={{ y: -10 }} 
                          className="provider-card"
                          onClick={() => setSelectedProvider(prov)}
                        >
                          <div className="provider-avatar">
                            {prov.profile_image ? (
                              <img src={getImageUrl(prov.profile_image)} alt={prov.name} />
                            ) : (
                              <span>{prov.name[0]}</span>
                            )}
                          </div>
                          <h5 className="text-white fw-bold mb-1">{prov.name}</h5>
                          <span className="text-accent small fw-bold">Disponibilidad Inmediata</span>
                        </motion.div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="row g-4">
              {products.map((product) => (
                <div className="col-lg-4 col-md-6" key={product.id}>
                  <motion.div whileHover={{ y: -10 }} className="product-card-premium">
                    <div className="product-img-wrapper">
                      {product.image_url ? (
                        <img src={getImageUrl(product.image_url)} alt={product.name} />
                      ) : (
                        <div className="img-placeholder"><PackageSearch size={40}/></div>
                      )}
                      {product.stock <= 5 && product.stock > 0 && <span className="stock-tag">¡Últimas unidades!</span>}
                      {product.stock === 0 && <span className="stock-tag out">Agotado</span>}
                    </div>
                    <div className="product-info-premium">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="product-name">{product.name}</h5>
                        <div className="rating-mini"><Star size={12} fill="var(--accent-color)"/> 5.0</div>
                      </div>
                      <p className="product-desc">{product.description || 'Sin descripción disponible.'}</p>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="price-tag">{fmt(product.price)}</div>
                        <button 
                          onClick={() => handleBuyWhatsApp(product.name)}
                          className="btn-buy-wa"
                          disabled={product.stock === 0}
                        >
                          <ShoppingCart size={16} /> Comprar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Professional Footer */}
      <footer className="footer-premium">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-md-4 text-center text-md-start">
              <div className="footer-brand d-flex align-items-center gap-2 mb-3">
                <div className="footer-dot"></div>
                <h4 className="mb-0 fw-bold text-white">{storeInfo.name}</h4>
              </div>
              <p className="small text-muted">Tu satisfacción es nuestra prioridad. Contáctanos para cualquier duda.</p>
            </div>
            <div className="col-md-4 text-center">
              <div className="footer-contact">
                {storeInfo.business_address && <p><MapPin size={16}/> {storeInfo.business_address}</p>}
                <p><Phone size={16}/> {storeInfo.advisor_phone || 'N/A'}</p>
                <p><Mail size={16}/> soporte@moihub.com</p>
              </div>
            </div>
            <div className="col-md-4 text-center text-md-end">
              <div className="footer-socials">
                <button className="social-btn"><Camera size={18}/></button>
                <button className="social-btn"><Globe size={18}/></button>
                <button className="social-btn"><ShieldCheck size={18}/></button>
              </div>
              <p className="small text-muted mt-3 mb-0">© 2026 Moihub. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chat Widget */}
      {isChatOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          className="chat-window-container"
        >
          <div className="chat-window-glass">
            <div className="chat-header-premium">
              <span className="fw-bold d-flex align-items-center gap-2"><Bot size={18}/> Asistente de {storeInfo.name}</span>
              <button onClick={() => setIsChatOpen(false)} className="chat-close-btn"><X size={20} /></button>
            </div>
            <div className="chat-body-premium">
              <StoreChatWidget slug={slug || ''} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Floating Button */}
      {!isChatOpen && (
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(true)}
          className="floating-chat-trigger"
        >
          <MessageCircle size={30} />
          <div className="btn-ping"></div>
        </motion.button>
      )}
    </div>
  );
}
