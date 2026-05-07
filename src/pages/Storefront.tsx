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
}

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const response = await fetch(`${API_URL}/api/store/${slug}/products`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

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
          <span className="navbar-brand fw-bold fs-4">
            <span className="text-white text-capitalize">{slug}</span><span className="text-gradient ms-2">Store</span>
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
          <h2 className="dashboard-title text-gradient display-5 fw-bold">Catálogo Oficial</h2>
          <p className="text-muted fs-5">Explora nuestros productos y chatea con nuestro bot para cualquier duda.</p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : (
          <div className="row g-4">
            {products.map((product) => (
              <div className="col-md-4" key={product.id}>
                <motion.div whileHover={{y: -5}} className="card p-4 h-100 border-0 shadow-lg glass-panel transition">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="p-3 rounded text-white" style={{background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)'}}>
                      <PackageSearch size={24} />
                    </div>
                    <span className="badge text-white" style={{background: 'rgba(255,255,255,0.1)'}}>{product.category || 'General'}</span>
                  </div>
                  
                  <h5 className="fw-bold mb-1 text-white">{product.name}</h5>
                  
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