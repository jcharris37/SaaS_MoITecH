import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../services/api';
import { useAuth } from '../context/useAuth';
import {
  Plus, Trash2, FileText, CheckCircle, Clock, XCircle,
  Printer, Search, Receipt
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Invoices.css';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: string;
  notes?: string;
  created_at: string;
  items: InvoiceItem[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    Pendiente:  { color: '#f59e0b', icon: <Clock size={12}/> },
    Pagada:     { color: '#10b981', icon: <CheckCircle size={12}/> },
    Anulada:    { color: '#6b7280', icon: <XCircle size={12}/> },
  };
  const s = map[status] ?? { color: '#6b7280', icon: null };
  return (
    <span style={{ background: s.color+'22', color: s.color, border:`1px solid ${s.color}44`,
      borderRadius:20, padding:'3px 10px', fontSize:'0.75rem', fontWeight:700,
      display:'inline-flex', alignItems:'center', gap:'4px' }}>
      {s.icon}{status}
    </span>
  );
};

const EMPTY_ITEM: InvoiceItem = { description: '', quantity: 1, unit_price: 0, subtotal: 0 };

const Invoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({ client_name: '', client_phone: '', client_email: '', notes: '' });
  const [items, setItems] = useState<InvoiceItem[]>([{ ...EMPTY_ITEM }]);

  const taxRate = user?.tax_rate ?? 19;
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const load = async () => {
    try {
      // Forzamos asincronía para evitar warnings de renderizado
      await Promise.resolve();
      setLoading(true);
      const r = await apiFetch('/api/invoices');
      if (r.ok) setInvoices(await r.json());
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    load(); 
  }, []);

  const addItem = () => setItems([...items, { ...EMPTY_ITEM }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  
  const updateItem = (i: number, field: keyof InvoiceItem, val: string | number) => {
    const updated = [...items];
    if (field === 'description') {
      updated[i].description = val as string;
    } else {
      const numVal = typeof val === 'string' ? parseFloat(val) || 0 : val;
      if (field === 'quantity') updated[i].quantity = numVal;
      if (field === 'unit_price') updated[i].unit_price = numVal;
    }
    updated[i].subtotal = updated[i].quantity * updated[i].unit_price;
    setItems(updated);
  };

  const resetForm = () => {
    setForm({ client_name: '', client_phone: '', client_email: '', notes: '' });
    setItems([{ ...EMPTY_ITEM }]);
  };

  const createInvoice = async () => {
    if (!form.client_name.trim()) { alert('Ingresa el nombre del cliente'); return; }
    if (items.every(i => !i.description.trim())) { alert('Agrega al menos un item'); return; }
    setSaving(true);
    try {
      const r = await apiFetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.filter(i => i.description.trim()).map(i => ({
            description: i.description, 
            quantity: Number(i.quantity), 
            unit_price: Number(i.unit_price), 
            subtotal: Number(i.quantity) * Number(i.unit_price)
          }))
        })
      });
      if (!r.ok) throw new Error('Error al crear factura');
      await load();
      setShowModal(false);
      resetForm();
    } catch (e: unknown) {
      const error = e as Error;
      alert(error.message);
    } finally { setSaving(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    await apiFetch(`/api/invoices/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
    });
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
    if (selectedInvoice?.id === id) setSelectedInvoice(prev => prev ? { ...prev, status } : null);
  };

  const deleteInvoice = async (id: number) => {
    if (!confirm('¿Eliminar esta factura?')) return;
    await apiFetch(`/api/invoices/${id}`, { method: 'DELETE' });
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    if (selectedInvoice?.id === id) setSelectedInvoice(null);
  };

  const generatePDF = (inv: Invoice) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // Header background
    doc.setFillColor(15, 15, 25);
    doc.rect(0, 0, pageW, 45, 'F');

    // Logo / Brand
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(user?.name || 'Mi Negocio', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    if (user?.business_address) doc.text(user.business_address, 14, 25);
    if (user?.business_nit) doc.text(`NIT: ${user.business_nit}`, 14, 31);

    // Invoice info right
    doc.setTextColor(234, 88, 12);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', pageW - 14, 16, { align: 'right' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(inv.invoice_number, pageW - 14, 24, { align: 'right' });
    doc.setTextColor(180, 180, 180);
    doc.setFontSize(8);
    doc.text(new Date(inv.created_at).toLocaleDateString('es-CO', { year:'numeric', month:'long', day:'numeric' }), pageW - 14, 31, { align: 'right' });

    // Client info
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURADO A:', 14, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(inv.client_name, 14, 62);
    if (inv.client_phone) doc.text(`Tel: ${inv.client_phone}`, 14, 68);
    if (inv.client_email) doc.text(inv.client_email, 14, 74);

    // Status badge
    const statusColors: Record<string, [number,number,number]> = {
      Pagada: [16,185,129], Pendiente: [245,158,11], Anulada: [107,114,128]
    };
    const sc = statusColors[inv.status] ?? [107,114,128];
    doc.setFillColor(...sc);
    doc.roundedRect(pageW - 55, 50, 41, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(inv.status.toUpperCase(), pageW - 34.5, 57.5, { align: 'center' });

    // Items table
    autoTable(doc, {
      startY: 82,
      head: [['Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: inv.items.map(it => [
        it.description,
        it.quantity.toString(),
        fmt(it.unit_price),
        fmt(it.quantity * it.unit_price)
      ]),
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 15, 25], textColor: [234,88,12], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'center', cellWidth: 20 }, 2: { halign: 'right', cellWidth: 35 }, 3: { halign: 'right', cellWidth: 35 } },
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 150;

    // Totals
    const totalsX = pageW - 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Subtotal:', totalsX - 50, finalY + 10); doc.text(fmt(inv.subtotal), totalsX, finalY + 10, { align: 'right' });
    doc.text(`IVA (${taxRate}%):`, totalsX - 50, finalY + 17); doc.text(fmt(inv.tax_amount), totalsX, finalY + 17, { align: 'right' });

    doc.setDrawColor(220, 220, 220);
    doc.line(totalsX - 50, finalY + 20, totalsX, finalY + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 15, 25);
    doc.text('TOTAL:', totalsX - 50, finalY + 27); doc.text(fmt(inv.total), totalsX, finalY + 27, { align: 'right' });

    if (inv.notes) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Notas: ${inv.notes}`, 14, finalY + 27);
    }

    // Footer
    doc.setFillColor(15, 15, 25);
    doc.rect(0, 275, pageW, 22, 'F');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Generado por Moihub — moihub.com', pageW / 2, 285, { align: 'center' });

    doc.save(`${inv.invoice_number}.pdf`);
  };

  const filtered = invoices.filter(inv => {
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    const matchSearch = inv.client_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPaid = invoices.filter(i => i.status === 'Pagada').reduce((s,i) => s+i.total, 0);
  const totalPending = invoices.filter(i => i.status === 'Pendiente').reduce((s,i) => s+i.total, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="invoices-page">

      {/* Header */}
      <div className="inv-header">
        <div>
          <h2 className="inv-title"><Receipt size={22}/> Facturación</h2>
          <p className="inv-subtitle">Crea, gestiona y descarga facturas para tus clientes.</p>
        </div>
        <button className="btn-new-invoice" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18}/> Nueva Factura
        </button>
      </div>

      {/* Stats */}
      <div className="inv-stats">
        {[
          { label: 'Total Cobrado', value: fmt(totalPaid), color: '#10b981' },
          { label: 'Por Cobrar', value: fmt(totalPending), color: '#f59e0b' },
          { label: 'Total Facturas', value: invoices.length.toString(), color: '#6366f1' },
          { label: 'Pagadas', value: invoices.filter(i=>i.status==='Pagada').length.toString(), color: '#10b981' },
        ].map((s,i) => (
          <div key={i} className="inv-stat-card">
            <p className="inv-stat-label">{s.label}</p>
            <p className="inv-stat-value" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="inv-filters">
        <div className="inv-search">
          <Search size={16}/>
          <input placeholder="Buscar por cliente o número..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="inv-filter-tabs">
          {['all','Pendiente','Pagada','Anulada'].map(s => (
            <button key={s} className={`filter-tab ${filterStatus===s?'active':''}`} onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'Todas' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="inv-table-wrap">
        {loading ? (
          <div className="inv-loading"><div className="spinner-border text-warning"/></div>
        ) : filtered.length === 0 ? (
          <div className="inv-empty">
            <FileText size={48} opacity={0.2}/>
            <p>No hay facturas{filterStatus !== 'all' ? ` con estado "${filterStatus}"` : ''}.</p>
            <button className="btn-new-invoice" onClick={() => { resetForm(); setShowModal(true); }}>
              <Plus size={16}/> Crear primera factura
            </button>
          </div>
        ) : (
          <table className="inv-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} onClick={() => setSelectedInvoice(inv)} className="inv-row">
                  <td className="inv-num">{inv.invoice_number}</td>
                  <td>
                    <div className="inv-client-name">{inv.client_name}</div>
                    {inv.client_phone && <div className="inv-client-phone">{inv.client_phone}</div>}
                  </td>
                  <td className="inv-date">{new Date(inv.created_at).toLocaleDateString('es-CO')}</td>
                  <td className="inv-total">{fmt(inv.total)}</td>
                  <td onClick={e => e.stopPropagation()}><StatusBadge status={inv.status}/></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="inv-actions">
                      <button className="icon-btn" title="Descargar PDF" onClick={() => generatePDF(inv)}><Printer size={15}/></button>
                      {inv.status === 'Pendiente' && (
                        <button className="icon-btn green" title="Marcar Pagada" onClick={() => updateStatus(inv.id,'Pagada')}><CheckCircle size={15}/></button>
                      )}
                      {inv.status !== 'Anulada' && (
                        <button className="icon-btn red" title="Anular" onClick={() => updateStatus(inv.id,'Anulada')}><XCircle size={15}/></button>
                      )}
                      <button className="icon-btn red" title="Eliminar" onClick={() => deleteInvoice(inv.id)}><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div className="inv-detail-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelectedInvoice(null)}>
            <motion.div className="inv-detail-panel" initial={{x:80,opacity:0}} animate={{x:0,opacity:1}} exit={{x:80,opacity:0}} onClick={e=>e.stopPropagation()}>
              <div className="detail-header">
                <div>
                  <h4 className="detail-invoice-num">{selectedInvoice.invoice_number}</h4>
                  <StatusBadge status={selectedInvoice.status}/>
                </div>
                <button className="icon-btn" onClick={() => setSelectedInvoice(null)}>✕</button>
              </div>
              <div className="detail-client">
                <p><strong>{selectedInvoice.client_name}</strong></p>
                {selectedInvoice.client_phone && <p>{selectedInvoice.client_phone}</p>}
                {selectedInvoice.client_email && <p>{selectedInvoice.client_email}</p>}
              </div>
              <table className="detail-items">
                <thead><tr><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {selectedInvoice.items.map((it,i) => (
                    <tr key={i}>
                      <td>{it.description}</td>
                      <td>{it.quantity}</td>
                      <td>{fmt(it.unit_price)}</td>
                      <td>{fmt(it.quantity*it.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="detail-totals">
                <div className="detail-total-row"><span>Subtotal</span><span>{fmt(selectedInvoice.subtotal)}</span></div>
                <div className="detail-total-row"><span>IVA ({taxRate}%)</span><span>{fmt(selectedInvoice.tax_amount)}</span></div>
                <div className="detail-total-row total"><span>TOTAL</span><span>{fmt(selectedInvoice.total)}</span></div>
              </div>
              {selectedInvoice.notes && <p className="detail-notes">📝 {selectedInvoice.notes}</p>}
              <div className="detail-footer-actions">
                <button className="btn-dash-outline-sm" onClick={() => generatePDF(selectedInvoice)}><Printer size={14}/> Descargar PDF</button>
                {selectedInvoice.status === 'Pendiente' && (
                  <button className="btn-dash-primary-sm" onClick={() => updateStatus(selectedInvoice.id,'Pagada')}><CheckCircle size={14}/> Marcar Pagada</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="inv-modal-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowModal(false)}>
            <motion.div className="inv-modal" initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header">
                <h4><Plus size={18}/> Nueva Factura</h4>
                <button className="icon-btn" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                {/* Client */}
                <div className="modal-section">
                  <h6 className="section-label">Datos del Cliente</h6>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nombre *</label>
                      <input className="form-inp" placeholder="Nombre del cliente" value={form.client_name}
                        onChange={e => setForm({...form, client_name: e.target.value})}/>
                    </div>
                    <div className="form-group">
                      <label>Teléfono</label>
                      <input className="form-inp" placeholder="Ej. 3001234567" value={form.client_phone}
                        onChange={e => setForm({...form, client_phone: e.target.value})}/>
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input className="form-inp" placeholder="cliente@email.com" value={form.client_email}
                        onChange={e => setForm({...form, client_email: e.target.value})}/>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="modal-section">
                  <div className="section-header-row">
                    <h6 className="section-label">Servicios / Productos</h6>
                    <button className="btn-add-item" onClick={addItem}><Plus size={14}/> Agregar</button>
                  </div>
                  <div className="items-header">
                    <span>Descripción</span><span>Cant.</span><span>Precio Unit.</span><span>Subtotal</span><span/>
                  </div>
                  {items.map((it, i) => (
                    <div key={i} className="item-row">
                      <input className="form-inp" placeholder="Ej. Corte clásico" value={it.description}
                        onChange={e => updateItem(i,'description',e.target.value)}/>
                      <input className="form-inp" type="number" min="0.1" step="0.1" value={it.quantity}
                        onChange={e => updateItem(i,'quantity',parseFloat(e.target.value)||1)}/>
                      <input className="form-inp" type="number" min="0" value={it.unit_price}
                        onChange={e => updateItem(i,'unit_price',parseFloat(e.target.value)||0)}/>
                      <span className="item-subtotal">{fmt(it.quantity*it.unit_price)}</span>
                      {items.length > 1 && (
                        <button className="icon-btn red" onClick={() => removeItem(i)}><Trash2 size={14}/></button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="modal-totals">
                  <div className="mt-row"><span>Subtotal:</span><span>{fmt(subtotal)}</span></div>
                  <div className="mt-row"><span>IVA ({taxRate}%):</span><span>{fmt(taxAmount)}</span></div>
                  <div className="mt-row total"><span>TOTAL:</span><span>{fmt(total)}</span></div>
                </div>

                {/* Notes */}
                <div className="modal-section">
                  <label className="section-label">Notas (opcional)</label>
                  <textarea className="form-inp" rows={2} placeholder="Observaciones, método de pago, etc."
                    value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}/>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-dash-outline-sm" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn-dash-primary-sm" onClick={createInvoice} disabled={saving}>
                  {saving ? <><div className="spin"/>Guardando...</> : <><FileText size={14}/> Guardar Factura</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Invoices;
