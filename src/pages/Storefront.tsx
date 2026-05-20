import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, ShoppingCart, Calendar, Clock, MapPin, 
  Phone, PackageSearch, X, Bot,
  Mail, ArrowRight, Star, ShieldCheck, Users, Camera, Globe,
  UtensilsCrossed, Dumbbell, GraduationCap, Award,
  Plus, Minus, Trash2
} from 'lucide-react';
import { API_URL } from '../services/api';
import StoreChatWidget from '../components/StoreChatWidget';
import { useToast } from '../context/ToastContext';
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
  ui_layout: {
    has_cart: boolean;
    has_appointments: boolean;
    has_categories: boolean;
    is_gym: boolean;
    is_education: boolean;
    is_restaurant: boolean;
    hero_badge: string;
    hero_title: string;
    hero_subtitle: string;
    provider_label: string;
    patient_label: string;
    button_label: string;
  };
}

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  
  const { showToast } = useToast();
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', address: '', notes: '' });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [apptForm, setApptForm] = useState({ client_name: '', client_phone: '', date: '', time: '', service_name: '' });
  const [busyTimes, setBusyTimes] = useState<string[]>([]);
  const [fetchingBusy, setFetchingBusy] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      showToast('Este producto no tiene stock disponible', 'error');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`No puedes agregar más unidades de ${product.name} (límite de stock alcanzado)`, 'warning');
          return prev;
        }
        showToast(`${product.name} agregado al carrito`, 'success');
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      showToast(`${product.name} agregado al carrito`, 'success');
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const target = prev.find((item) => item.product.id === productId);
      if (target) {
        showToast(`${target.product.name} eliminado del carrito`, 'info');
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty < 1) return item;
          if (newQty > item.product.stock) {
            showToast(`Límite de stock alcanzado para ${item.product.name}`, 'warning');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Tu carrito está vacío', 'error');
      return;
    }
    if (!checkoutForm.name || !checkoutForm.phone) {
      showToast('Por favor, completa los campos requeridos', 'warning');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/store/${slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: checkoutForm.name,
          client_phone: checkoutForm.phone,
          client_address: checkoutForm.address,
          notes: checkoutForm.notes,
          items: cart.map(item => ({ product_id: item.product.id, quantity: item.quantity }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.detail || 'Error al procesar el pedido', 'error');
        return;
      }

      const data = await response.json();
      window.open(data.whatsapp_url, '_blank');
      
      setCart([]);
      setIsCartOpen(false);
      setCheckoutForm({ name: '', phone: '', address: '', notes: '' });
      showToast('Pedido procesado correctamente', 'success');
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('Ocurrió un error al conectar con el servidor', 'error');
    }
  };

  useEffect(() => {
    const fetchBusyTimes = async () => {
      if (!slug || !selectedProvider || !apptForm.date) {
        setBusyTimes([]);
        return;
      }
      try {
        setFetchingBusy(true);
        const res = await fetch(`${API_URL}/api/store/${slug}/providers/${selectedProvider.id}/busy-times?date=${apptForm.date}`);
        if (res.ok) {
          const times = await res.json();
          setBusyTimes(times);
        }
      } catch (err) {
        console.error("Error fetching busy times:", err);
      } finally {
        setFetchingBusy(false);
      }
    };
    fetchBusyTimes();
  }, [slug, selectedProvider, apptForm.date]);

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

        const isAppointmentBased = ['appointments', 'health', 'services'].includes(infoData.business_type || '');
        if (isAppointmentBased) {
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
        showToast('Reserva agendada exitosamente. Te esperamos.', 'success');
        setApptForm({ client_name: '', client_phone: '', date: '', time: '', service_name: '' });
        setSelectedProvider(null);
      } else {
        showToast('Error al agendar la cita. Inténtalo de nuevo.', 'error');
      }
    } catch {
      showToast('Error de conexión al agendar la cita.', 'error');
    }
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

  const bt = storeInfo.business_type || 'retail';

  // ────────────────────────────────────────────────────────
  // DYNAMIC HEADER DETAILS
  // ────────────────────────────────────────────────────────
  const { ui_layout } = storeInfo;
  const heroBadge = ui_layout?.hero_badge || `Oficial de ${storeInfo.name}`;
  const heroTitle = ui_layout?.hero_title || "Catálogo Exclusivo";
  const heroSubtitle = ui_layout?.hero_subtitle || "Explora nuestra colección seleccionada de productos de alta calidad.";

  // Categories helper for Restaurants and Retail (grouped case-insensitively and trimmed)
  const categoryMap = new Map<string, string>();
  products.forEach(p => {
    const rawCat = (p.category || 'Otros').trim();
    if (rawCat) {
      const key = rawCat.toLowerCase();
      // Keep the first casing encountered
      if (!categoryMap.has(key)) {
        categoryMap.set(key, rawCat);
      }
    }
  });
  const categories = ['todos', ...Array.from(categoryMap.values())];

  const filteredProducts = selectedCategory === 'todos' 
    ? products 
    : products.filter(p => (p.category || 'Otros').trim().toLowerCase() === selectedCategory.trim().toLowerCase());


  return (
    <div className="store-page">
      {/* Decorative Orbs */}
      <div className="premium-orb orb-1"></div>
      <div className="premium-orb orb-2"></div>
      
      {/* Navbar */}
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
          <div className="d-flex align-items-center gap-3">
            {ui_layout?.has_cart && (
              <button 
                onClick={() => setIsCartOpen(true)}
                className="btn-cart-nav position-relative"
                aria-label="Ver carrito"
              >
                <ShoppingCart size={20} />
                {cart.length > 0 && (
                  <span className="cart-badge-count">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            )}
            <motion.button 
              initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              onClick={() => setIsChatOpen(true)}
              className="btn-ia-assistant"
            >
              <Bot size={18} /> <span>Asistente IA</span>
            </motion.button>
          </div>
        </div>
      </nav>

      <main className="container pt-5 pb-5 position-relative">
        {/* Hero Section */}
        <motion.section 
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="text-center mb-5 mt-4"
        >
          <div className="badge-premium mb-3">{heroBadge}</div>
          <h1 className="hero-title">{heroTitle}</h1>
          <p className="hero-subtitle mx-auto">{heroSubtitle}</p>
        </motion.section>

        {/* Content Section */}
        <section className="store-content">
          {/* APPOINTMENT FLUID FLOW (Appointments, Health, Services) */}
          {ui_layout?.has_appointments ? (
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
                            <span className="text-white d-flex align-items-center justify-content-center h-100 fs-4 fw-bold">{selectedProvider.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="mb-0 text-white fw-bold">
                            {bt === 'health' ? `Agendar con el Dr(a). ${selectedProvider.name}` : `Agendar con ${selectedProvider.name}`}
                          </h4>
                          <button className="btn-change-prov text-accent border-0 bg-transparent p-0 small mt-1" onClick={() => setSelectedProvider(null)}>Cambiar profesional</button>
                        </div>
                      </div>
                      <form onSubmit={handleBookAppointment} className="booking-form">
                        <div className="row g-3">
                          <div className="col-12">
                            <label><Users size={14}/> {ui_layout?.patient_label || 'Nombre Completo'}</label>
                            <input type="text" placeholder="Ej. Juan Pérez" value={apptForm.client_name} onChange={e => setApptForm({...apptForm, client_name: e.target.value})} required />
                          </div>
                          <div className="col-12">
                            <label><Phone size={14}/> Teléfono de Contacto</label>
                            <input type="text" placeholder="Ej. 300 123 4567" value={apptForm.client_phone} onChange={e => setApptForm({...apptForm, client_phone: e.target.value})} required />
                          </div>
                          
                          {/* Dynamic dropdown for services based on Business Type */}
                          <div className="col-12">
                            <label><Award size={14}/> Tipo de Servicio</label>
                            <select 
                              className="form-select border-0 bg-secondary text-white w-100 p-2 rounded" 
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff' }}
                              value={apptForm.service_name} 
                              onChange={e => setApptForm({...apptForm, service_name: e.target.value})}
                              required
                            >
                              <option value="" disabled style={{background:'#0a0a0f'}}>-- Selecciona una opción --</option>
                              {bt === 'health' && (
                                <>
                                  <option value="Consulta General" style={{background:'#0a0a0f'}}>Consulta General / Control</option>
                                  <option value="Pediatría" style={{background:'#0a0a0f'}}>Consulta de Pediatría</option>
                                  <option value="Odontología" style={{background:'#0a0a0f'}}>Odontología General</option>
                                  <option value="Dermatología" style={{background:'#0a0a0f'}}>Consulta Dermatológica</option>
                                  <option value="Nutrición" style={{background:'#0a0a0f'}}>Evaluación Nutricional</option>
                                </>
                              )}
                              {bt === 'services' && (
                                <>
                                  <option value="Instalación y Montaje" style={{background:'#0a0a0f'}}>Instalación y Montaje</option>
                                  <option value="Mantenimiento Preventivo" style={{background:'#0a0a0f'}}>Mantenimiento Preventivo</option>
                                  <option value="Reparación Técnica" style={{background:'#0a0a0f'}}>Reparación Técnica a Domicilio</option>
                                  <option value="Revisión y Diagnóstico" style={{background:'#0a0a0f'}}>Revisión y Diagnóstico General</option>
                                </>
                              )}
                              {bt === 'appointments' && (
                                <>
                                  <option value="Corte de Cabello" style={{background:'#0a0a0f'}}>Corte de Cabello / Styling</option>
                                  <option value="Afeitado y Barba" style={{background:'#0a0a0f'}}>Corte y Cuidado de Barba</option>
                                  <option value="Manicura y Pedicura" style={{background:'#0a0a0f'}}>Manicura y Pedicura Premium</option>
                                  <option value="Tratamiento Capilar" style={{background:'#0a0a0f'}}>Masaje e Hidratación Capilar</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div className="col-12">
                            <label><Calendar size={14}/> Fecha</label>
                            <input type="date" value={apptForm.date} onChange={e => setApptForm({...apptForm, date: e.target.value, time: ''})} required />
                          </div>
                          <div className="col-12 mt-2">
                            <label className="d-block mb-2"><Clock size={14}/> Selecciona un Horario Disponible</label>
                            {!apptForm.date ? (
                              <div className="p-3 text-center text-muted rounded" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <small>⚠️ Selecciona una fecha primero para ver horarios</small>
                              </div>
                            ) : fetchingBusy ? (
                              <div className="text-center p-3 text-muted">
                                <span className="spinner-border spinner-border-sm me-2"></span> Cargando horarios...
                              </div>
                            ) : (
                              <div className="time-slots-grid">
                                {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'].map(slot => {
                                  const isBusy = busyTimes.some(bt => bt.startsWith(slot) || slot.startsWith(bt));
                                  const isSelected = apptForm.time === slot;
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => setApptForm({ ...apptForm, time: slot })}
                                      className={`time-slot-btn ${isSelected ? 'selected' : ''} ${isBusy ? 'busy' : ''}`}
                                    >
                                      {slot}
                                      {isBusy && <span className="busy-dot">Ocupado</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <button type="submit" className="btn-confirm-booking mt-4" disabled={!apptForm.time || !apptForm.service_name}>
                          {ui_layout?.button_label || 'Confirmar Reserva'} <ArrowRight size={18} />
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
                    {providers.length === 0 ? (
                      <div className="text-center p-5 text-muted col-12">
                        <Users size={48} opacity={0.3} className="mb-3"/>
                        <p>No se registran profesionales de atención.</p>
                      </div>
                    ) : (
                      providers.map(prov => (
                        <div className="col-md-4 col-sm-6" key={prov.id}>
                          <motion.div 
                            whileHover={{ y: -10 }} 
                            className="provider-card"
                            onClick={() => setSelectedProvider(prov)}
                          >
                            <div className="provider-avatar">
                              {prov.profile_image ? (
                                <img src={getImageUrl(prov.profile_image)} alt={prov.name} />
                              ) : (
                                <span className="text-white d-flex align-items-center justify-content-center h-100 fs-3 fw-bold">{prov.name[0]}</span>
                              )}
                            </div>
                            <h5 className="text-white fw-bold mb-1">{prov.name}</h5>
                            <span className="text-accent small fw-bold">
                              {ui_layout?.provider_label || 'Profesional'}
                            </span>
                          </motion.div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : null}

          {/* 4. DIGITAL RESTAURANT MENU layout */}
          {ui_layout?.is_restaurant ? (
            <div>
              {/* Category selector */}
              <div className="d-flex justify-content-center gap-2 mb-5 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`btn rounded-pill border px-4 py-2 text-capitalize ${selectedCategory === cat ? 'bg-primary text-white border-primary' : 'bg-transparent text-white border-secondary'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="row g-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center p-5 text-muted col-12">
                    <UtensilsCrossed size={48} opacity={0.3} className="mb-3"/>
                    <p>No hay platos ni preparaciones cargadas en esta categoría.</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div className="col-lg-4 col-md-6" key={product.id}>
                      <motion.div whileHover={{ y: -6 }} className="product-card-premium">
                        <div className="product-img-wrapper" onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>
                          {product.image_url ? (
                            <img src={getImageUrl(product.image_url)} alt={product.name} />
                          ) : (
                            <div className="img-placeholder d-flex align-items-center justify-content-center h-100 bg-dark"><UtensilsCrossed size={40} className="text-muted"/></div>
                          )}
                          {product.stock <= 5 && product.stock > 0 && <span className="stock-tag">¡Pocas unidades!</span>}
                          {product.stock === 0 && <span className="stock-tag out">Agotado hoy</span>}
                        </div>
                        <div className="product-info-premium">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h5 className="product-name">{product.name}</h5>
                            <span className="badge bg-dark text-accent border border-secondary">{product.category || 'Otros'}</span>
                          </div>
                          <p className="product-desc">{product.description || 'Delicioso plato preparado con ingredientes frescos y selectos.'}</p>
                          <div className="d-flex justify-content-between align-items-center mt-auto pt-3">
                            <div className="price-tag">{fmt(product.price)}</div>
                            <button 
                              onClick={() => addToCart(product)}
                              className="btn-buy-wa"
                              disabled={product.stock === 0}
                            >
                              <ShoppingCart size={16} /> Añadir al carrito
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {/* 5. GYM PLAN SELECTOR AND SCHEDULE LAYOUT */}
          {ui_layout?.is_gym ? (
            <div>
              <div className="row g-4 justify-content-center mb-5">
                {products.length === 0 ? (
                  <div className="text-center p-5 text-muted col-12">
                    <Dumbbell size={48} opacity={0.3} className="mb-3"/>
                    <p>No se registran planes ni membresías en el catálogo.</p>
                  </div>
                ) : (
                  products.map((product) => (
                    <div className="col-md-4 col-sm-6" key={product.id}>
                      <motion.div 
                        whileHover={{ y: -8 }} 
                        className="product-card-premium" 
                        style={{ border: '2px solid rgba(255,255,255,0.05)' }}
                      >
                        <div className="product-info-premium p-4 d-flex flex-column text-center">
                          <div className="text-accent mb-2"><Award size={36}/></div>
                          <h4 className="fw-bold text-white mb-3">{product.name}</h4>
                          <h2 className="display-6 fw-bold text-white mb-3" style={{color: 'var(--accent-color)'}}>{fmt(product.price)}<span className="fs-6 text-muted">/mes</span></h2>
                          <p className="small text-muted mb-4">{product.description || 'Acceso completo a áreas de fuerza, cardio y clases grupales.'}</p>
                          
                          <button 
                            onClick={() => addToCart(product)}
                            className="btn-confirm-booking mt-auto w-100"
                            disabled={product.stock === 0}
                            style={{ background: 'linear-gradient(135deg, var(--accent-color), #7c3aed)' }}
                          >
                            <ShoppingCart size={16}/> Añadir Plan
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  ))
                )}
              </div>

              {/* Gym Class Timetable */}
              <div className="booking-card mt-5">
                <h4 className="text-white fw-bold mb-4 d-flex align-items-center gap-3"><Clock size={20} className="text-accent"/> Cronograma de Clases Dirigidas</h4>
                <div className="table-responsive">
                  <table className="table table-dark table-hover border-secondary">
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Lunes</th>
                        <th>Martes</th>
                        <th>Miércoles</th>
                        <th>Jueves</th>
                        <th>Viernes</th>
                        <th>Sábado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>06:00 AM</td>
                        <td>CrossFit</td>
                        <td>Spinning</td>
                        <td>CrossFit</td>
                        <td>Spinning</td>
                        <td>CrossFit</td>
                        <td>Funcional</td>
                      </tr>
                      <tr>
                        <td>08:00 AM</td>
                        <td>Cardio Box</td>
                        <td>Yoga</td>
                        <td>Zumba</td>
                        <td>Yoga</td>
                        <td>Cardio Box</td>
                        <td>Calistenia</td>
                      </tr>
                      <tr>
                        <td>06:00 PM</td>
                        <td>Funcional</td>
                        <td>Spinning</td>
                        <td>Pilates</td>
                        <td>Spinning</td>
                        <td>Funcional</td>
                        <td>-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {/* 6. EDUCATION ACADEMY COURSE CATALOG */}
          {ui_layout?.is_education ? (
            <div className="row g-4">
              {products.length === 0 ? (
                <div className="text-center p-5 text-muted col-12">
                  <GraduationCap size={48} opacity={0.3} className="mb-3"/>
                  <p>No se registran cursos activos para pre-inscripción.</p>
                </div>
              ) : (
                products.map((product) => (
                  <div className="col-lg-4 col-md-6" key={product.id}>
                    <motion.div whileHover={{ y: -6 }} className="product-card-premium">
                      <div className="product-img-wrapper" style={{height:'180px', cursor: 'pointer'}} onClick={() => setSelectedProduct(product)}>
                        {product.image_url ? (
                          <img src={getImageUrl(product.image_url)} alt={product.name} />
                        ) : (
                          <div className="img-placeholder d-flex align-items-center justify-content-center h-100 bg-dark"><GraduationCap size={48} className="text-muted"/></div>
                        )}
                        <span className="stock-tag bg-success">Inscripciones Abiertas</span>
                      </div>
                      <div className="product-info-premium p-4 d-flex flex-column">
                        <h5 className="product-name fw-bold text-white mb-2">{product.name}</h5>
                        <p className="product-desc mb-3 small">{product.description || 'Adquiere nuevas competencias con clases online, talleres prácticos y certificación oficial.'}</p>
                        
                        <div className="mt-3 p-3 rounded" style={{background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)'}}>
                          <div className="d-flex justify-content-between small text-muted mb-2"><span>Modalidad:</span><span className="text-white fw-bold">Virtual / En Vivo</span></div>
                          <div className="d-flex justify-content-between small text-muted"><span>Certificado:</span><span className="text-white fw-bold">Acreditado</span></div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-4">
                          <div>
                            <span className="text-muted d-block small">Costo del Curso</span>
                            <div className="price-tag fs-4">{fmt(product.price)}</div>
                          </div>
                          <button 
                            onClick={() => addToCart(product)}
                            className="btn-buy-wa btn-outline-primary"
                            disabled={product.stock === 0}
                          >
                            <ShoppingCart size={16} className="me-1" /> Añadir Curso
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {/* 7. STANDARD RETAIL / COMMERCE CATALOG OR FALLBACK / OTHER */}
          {(!ui_layout?.is_restaurant && !ui_layout?.is_gym && !ui_layout?.is_education && !ui_layout?.has_appointments) ? (
            <div>
              {/* Category tabs */}
              {products.length > 0 && categories.length > 2 && (
                <div className="d-flex justify-content-center gap-2 mb-5 flex-wrap">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`btn rounded-pill border px-4 py-2 text-capitalize ${selectedCategory === cat ? 'bg-primary text-white border-primary' : 'bg-transparent text-white border-secondary'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
              <div className="row g-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center p-5 text-muted col-12">
                    <PackageSearch size={48} opacity={0.3} className="mb-3"/>
                    <p>No se registran productos en este catálogo.</p>
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div className="col-lg-4 col-md-6" key={product.id}>
                      <motion.div whileHover={{ y: -10 }} className="product-card-premium">
                        <div className="product-img-wrapper" onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>
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
                          <div className="d-flex justify-content-between align-items-center mt-auto pt-3">
                            <div className="price-tag">{fmt(product.price)}</div>
                            <button 
                              onClick={() => addToCart(product)}
                              className="btn-buy-wa"
                              disabled={product.stock === 0}
                            >
                              <ShoppingCart size={16} /> Añadir al carrito
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
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
              <p className="small text-muted">Tu satisfacción es nuestra prioridad. Contáctanos para cualquier duda o consulta.</p>
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
                <button className="social-btn" title="Instagram"><Camera size={18}/></button>
                <button className="social-btn" title="Web"><Globe size={18}/></button>
                <button className="social-btn" title="Certificado"><ShieldCheck size={18}/></button>
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

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="product-detail-modal glass-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close-btn" onClick={() => setSelectedProduct(null)}>
                <X size={24} />
              </button>
              <div className="row g-0 h-100">
                <div className="col-md-6 modal-img-container">
                  {selectedProduct.image_url ? (
                    <img src={getImageUrl(selectedProduct.image_url)} alt={selectedProduct.name} className="modal-img" />
                  ) : (
                    <div className="modal-img-placeholder d-flex align-items-center justify-content-center h-100 bg-dark">
                      {bt === 'restaurant' ? (
                        <UtensilsCrossed size={64} className="text-muted" />
                      ) : bt === 'education' ? (
                        <GraduationCap size={64} className="text-muted" />
                      ) : (
                        <PackageSearch size={64} className="text-muted" />
                      )}
                    </div>
                  )}
                </div>
                <div className="col-md-6 p-4 d-flex flex-column justify-content-between">
                  <div>
                    <span className="badge bg-dark text-accent border border-secondary mb-3 text-capitalize">
                      {selectedProduct.category || 'General'}
                    </span>
                    <h3 className="modal-product-name fw-bold text-white mb-2">{selectedProduct.name}</h3>
                    <p className="modal-product-desc text-muted mb-4">
                      {selectedProduct.description || 'Sin descripción detallada disponible.'}
                    </p>

                    <div className="p-3 rounded mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                      <div className="d-flex justify-content-between small text-muted mb-2">
                        <span>Disponibilidad:</span>
                        <span className={`fw-bold ${selectedProduct.stock > 0 ? 'text-success' : 'text-danger'}`}>
                          {selectedProduct.stock > 0 ? `${selectedProduct.stock} unidades` : 'Agotado'}
                        </span>
                      </div>
                      {bt === 'education' && (
                        <div className="d-flex justify-content-between small text-muted">
                          <span>Modalidad:</span>
                          <span className="text-white fw-bold">Virtual / Certificado</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-3 border-top border-secondary">
                    <div>
                      <span className="text-muted d-block small">Precio</span>
                      <div className="modal-price-tag">{fmt(selectedProduct.price)}</div>
                    </div>
                    <button
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="btn-buy-wa fs-6 px-4 py-3"
                      disabled={selectedProduct.stock === 0}
                    >
                      <ShoppingCart size={18} className="me-2" />{' '}
                      Añadir al carrito
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Trigger */}
      {!isCartOpen && !isChatOpen && cart.length > 0 && !['appointments', 'health', 'services'].includes(bt) && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCartOpen(true)}
          className="floating-cart-trigger"
          aria-label="Abrir carrito"
        >
          <ShoppingCart size={28} />
          <span className="floating-cart-badge">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </motion.button>
      )}

      {/* Shopping Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="cart-overlay"
              onClick={() => setIsCartOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="cart-drawer glass-panel"
            >
              <div className="cart-header">
                <h4 className="text-white fw-bold m-0 d-flex align-items-center gap-2">
                  <ShoppingCart size={22} className="text-accent" /> Mi Carrito
                </h4>
                <button onClick={() => setIsCartOpen(false)} className="cart-close-btn-round" aria-label="Cerrar carrito">
                  <X size={20} />
                </button>
              </div>

              <div className="cart-body">
                {cart.length === 0 ? (
                  <div className="empty-cart-view">
                    <ShoppingCart size={64} className="text-muted mb-3" />
                    <p className="text-muted">Tu carrito está vacío</p>
                    <button onClick={() => setIsCartOpen(false)} className="btn-continue-shopping mt-2">
                      Ver catálogo
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="cart-items-list">
                      {cart.map((item) => (
                        <div key={item.product.id} className="cart-item">
                          <div className="cart-item-img-container">
                            {item.product.image_url ? (
                              <img src={getImageUrl(item.product.image_url)} alt={item.product.name} />
                            ) : (
                              <div className="cart-item-placeholder">
                                <PackageSearch size={20} />
                              </div>
                            )}
                          </div>
                          <div className="cart-item-details">
                            <h6 className="cart-item-name">{item.product.name}</h6>
                            <span className="cart-item-price">{fmt(item.product.price)}</span>
                            <div className="cart-item-qty-row">
                              <div className="qty-controls">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.product.id, -1)}
                                  className="qty-btn"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="qty-val">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.product.id, 1)}
                                  className="qty-btn"
                                  disabled={item.quantity >= item.product.stock}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.product.id)}
                                className="cart-remove-btn"
                                title="Eliminar producto"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="cart-checkout-section mt-4">
                      <div className="cart-total-row d-flex justify-content-between text-white fw-bold mb-3 fs-5">
                        <span>Total:</span>
                        <span className="text-accent">{fmt(cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0))}</span>
                      </div>

                      <form onSubmit={handleCheckout} className="cart-checkout-form">
                        <h6 className="text-white border-bottom border-secondary pb-2 mb-3">Datos de Entrega</h6>
                        <div className="mb-2">
                          <label className="form-label text-muted small mb-1">Nombre Completo *</label>
                          <input
                            type="text"
                            className="form-control bg-dark border-secondary text-white text-sm"
                            placeholder="Ej. Juan Pérez"
                            value={checkoutForm.name}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label text-muted small mb-1">Teléfono *</label>
                          <input
                            type="tel"
                            className="form-control bg-dark border-secondary text-white text-sm"
                            placeholder="Ej. 3001234567"
                            value={checkoutForm.phone}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                            required
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label text-muted small mb-1">Dirección de Entrega</label>
                          <input
                            type="text"
                            className="form-control bg-dark border-secondary text-white text-sm"
                            placeholder="Ej. Calle 10 #20-30"
                            value={checkoutForm.address}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label text-muted small mb-1">Notas u Observaciones</label>
                          <textarea
                            className="form-control bg-dark border-secondary text-white text-sm"
                            placeholder="Ej. Dejar en recepción, sin condimentos, etc."
                            rows={2}
                            value={checkoutForm.notes}
                            onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                          />
                        </div>

                        <button type="submit" className="btn-confirm-booking w-100">
                          <MessageCircle size={18} /> Enviar Pedido por WhatsApp
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
