import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';
import { useToast } from '../context/ToastContext';
import { User, Calendar as CalendarIcon, Clock, X, Plus, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Provider {
  id: number;
  name: string;
  profile_image?: string;
  tenant_id: number;
}

interface Appointment {
  id: number;
  client_name: string;
  client_phone: string;
  date: string;
  time: string;
  provider_id: number;
  status: string;
}

export default function Appointments() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduler State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [visibleProviders, setVisibleProviders] = useState<number[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', profile_image: '' });
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [provRes, apptRes] = await Promise.all([
        apiFetch('/api/providers'),
        apiFetch('/api/appointments')
      ]);

      const provs: Provider[] = await provRes.json();
      const appts: Appointment[] = await apptRes.json();

      setProviders(provs);
      setAppointments(appts);
      setVisibleProviders(provs.map((p) => p.id));

    } catch (e: any) {
      showToast(e.message || "Error al cargar datos", "error");

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };
    load();
  }, [fetchData]);

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);

      const API_URL = import.meta.env.VITE_API_URL || '';

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error subiendo imagen');
      }

      const data = await response.json();

      setNewProvider((prev) => ({
        ...prev,
        profile_image: data.url
      }));

    } catch (error) {
      console.error(error);
      showToast('Error subiendo imagen de perfil', 'error');

    } finally {
      setUploading(false);
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProvider.name.trim()) return;

    try {
      await apiFetch('/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProvider)
      });

      setNewProvider({
        name: '',
        profile_image: ''
      });

      setShowModal(false);
      showToast('Profesional creado', 'success');

      await fetchData();

    } catch (error: any) {
      showToast(error.message || 'Error al crear profesional', 'error');
    }
  };

  const toggleProvider = (id: number) => {
    if (visibleProviders.includes(id)) {
      setVisibleProviders(visibleProviders.filter(pid => pid !== id));
    } else {
      setVisibleProviders([...visibleProviders, id]);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDayName = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  };

  const nextDay = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 1);
    setCurrentDate(next);
  };

  const prevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 1);
    setCurrentDate(prev);
  };

  const setToday = () => {
    setCurrentDate(new Date());
  };

  // Filter appointments for the current day
  const todaysAppointments = appointments.filter(a => a.date === formatDate(currentDate));

  // Time slots from 08:00 to 20:00
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pend')) return { bg: '#eab308', text: '#713f12' }; // Yellow
    if (s.includes('conf')) return { bg: '#10b981', text: '#064e3b' }; // Green
    if (s.includes('canc')) return { bg: '#ef4444', text: '#7f1d1d' }; // Red
    return { bg: '#8b5cf6', text: '#4c1d95' }; // Purple default
  };

  const calculateTop = (timeStr: string) => {
    // timeStr format "14:30"
    const [h, m] = timeStr.split(':').map(Number);
    const startHour = 8;
    const endHour = 20;
    const hourHeight = 80; // matches CSS row height

    // Clamp hour within visible range
    const clampedH = Math.min(Math.max(h, startHour), endHour);
    const offsetHours = clampedH - startHour;
    const offsetMins = (clampedH < endHour ? m : 0) / 60;
    return (offsetHours + offsetMins) * hourHeight;
  };

  const activeProvs = providers.filter(p => visibleProviders.includes(p.id));

  // Border color for inline styles (React does not support !important in style objects)
  const borderColor = 'rgba(255,255,255,0.1)';

  return (
    <div className="container-fluid py-4 h-100 d-flex flex-column" style={{ minHeight: 'calc(100vh - 100px)' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title text-gradient fw-bold mb-0">Scheduler Premium</h2>
          <p className="text-muted small">Gestión centralizada de citas y personal</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn text-white px-4 py-2 fw-bold d-flex align-items-center gap-2 rounded-pill shadow-lg"
          style={{ background: 'linear-gradient(135deg, var(--accent-color), #9333ea)', border: 'none' }}
        >
          <Plus size={20} /> Añadir Profesional
        </button>
      </div>

      <div className="row flex-grow-1 g-4">
        {/* SIDEBAR CALENDAR CONTROLS */}
        <div className="col-lg-3 col-xl-2 d-flex flex-column gap-4">
          <div className="card border-0 shadow-lg glass-panel p-4">
            <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
              <CalendarIcon size={18} /> Navegación
            </h6>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <button className="btn btn-sm btn-outline-secondary text-white border-0" onClick={prevDay}>
                <ChevronLeft size={20} />
              </button>
              <div className="text-center">
                <span className="d-block fw-bold text-gradient fs-5">{getDayName(currentDate)}</span>
                <span className="text-muted small">{currentDate.toLocaleDateString()}</span>
              </div>
              <button className="btn btn-sm btn-outline-secondary text-white border-0" onClick={nextDay}>
                <ChevronRight size={20} />
              </button>
            </div>
            <button
              onClick={setToday}
              className="btn w-100 btn-sm text-white rounded-3 shadow-sm"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)' }}
            >
              Ir a Hoy
            </button>
          </div>

          <div className="card border-0 shadow-lg glass-panel p-4 flex-grow-1">
            <h6 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
              <User size={18} /> Staff
            </h6>
            <div className="d-flex flex-column gap-3 overflow-auto" style={{ maxHeight: '300px' }}>
              {providers.map(p => (
                <div key={p.id} className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    {p.profile_image ? (
                      <img src={p.profile_image} className="rounded-circle" style={{ width: 35, height: 35, objectFit: 'cover' }} alt={p.name} />
                    ) : (
                      <div className="rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: 35, height: 35, background: 'var(--accent-color)' }}>
                        {p.name[0]}
                      </div>
                    )}
                    <span className="text-white small fw-medium">{p.name}</span>
                  </div>
                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={visibleProviders.includes(p.id)}
                      onChange={() => toggleProvider(p.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>
              ))}
              {providers.length === 0 && <p className="text-muted small">No hay profesionales registrados.</p>}
            </div>

            <hr style={{ borderColor: 'var(--border-color)' }} />

            <h6 className="text-white fw-bold mb-3 text-muted small">Estado de Citas</h6>
            <div className="d-flex flex-column gap-2">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-circle" style={{ width: 12, height: 12, background: '#eab308' }}></div>
                <span className="text-muted small">Pendiente</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-circle" style={{ width: 12, height: 12, background: '#10b981' }}></div>
                <span className="text-muted small">Confirmado</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-circle" style={{ width: 12, height: 12, background: '#ef4444' }}></div>
                <span className="text-muted small">Cancelado</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CALENDAR GRID */}
        <div className="col-lg-9 col-xl-10 d-flex flex-column">
          <div className="card border-0 shadow-lg glass-panel flex-grow-1 overflow-hidden d-flex flex-column">

            {loading ? (
              <div className="d-flex justify-content-center align-items-center h-100">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : activeProvs.length === 0 ? (
              <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted p-5">
                <CalendarIcon size={48} className="mb-3 opacity-50" />
                <h5>Ningún profesional seleccionado</h5>
                <p>Selecciona personal del panel izquierdo para ver sus citas.</p>
              </div>
            ) : (
              <div className="d-flex flex-column h-100">
                {/* Header Row (Providers) */}
                <div className="d-flex border-bottom" style={{ borderColor, background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ width: '60px', flexShrink: 0, borderRight: `1px solid ${borderColor}` }}></div>
                  {activeProvs.map(p => (
                    <div key={p.id} className="flex-grow-1 text-center py-3" style={{ borderRight: `1px solid ${borderColor}`, minWidth: '150px' }}>
                      {p.profile_image ? (
                        <img src={p.profile_image} className="rounded-circle mb-2 shadow-sm" style={{ width: 40, height: 40, objectFit: 'cover' }} alt={p.name} />
                      ) : (
                        <div className="rounded-circle d-flex align-items-center justify-content-center text-white mx-auto mb-2 shadow-sm" style={{ width: 40, height: 40, background: 'linear-gradient(135deg, var(--accent-color), #9333ea)' }}>
                          {p.name[0]}
                        </div>
                      )}
                      <h6 className="text-white mb-0 fw-bold">{p.name}</h6>
                    </div>
                  ))}
                </div>

                {/* Grid Body */}
                <div className="position-relative flex-grow-1 overflow-auto bg-transparent">
                  {/* Background Grid Lines */}
                  <div className="position-absolute w-100" style={{ top: 0, left: 0, pointerEvents: 'none' }}>
                    {hours.map(h => (
                      <div key={h} className="d-flex" style={{ height: '80px', borderBottom: `1px solid ${borderColor}` }}>
                        <div style={{ width: '60px', flexShrink: 0 }} className="text-muted small text-end pe-2 pt-2 fw-bold">
                          {h.toString().padStart(2, '0')}:00
                        </div>
                        {activeProvs.map(p => (
                          <div key={p.id} className="flex-grow-1" style={{ borderRight: `1px solid ${borderColor}`, minWidth: '150px' }}></div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Appointments Layer */}
                  <div className="position-absolute w-100 d-flex" style={{ top: 0, left: 0, bottom: 0 }}>
                    <div style={{ width: '60px', flexShrink: 0 }}></div>
                    {activeProvs.map(p => {
                      const provAppts = todaysAppointments.filter(a => a.provider_id === p.id);
                      return (
                        <div key={p.id} className="flex-grow-1 position-relative" style={{ minWidth: '150px' }}>
                          <AnimatePresence>
                            {provAppts.map(appt => {
                              const colors = getStatusColor(appt.status);
                              return (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  key={appt.id}
                                  className="position-absolute w-100 px-1"
                                  style={{ top: `${calculateTop(appt.time)}px`, height: '76px', zIndex: 10 }}
                                >
                                  <div
                                    className="h-100 rounded-3 shadow-sm p-2 d-flex flex-column justify-content-between overflow-hidden"
                                    style={{ background: colors.bg, color: colors.text, borderLeft: `4px solid ${colors.text}` }}
                                  >
                                    <div className="fw-bold lh-1" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                      {appt.client_name}
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                      <span className="small fw-medium" style={{ fontSize: '0.75rem' }}><Clock size={12} className="me-1" />{appt.time}</span>
                                      {appt.status.toLowerCase().includes('conf') && <CheckCircle2 size={14} />}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NUEVO PROFESIONAL */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75"
              style={{ zIndex: 1040 }}
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="position-fixed top-50 start-50 translate-middle"
              style={{ zIndex: 1050, width: '90%', maxWidth: '400px' }}
            >
              <div className="card border-0 shadow-lg glass-panel p-4 rounded-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="text-white fw-bold mb-0">Registrar Profesional</h5>
                  <button className="btn btn-sm btn-link text-muted p-0" onClick={() => setShowModal(false)}><X size={24} /></button>
                </div>
                <form onSubmit={handleAddProvider}>
                  <div className="mb-4 text-center">
                    <div className="position-relative d-inline-block">
                      {newProvider.profile_image ? (
                        <img src={newProvider.profile_image} className="rounded-circle shadow" style={{ width: 100, height: 100, objectFit: 'cover' }} alt="Preview" />
                      ) : (
                        <div className="rounded-circle shadow d-flex align-items-center justify-content-center" style={{ width: 100, height: 100, background: 'rgba(255,255,255,0.05)', border: '2px dashed var(--border-color)' }}>
                          <User size={40} className="text-muted" />
                        </div>
                      )}
                      <label className="btn btn-sm btn-primary position-absolute bottom-0 end-0 rounded-circle" style={{ background: 'var(--accent-color)', border: 'none' }}>
                        <Plus size={16} />
                        <input type="file" accept="image/*" className="d-none" onChange={handleUploadImage} disabled={uploading} />
                      </label>
                    </div>
                    {uploading && <p className="text-muted small mt-2">Subiendo imagen...</p>}
                  </div>

                  <div className="mb-4">
                    <label className="text-muted small mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      className="form-control rounded-3 py-2 text-white"
                      placeholder="Ej. Joseph Charris"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}
                      value={newProvider.name}
                      onChange={e => setNewProvider({ ...newProvider, name: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="btn text-white w-100 rounded-pill py-2 fw-bold shadow" style={{ background: 'linear-gradient(135deg, var(--accent-color), #ea580c)', border: 'none' }} disabled={uploading}>
                    Crear Profesional
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}