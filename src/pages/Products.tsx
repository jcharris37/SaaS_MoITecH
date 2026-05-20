import React, { useState, useEffect } from 'react';
import { PackageSearch, Plus, X, Camera, Pencil, Check } from 'lucide-react';
import { apiFetch, API_URL } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Product {
  id?: number;
  name: string;
  price: number;
  stock: number;
  category?: string;
  image_url?: string;
  description?: string;
}

// Selector de categoría: muestra las existentes + opción para crear una nueva
interface CategorySelectProps {
  value: string;
  onChange: (val: string) => void;
  existingCategories: string[];
  inputClassName?: string;
  selectClassName?: string;
  size?: 'sm' | 'normal';
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  existingCategories,
  inputClassName = '',
  selectClassName = '',
  size = 'normal',
}) => {
  const isNew = value !== '' && !existingCategories.includes(value) && value !== '__new__';
  const [showNew, setShowNew] = useState(isNew);
  const [newCat, setNewCat] = useState(isNew ? value : '');

  const selectVal = showNew ? '__new__' : (existingCategories.includes(value) ? value : (existingCategories[0] || 'General'));

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__new__') {
      setShowNew(true);
      setNewCat('');
      onChange('');
    } else {
      setShowNew(false);
      onChange(e.target.value);
    }
  };

  const handleNewInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCat(e.target.value);
    onChange(e.target.value);
  };

  const sizeClass = size === 'sm' ? 'form-select-sm form-control-sm' : '';

  return (
    <div className="d-flex flex-column gap-1">
      <select
        className={`form-select ${sizeClass} ${selectClassName}`}
        value={selectVal}
        onChange={handleSelect}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          borderRadius: size === 'sm' ? '8px' : '10px',
        }}
      >
        {existingCategories.map(cat => (
          <option key={cat} value={cat} style={{ background: '#1a1a2e', color: '#fff' }}>{cat}</option>
        ))}
        <option value="__new__" style={{ background: '#1a1a2e', color: 'var(--accent-color)' }}>
          ＋ Nueva categoría...
        </option>
      </select>
      {showNew && (
        <input
          type="text"
          className={`${inputClassName}`}
          value={newCat}
          onChange={handleNewInput}
          placeholder="Escribe el nombre de la nueva categoría"
          autoFocus
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--accent-color)',
            color: '#fff',
            borderRadius: size === 'sm' ? '8px' : '10px',
            padding: size === 'sm' ? '0.3rem 0.6rem' : '0.5rem 0.75rem',
            outline: 'none',
          }}
        />
      )}
    </div>
  );
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // States for add form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: 'General', description: '' });
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // States for inline editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ name: string; price: string; stock: string; category: string; description: string }>({
    name: '', price: '', stock: '', category: '', description: ''
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Derive unique sorted categories from existing products
  const existingCategories = Array.from(
    new Map(
      products
        .map(p => (p.category || 'General').trim())
        .filter(Boolean)
        .map(c => [c.toLowerCase(), c])
    ).values()
  ).sort();

  // Ensure 'General' is always available
  const categoryOptions = existingCategories.length > 0
    ? (existingCategories.includes('General') ? existingCategories : ['General', ...existingCategories])
    : ['General'];

  const getImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
  };

  const fetchProducts = async () => {
    try {
      const response = await apiFetch(`/api/products`);
      const data = await response.json();
      setProducts(data);
    } catch (err: any) {
      showToast(err.message || "Error al cargar productos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    try {
      const token = localStorage.getItem('token') || '';
      const r = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: fd,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Error uploading');
      const data = await r.json();
      setImageUrl(data.url);
    } catch {
      showToast('Error subiendo foto de producto', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;
    try {
      await apiFetch(`/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock) || 0,
          category: (formData.category || 'General').trim(),
          description: formData.description,
          image_url: imageUrl
        })
      });
      setFormData({ name: '', price: '', stock: '', category: 'General', description: '' });
      setImageUrl('');
      setShowForm(false);
      showToast('Producto guardado exitosamente', 'success');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar el producto', 'error');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
      showToast('Producto eliminado', 'success');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || "Error al eliminar producto", "error");
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id!);
    setEditData({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category || 'General',
      description: product.description || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (product: Product) => {
    if (!editData.name || !editData.price) return;
    setSaving(true);
    try {
      await apiFetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          price: parseFloat(editData.price),
          stock: parseInt(editData.stock) || 0,
          category: (editData.category || 'General').trim(),
          description: editData.description,
          image_url: product.image_url
        })
      });
      setEditingId(null);
      showToast('Producto actualizado exitosamente', 'success');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar el producto', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Cabecera */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title text-gradient">Catálogo de Oferta</h2>
          <p className="text-muted">Agrega o edita los productos con foto y descripción que se mostrarán en tu tienda.</p>
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
              <input type="text" className="form-control bg-transparent text-white border-secondary"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej. Camiseta Voltix" required />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted">Precio ($)</label>
              <input type="number" className="form-control bg-transparent text-white border-secondary"
                value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0.00" required />
            </div>
            <div className="col-md-4">
              <label className="form-label text-muted">Stock / Cantidad</label>
              <input type="number" className="form-control bg-transparent text-white border-secondary"
                value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})}
                placeholder="Ej. 10" />
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">Categoría</label>
              <CategorySelect
                value={formData.category}
                onChange={(val) => setFormData({...formData, category: val})}
                existingCategories={categoryOptions}
                inputClassName="form-control bg-transparent text-white"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label text-muted">Descripción</label>
              <input type="text" className="form-control bg-transparent text-white border-secondary"
                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ej. De algodón premium con diseño exclusivo" />
            </div>
            <div className="col-12 mt-3">
              <label className="form-label text-muted d-block">Foto del Producto</label>
              <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleImageUpload} />
              <div onClick={() => fileRef.current?.click()} className="p-4 rounded text-center transition"
                style={{ border: '2px dashed rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', borderRadius: '12px' }}>
                {imageUrl ? (
                  <div className="d-flex flex-column align-items-center">
                    <img src={getImageUrl(imageUrl)} alt="Preview" style={{ maxHeight: '120px', borderRadius: '8px', objectFit: 'contain' }} />
                    <span className="text-success small mt-2">✓ Imagen cargada. Click para cambiar.</span>
                  </div>
                ) : uploading ? (
                  <div className="spinner-border text-primary" role="status"></div>
                ) : (
                  <div className="text-muted d-flex flex-column align-items-center gap-2">
                    <Camera size={32} />
                    <span>Haga clic para subir la foto del producto</span>
                  </div>
                )}
              </div>
            </div>
            <div className="col-12 text-end mt-3">
              <button type="submit" className="btn text-white px-4" style={{background: 'var(--accent-color)'}}>Guardar en Catálogo</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Productos */}
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
              <div className="card h-100 border-0 shadow-lg glass-panel overflow-hidden p-0" style={{ borderRadius: '16px' }}>

                {product.image_url ? (
                  <div style={{ height: '180px', width: '100%', overflow: 'hidden' }}>
                    <img src={getImageUrl(product.image_url)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div className="d-flex justify-content-center align-items-center bg-dark" style={{ height: '180px', opacity: 0.5 }}>
                    <PackageSearch size={48} className="text-muted" />
                  </div>
                )}

                <div className="p-4">
                  {editingId === product.id ? (
                    /* ── MODO EDICIÓN ── */
                    <div className="d-flex flex-column gap-2">
                      <input className="form-control form-control-sm bg-transparent text-white border-secondary"
                        value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Nombre" />
                      <div className="d-flex gap-2">
                        <div className="flex-grow-1">
                          <label className="text-muted" style={{fontSize:'0.72rem'}}>Precio ($)</label>
                          <input type="number" className="form-control form-control-sm bg-transparent border-secondary fw-bold"
                            style={{color:'#f97316', fontSize:'1rem'}}
                            value={editData.price} onChange={e => setEditData({...editData, price: e.target.value})} />
                        </div>
                        <div className="flex-grow-1">
                          <label className="text-muted" style={{fontSize:'0.72rem'}}>Stock</label>
                          <input type="number" className="form-control form-control-sm bg-transparent text-white border-secondary"
                            value={editData.stock} onChange={e => setEditData({...editData, stock: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="text-muted" style={{fontSize:'0.72rem'}}>Categoría</label>
                        <CategorySelect
                          value={editData.category}
                          onChange={val => setEditData({...editData, category: val})}
                          existingCategories={categoryOptions}
                          inputClassName="form-control form-control-sm bg-transparent text-white mt-1"
                          size="sm"
                        />
                      </div>
                      <input className="form-control form-control-sm bg-transparent text-muted border-secondary"
                        value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} placeholder="Descripción" />
                      <div className="d-flex gap-2 mt-1">
                        <button className="btn btn-sm text-white flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                          style={{background:'var(--accent-color)', border:'none'}}
                          onClick={() => saveEdit(product)} disabled={saving}>
                          {saving ? <span className="spinner-border spinner-border-sm"/> : <><Check size={14}/> Guardar</>}
                        </button>
                        <button className="btn btn-sm btn-outline-secondary flex-grow-1" onClick={cancelEdit}>
                          <X size={14}/> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── MODO VISTA ── */
                    <>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-light text-dark">{product.category || 'General'}</span>
                        <div className="d-flex gap-2">
                          <button 
                            onClick={() => startEdit(product)} 
                            className="btn btn-sm border-0 p-0 px-1" 
                            style={{ color: 'var(--accent-color)', background: 'transparent' }}
                            title="Editar"
                          >
                            <Pencil size={16}/>
                          </button>
                          <button 
                            onClick={() => deleteProduct(product.id!)} 
                            className="btn btn-sm border-0 p-0 px-1" 
                            style={{ color: '#ef4444', background: 'transparent' }}
                            title="Eliminar"
                          >
                            <X size={18}/>
                          </button>
                        </div>
                      </div>
                      <h5 className="fw-bold mb-1 text-white">{product.name}</h5>
                      {product.description && (
                        <p className="text-muted small mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.8rem' }}>
                          {product.description}
                        </p>
                      )}
                      <div className="d-flex justify-content-between align-items-end mt-3">
                        <div>
                          <p className="text-muted mb-0" style={{fontSize: '0.8rem'}}>Precio</p>
                          <span className="fw-bold fs-5 text-primary">${product.price}</span>
                        </div>
                        <div className="text-end">
                          <p className="text-muted mb-0" style={{fontSize: '0.8rem'}}>Stock</p>
                          <span className={`fw-medium ${product.stock > 0 ? 'text-success' : 'text-danger'}`}>
                            {product.stock > 0 ? `${product.stock} disp.` : 'Agotado'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
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