import React from 'react';
import { Server, Activity, DollarSign, Shield } from 'lucide-react';

const Admin: React.FC = () => {
  return (
    <div>
      <div className="mb-4">
        <h2 className="dashboard-title text-danger">Panel SaaS (Súper Admin)</h2>
        <p className="text-muted">Gestión global de inquilinos y negocios suscritos a Moihub.</p>
      </div>

      <div className="row g-4 mb-5">
        <div className="col-md-3">
          <div className="card p-4 d-flex flex-row align-items-center gap-3 border-start border-4 border-primary">
            <div className="bg-light p-3 rounded text-primary"><Activity size={24}/></div>
            <div>
              <p className="text-muted mb-1 fs-6">Negocios Activos</p>
              <h4 className="mb-0 fw-bold">128</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-4 d-flex flex-row align-items-center gap-3 border-start border-4 border-success">
             <div className="bg-light p-3 rounded text-success"><DollarSign size={24}/></div>
            <div>
              <p className="text-muted mb-1 fs-6">MRR (Mensual)</p>
              <h4 className="mb-0 fw-bold">$2,560</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
           <div className="card p-4 d-flex flex-row align-items-center gap-3 border-start border-4 border-warning">
             <div className="bg-light p-3 rounded text-warning"><Server size={24}/></div>
            <div>
              <p className="text-muted mb-1 fs-6">Carga API (Tokens)</p>
              <h4 className="mb-0 fw-bold">1.2M</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold m-0 d-flex align-items-center gap-2"><Shield size={20} className="text-danger"/> Inquilinos (Tenants)</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID Negocio</th>
                <th>Nombre</th>
                <th>Plan</th>
                <th>Chats IA Este Mes</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-muted">#TEN-001</td>
                <td className="fw-bold">Barbería El Centro</td>
                <td><span className="badge bg-dark">Premium ($20)</span></td>
                <td>4,500 / 10,000</td>
                <td><span className="text-success fw-medium">● Operativo</span></td>
                <td><button className="btn btn-sm btn-outline-secondary">Gestionar</button></td>
              </tr>
              <tr>
                <td className="text-muted">#TEN-002</td>
                <td className="fw-bold">Tienda María</td>
                <td><span className="badge bg-primary">Pro ($10)</span></td>
                <td>1,200 / 5,000</td>
                <td><span className="text-success fw-medium">● Operativo</span></td>
                <td><button className="btn btn-sm btn-outline-secondary">Gestionar</button></td>
              </tr>
               <tr>
                <td className="text-muted">#TEN-003</td>
                <td className="fw-bold">Hamburguesas JS</td>
                <td><span className="badge bg-secondary">Básico ($5)</span></td>
                <td>950 / 1,000</td>
                <td><span className="text-warning fw-medium">● Límite cerca</span></td>
                <td><button className="btn btn-sm btn-outline-secondary">Gestionar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
