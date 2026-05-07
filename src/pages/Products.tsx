import React, { useState, useEffect } from 'react';
import { PackageSearch, Plus, X } from 'lucide-react';

interface Product {
  id?: number;
  name: string;
  price: number;
  stock: number;
  category?: string;
}

import { apiFetch } from '../services/api';
const Products: React.FC = () => {
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 2. Estados para el formulario
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '' });

  // 3. Función para traer productos del backend
  const fetchProducts = async () => {
    try {
      const response = await apiFetch(`/api/products`);
      const data = await response.json();
      setProducts(data);
    } catch {
      console.error("Error cargando productos:");
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar al cargar la página
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  // 4. Función para guardar un nuevo producto en el backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    try {
      const response = await apiFetch(`/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock) || 0
        })
      });

      if (response.ok) {
        setFormData({ name: '', price: '', stock: '' }); // Limpiar formulario
        setShowForm(false); // Ocultar formulario
        fetchProducts(); // Recargar la lista visualmente
      }
    } catch {
      alert("Error al guardar el producto");
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch {
      console.error("Error eliminando");
    }
  };

  return (
    <div>
      {/* Cabecera */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title text-gradient">Catálogo de Oferta</h2>
          <p className="text-muted">Agrega o edita lo que la IA de Moihub venderá por ti.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`btn ${showForm ? 'btn-danger' : 'btn-primary'} d-flex align-items-center gap-2`}
        >
          {showForm ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Agregar Producto</>}
        </button>
      </div>

      {/* Formulario Desplegable para Agregar Producto */}
      {showForm && (
        <div className="card p-4 mb-4 border-0 shadow-lg glass-panel">
          <h5 className="mb-3 fw-bold text-white">Nuevo Producto</h5>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label text-muted">Nombre del Producto</label>
              <input 
                type="text" 
                className="form-control bg-transparent text-white border-secondary" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej. Camiseta Voltix"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted">Precio ($)</label>
              <input 
                type="number" 
                className="form-control bg-transparent text-white border-secondary"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted">Stock / Cantidad</label>
              <input 
                type="number" 
                className="form-control bg-transparent text-white border-secondary"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                placeholder="Ej. 10"
              />
            </div>
            <div className="col-12 text-end mt-3">
              <button type="submit" className="btn text-white px-4" style={{background: 'var(--accent-color)'}}>Guardar en Catálogo</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Productos usando tus Tarjetas */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
      ) : products.length === 0 ? (
        <div className="text-center py-5 text-muted bg-light rounded shadow-sm border-0">
          <p className="mb-0">Aún no hay productos en tu catálogo. ¡Agrega el primero!</p>
        </div>
      ) : (
        <div className="row g-4">
          {products.map(product => (
            <div className="col-md-4" key={product.id}>
              <div className="card p-4 h-100 border-0 shadow-lg glass-panel transition">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="bg-light p-3 rounded text-primary">
                    <PackageSearch size={24} />
                  </div>
                  <div>
                    <span className="badge bg-light text-dark me-2">{product.category || 'General'}</span>
                    <button onClick={() => deleteProduct(product.id!)} className="btn btn-sm btn-outline-danger border-0 p-0 px-2"><X size={16}/></button>
                  </div>
                </div>
                <h5 className="fw-bold mb-1 text-white">{product.name}</h5>
                <div className="d-flex justify-content-between align-items-end mt-4">
                  <div>
                    <p className="text-muted mb-0" style={{fontSize: '0.8rem'}}>Precio</p>
                    <span className="fw-bold fs-5 text-primary">${product.price}</span>
                  </div>
                  <div className="text-end">
                    <p className="text-muted mb-0" style={{fontSize: '0.8rem'}}>Stock</p>
                    {/* Logica para mostrar si hay stock o está agotado */}
                    <span className={`fw-medium ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
                      {product.stock > 0 ? `${product.stock} disp.` : 'Agotado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;