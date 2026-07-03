import { useState, useEffect } from 'react';
import { getInvoices, updateInvoiceStatus } from '@services/invoice.service.js';
import '@styles/invoices.css';

const ESTADO_LABELS = {
  emitida: { label: 'Emitida', className: 'badge-emitida' },
  pagada: { label: 'Pagada', className: 'badge-pagada' },
  anulada: { label: 'Anulada', className: 'badge-anulada' },
};

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [filters, setFilters] = useState({ estado: '', fechaDesde: '', fechaHasta: '' });
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const data = await getInvoices(activeFilters);
      setInvoices(data.data || []);
    } catch (err) {
      setError('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleFilter = (e) => { e.preventDefault(); fetchInvoices(); };

  const handleStatusChange = async (invoiceId, estado) => {
    try {
      await updateInvoiceStatus(invoiceId, estado);
      setSuccessMsg('Estado de factura actualizado');
      setSelectedInvoice(null);
      fetchInvoices();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al actualizar la factura');
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="invoices-container">
      <div className="invoices-header">
        <div>
          <h1>🧾 Gestión de Facturas</h1>
          <p className="invoices-subtitle">Historial de todas las facturas generadas</p>
        </div>
      </div>

      {successMsg && <div className="alert-success">✅ {successMsg}</div>}
      {error && <div className="alert-error">❌ {error}</div>}

      {/* Filtros */}
      <form className="invoices-filters" onSubmit={handleFilter}>
        <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })}>
          <option value="">Todos los estados</option>
          <option value="emitida">Emitida</option>
          <option value="pagada">Pagada</option>
          <option value="anulada">Anulada</option>
        </select>
        <input type="date" placeholder="Desde" value={filters.fechaDesde} onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })} />
        <input type="date" placeholder="Hasta" value={filters.fechaHasta} onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })} />
        <button type="submit" className="btn-filter">🔍 Filtrar</button>
        <button type="button" className="btn-clear" onClick={() => { setFilters({ estado: '', fechaDesde: '', fechaHasta: '' }); setTimeout(fetchInvoices, 100); }}>✕ Limpiar</button>
      </form>

      {loading ? (
        <div className="invoices-loading"><div className="spinner"></div><p>Cargando facturas...</p></div>
      ) : invoices.length === 0 ? (
        <div className="invoices-empty"><span className="empty-icon">🧾</span><p>No hay facturas registradas</p></div>
      ) : (
        <div className="invoices-table-wrapper">
          <table className="invoices-table">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>N° Orden</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td><span className="invoice-number">{inv.numeroFactura}</span></td>
                  <td>{formatDate(inv.fechaEmision)}</td>
                  <td>{inv.customer?.user?.nombreCompleto || '—'}</td>
                  <td><span className="order-ref">{inv.order?.numeroOrden || '—'}</span></td>
                  <td>{formatCurrency(inv.subtotal)}</td>
                  <td>{formatCurrency(inv.iva)}</td>
                  <td><strong>{formatCurrency(inv.total)}</strong></td>
                  <td>
                    <span className={`status-badge ${ESTADO_LABELS[inv.estado]?.className}`}>
                      {ESTADO_LABELS[inv.estado]?.label || inv.estado}
                    </span>
                  </td>
                  <td>
                    <button className="btn-view" onClick={() => setSelectedInvoice(inv)}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal detalle / cambio de estado */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-content invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🧾 {selectedInvoice.numeroFactura}</h2>
              <button className="modal-close" onClick={() => setSelectedInvoice(null)}>✕</button>
            </div>
            <div className="invoice-detail">
              <div className="invoice-detail-row"><span>Cliente:</span><strong>{selectedInvoice.customer?.user?.nombreCompleto || '—'}</strong></div>
              <div className="invoice-detail-row"><span>RUT:</span><strong>{selectedInvoice.customer?.user?.rut || '—'}</strong></div>
              <div className="invoice-detail-row"><span>Orden:</span><strong>{selectedInvoice.order?.numeroOrden}</strong></div>
              <div className="invoice-detail-row"><span>Fecha emisión:</span><strong>{formatDate(selectedInvoice.fechaEmision)}</strong></div>
              <hr />
              <div className="invoice-detail-row"><span>Subtotal:</span><strong>{formatCurrency(selectedInvoice.subtotal)}</strong></div>
              <div className="invoice-detail-row"><span>IVA (19%):</span><strong>{formatCurrency(selectedInvoice.iva)}</strong></div>
              <div className="invoice-detail-row total-row"><span>Total:</span><strong>{formatCurrency(selectedInvoice.total)}</strong></div>
              <hr />
              <div className="invoice-status-change">
                <p>Cambiar estado:</p>
                <div className="status-buttons">
                  {['emitida', 'pagada', 'anulada'].map((est) => (
                    <button
                      key={est}
                      className={`btn-status ${selectedInvoice.estado === est ? 'active' : ''}`}
                      onClick={() => handleStatusChange(selectedInvoice.id, est)}
                      disabled={selectedInvoice.estado === est}
                    >
                      {ESTADO_LABELS[est].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
