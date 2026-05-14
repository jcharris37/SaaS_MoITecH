import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PackageSearch, MessageCircle, X, Bot } from 'lucide-react';
import StoreChatWidget from '../components/StoreChatWidget';
import { motion } from 'framer-motion';

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
}

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [apptForm, setApptForm] = useState({ client_name: '', client_phone: '', date: '', time: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        
        // Fetch info
        const infoRes = await fetch(`${API_URL}/api/store/${slug}/info`);
        const infoData = await infoRes.json();
        setStoreInfo(infoData);
        
        if (infoData.theme_color) {
          document.documentElement.style.setProperty('--accent-color', infoData.theme_color);
        }

        // Fetch items based on type
        if (infoData.business_type === 'appointments') {
          const provRes = await fetch(`${API_URL}/api/store/${slug}/providers`);
          setProviders(await provRes.json());
        } else {
          const prodRes = await fetch(`${API_URL}/api/store/${slug}/products`);
          setProducts(await prodRes.json());
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
    if (!selectedProvider || !apptForm.client_name || !apptForm.date || !apptForm.time) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
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
    } catch (e) {
      alert('Error agendando cita');
    }
  };

  const handleBuyWhatsApp = (productName: string) => {
    // Redirige al WhatsApp del negocio. (Mock number for now)
    const text = encodeURIComponent(`Hola, quisiera comprar: ${productName}. Vi esto en tu tienda online.`);
    window.open(`https://wa.me/573000000000?text=${text}`, '_blank');
  };

  return (
    <div className="min-vh-100 font-sans pb-5 position-relative overflow-hidden" style={{backgroundColor: 'var(--bg-color)', color: 'var(--text-main)'}}>
      {/* Background Orbs */}
      <div className="glow-orb" style={{top: '10%', left: '20%', background: 'radial-gradient(circle, rgba(255,94,0,0.15) 0%, transparent 70%)'}}></div>
      <div className="glow-orb" style={{bottom: '20%', right: '10%', background: 'radial-gradient(circle, rgba(147,51,234,0.15) 0%, transparent 70%)'}}></div>

      {/* Navbar estilo Moihub Store */}
      <nav className="navbar navbar-dark glass-panel sticky-top mb-4 py-3" style={{borderBottom: '1px solid var(--border-color)'}}>
        <div className="container">
          <span className="navbar-brand fw-bold fs-4 d-flex align-items-center gap-2">
            {storeInfo?.logo_url ? (
               <img src={storeInfo.logo_url} alt="Logo" style={{height: '40px', objectFit: 'contain'}} />
            ) : (
               <><span className="text-white text-capitalize">{slug}</span><span className="text-gradient ms-2">Store</span></>
            )}
          </span>
          <button 
            onClick={() => setIsChatOpen(true)}
            className="btn d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm text-white"
            style={{background: 'linear-gradient(135deg, var(--accent-color), #ea580c)', border: 'none'}}
          >
            <MessageCircle size={18} /> Asistente IA
          </button>
        </div>
      </nav>

      <div className="container mt-5 position-relative z-1">
        <div className="mb-5 text-center">
          <h2 className="dashboard-title text-gradient display-5 fw-bold">{storeInfo?.business_type === 'appointments' ? 'Reserva tu Cita' : 'Catálogo Oficial'}</h2>
          <p className="text-muted fs-5">{storeInfo?.business_type === 'appointments' ? 'Selecciona al profesional y agenda tu espacio.' : 'Explora nuestros productos y chatea con nuestro bot para cualquier duda.'}</p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : storeInfo?.business_type === 'appointments' ? (
          <div className="row g-4 justify-content-center">
            {selectedProvider ? (
              <div className="col-md-6">
                <div className="card p-4 border-0 shadow-lg glass-panel text-white">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    {selectedProvider.profile_image && <img src={selectedProvider.profile_image} className="rounded-circle" style={{width: 60, height: 60, objectFit: 'cover'}} />}
                    <div>
                      <h4 className="mb-0">Agendar con {selectedProvider.name}</h4>
                      <button className="btn btn-link text-muted p-0 text-decoration-none" onClick={() => setSelectedProvider(null)}>Cambiar profesional</button>
                    </div>
                  </div>
                  <form onSubmit={handleBookAppointment}>
                    <div className="mb-3">
                      <label>Tu Nombre</label>
                      <input type="text" className="form-control" style={{background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none'}} value={apptForm.client_name} onChange={e => setApptForm({...apptForm, client_name: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                      <label>Tu Teléfono</label>
                      <input type="text" className="form-control" style={{background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none'}} value={apptForm.client_phone} onChange={e => setApptForm({...apptForm, client_phone: e.target.value})} required />
                    </div>
                    <div className="row mb-4">
                      <div className="col-6">
                        <label>Fecha</label>
                        <input type="date" className="form-control" style={{background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', colorScheme: 'dark'}} value={apptForm.date} onChange={e => setApptForm({...apptForm, date: e.target.value})} required />
                      </div>
                      <div className="col-6">
                        <label>Hora</label>
                        <input type="time" className="form-control" style={{background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', colorScheme: 'dark'}} value={apptForm.time} onChange={e => setApptForm({...apptForm, time: e.target.value})} required />
                      </div>
                    </div>
                    <button type="submit" className="btn w-100 fw-bold text-white" style={{background: 'linear-gradient(135deg, var(--accent-color), #ea580c)'}}>Confirmar Cita</button>
                  </form>
                </div>
              </div>
            ) : (
              providers.map(prov => (
                <div className="col-md-3 text-center" key={prov.id}>
                  <motion.div whileHover={{y: -5, scale: 1.05}} className="card p-4 h-100 border-0 shadow-lg glass-panel transition" onClick={() => setSelectedProvider(prov)} style={{cursor: 'pointer'}}>
                    {prov.profile_image ? (
                      <img src={prov.profile_image} className="rounded-circle mx-auto mb-3" style={{width: 80, height: 80, objectFit: 'cover'}} />
                    ) : (
                      <div className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center bg-secondary" style={{width: 80, height: 80}}><span className="fs-1 text-white">{prov.name[0]}</span></div>
                    )}
                    <h5 className="text-white fw-bold mb-0">{prov.name}</h5>
                    <p className="text-gradient small mt-2 fw-bold">Seleccionar</p>
                  </motion.div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="row g-4">
            {products.map((product) => (
              <div className="col-md-4" key={product.id}>
                <motion.div whileHover={{y: -5}} className="card p-4 h-100 border-0 shadow-lg glass-panel transition">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="img-fluid rounded mb-3" style={{height: '200px', objectFit: 'cover', width: '100%'}} />
                  ) : (
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="p-3 rounded text-white" style={{background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)'}}>
                        <PackageSearch size={24} />
                      </div>
                      <span className="badge text-white" style={{background: 'rgba(255,255,255,0.1)'}}>{product.category || 'General'}</span>
                    </div>
                  )}
                  
                  <h5 className="fw-bold mb-1 text-white">{product.name}</h5>
                  {product.description && <p className="text-muted small mb-0">{product.description}</p>}
                  
                  <div className="d-flex justify-content-between align-items-end mt-4 mb-4">
                    <div>
                      <p className="text-muted mb-0" style={{fontSize: '0.8rem'}}>Precio</p>
                      <span className="fw-bold fs-4 text-gradient">${product.price}</span>
                    </div>
                    <div className="text-end">
                      <p className="text-muted mb-0" style={{fontSize: '0.8rem'}}>Disponibilidad</p>
                      <span className={`fw-medium ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
                        {product.stock > 0 ? `${product.stock} und` : 'Agotado'}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleBuyWhatsApp(product.name)}
                    className="btn w-100 rounded-3 fw-bold text-white mt-auto"
                    style={{border: '1px solid var(--accent-color)', background: 'rgba(255,94,0,0.1)'}}
                  >
                    Comprar por WhatsApp
                  </button>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Widget de Chat Flotante */}
      {isChatOpen && (
        <motion.div 
          initial={{opacity: 0, y: 50, scale: 0.9}}
          animate={{opacity: 1, y: 0, scale: 1}}
          className="position-fixed bottom-0 end-0 p-3" 
          style={{ zIndex: 1050, width: '100%', maxWidth: '400px' }}
        >
          <div className="card shadow-lg border-0 rounded-4 overflow-hidden glass-panel">
            <div className="card-header text-white d-flex justify-content-between align-items-center p-3" style={{background: 'linear-gradient(135deg, var(--accent-color), #9333ea)', borderBottom: 'none'}}>
              <span className="fw-bold d-flex align-items-center gap-2"><Bot size={20}/> Bot de {slug}</span>
              <button 
                onClick={() => setIsChatOpen(false)} 
                className="btn btn-sm text-white border-0 p-0"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-0" style={{height: '400px'}}>
              <StoreChatWidget slug={slug || ''} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Botón flotante rápido (si el chat está cerrado) */}
      {!isChatOpen && (
        <motion.button 
          whileHover={{scale: 1.1}}
          whileTap={{scale: 0.9}}
          onClick={() => setIsChatOpen(true)}
          className="btn position-fixed bottom-0 end-0 m-4 rounded-circle shadow-lg d-flex align-items-center justify-content-center text-white"
          style={{ width: '60px', height: '60px', zIndex: 1000, background: 'linear-gradient(135deg, var(--accent-color), #ea580c)', border: 'none' }}
        >
          <MessageCircle size={30} />
        </motion.button>
      )}
    </div>
  );
}
