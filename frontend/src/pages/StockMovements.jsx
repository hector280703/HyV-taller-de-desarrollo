import { useState, useEffect } from 'react';
import { getStockMovements, createManualMovement } from '@services/stockMovement.service.js';
import { getWarehouses } from '@services/warehouse.service.js';
import { SearchIcon, FileTextIcon, BoxIcon } from '../components/Icons';
import '@styles/stockMovements.css';

const TIPO_CONFIG = {
  entrada: { label: 'Entrada', plural: 'Entradas', className: 'tipo-entrada' },
  salida: { label: 'Salida', plural: 'Salidas', className: 'tipo-salida' },
  ajuste: { label: 'Ajuste', plural: 'Ajustes', className: 'tipo-ajuste' },
  devolucion: { label: 'Devolución', plural: 'Devoluciones', className: 'tipo-devolucion' },
};

const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ tipo: '', fechaDesde: '', fechaHasta: '' });
  const [formData, setFormData] = useState({ productId: '', warehouseId: '', tipo: 'entrada', cantidad: '', motivo: '' });

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const activeFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const data = await getStockMovements(activeFilters);
      setMovements(data.data || []);
    } catch {
      setError('Error al cargar movimientos de stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
    getWarehouses().then((d) => setWarehouses(d.data || [])).catch(() => {});
  }, []);

  const handleFilter = (e) => { e.preventDefault(); fetchMovements(); };

  const handleCreateMovement = async (e) => {
    e.preventDefault();
    try {
      await createManualMovement({
        productId: parseInt(formData.productId),
        warehouseId: formData.warehouseId ? parseInt(formData.warehouseId) : null,
        tipo: formData.tipo,
        cantidad: parseInt(formData.cantidad),
        motivo: formData.motivo,
      });
      setSuccessMsg('Movimiento registrado exitosamente');
      setShowModal(false);
      setFormData({ productId: '', warehouseId: '', tipo: 'entrada', cantidad: '', motivo: '' });
      fetchMovements();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al registrar el movimiento');
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="stock-movements-container">
      <div className="stock-movements-header">
        <div>
          <h1>Movimientos de Stock</h1>
          <p className="movements-subtitle">Historial completo de entradas, salidas y ajustes de inventario</p>
        </div>
        <button className="btn-new-movement" onClick={() => setShowModal(true)}>+ Movimiento Manual</button>
      </div>

      {successMsg && <div className="alert-success">{successMsg}</div>}
      {error && <div className="alert-error">{error}</div>}

      <div className="movements-card">
        {/* Resumen por tipo */}
        <div className="movements-summary">
          {Object.entries(TIPO_CONFIG).map(([tipo, config]) => (
            <div key={tipo} className={`summary-card ${config.className}`}>
              <div className="summary-icon-wrapper">
                <BoxIcon size={24} />
              </div>
              <div>
                <p className="summary-count">{movements.filter((m) => m.tipo === tipo).length}</p>
                <p className="summary-label">{config.plural}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <form className="movements-filters" onSubmit={handleFilter}>
          <select value={filters.tipo} onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}>
            <option value="">Todos los tipos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
            <option value="devolucion">Devolución</option>
          </select>
          <input type="date" value={filters.fechaDesde} onChange={(e) => setFilters({ ...filters, fechaDesde: e.target.value })} />
          <input type="date" value={filters.fechaHasta} onChange={(e) => setFilters({ ...filters, fechaHasta: e.target.value })} />
          <button type="submit" className="btn-filter">
            <SearchIcon size={14} color="#fff" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Filtrar
          </button>
          <button type="button" className="btn-clear" onClick={() => { setFilters({ tipo: '', fechaDesde: '', fechaHasta: '' }); setTimeout(fetchMovements, 100); }}>Limpiar</button>
        </form>

        {loading ? (
          <div className="movements-loading"><div className="spinner"></div><p>Cargando movimientos...</p></div>
        ) : movements.length === 0 ? (
          <div className="movements-empty">
            <BoxIcon size={48} color="#94a3b8" />
            <p>No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="movements-table-wrapper">
            <table className="movements-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Producto</th>
                  <th>Almacén</th>
                  <th>Cantidad</th>
                  <th>Stock Anterior</th>
                  <th>Stock Nuevo</th>
                  <th>Motivo</th>
                  <th>Referencia</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const config = TIPO_CONFIG[m.tipo] || {};
                  return (
                    <tr key={m.id}>
                      <td>
                        <span className={`tipo-badge ${config.className}`}>
                          {config.label}
                        </span>
                      </td>
                      <td>{m.product?.nombre || `#${m.product?.id}`}</td>
                      <td>{m.warehouse?.nombre || <span className="text-muted">Sin almacén</span>}</td>
                      <td className={m.tipo === 'salida' ? 'qty-negative' : 'qty-positive'}>
                        {m.tipo === 'salida' ? '-' : '+'}{m.cantidad}
                      </td>
                      <td>{m.cantidadAnterior}</td>
                      <td><strong>{m.cantidadNueva}</strong></td>
                      <td>{m.motivo || '—'}</td>
                      <td>{m.referencia ? <span className="ref-badge">{m.referencia}</span> : '—'}</td>
                      <td>{formatDate(m.creadoEn)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal movimiento manual */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Movimiento Manual</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateMovement} className="movement-form">
              <div className="form-group">
                <label>ID del Producto *</label>
                <input type="number" value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })} placeholder="ID del producto" required min="1" />
                <small>Puedes encontrar el ID en la sección de Inventario</small>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de movimiento *</label>
                  <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}>
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                    <option value="ajuste">Ajuste (nuevo valor absoluto)</option>
                    <option value="devolucion">Devolución</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cantidad *</label>
                  <input type="number" value={formData.cantidad} onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })} placeholder="0" required min="1" />
                </div>
              </div>
              <div className="form-group">
                <label>Almacén</label>
                <select value={formData.warehouseId} onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}>
                  <option value="">Sin almacén específico</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Motivo</label>
                <input type="text" value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} placeholder="Ej: Compra a proveedor, ajuste de inventario..." />
              </div>
              {formData.tipo === 'ajuste' && (
                <div className="ajuste-info">
                  Para <strong>Ajuste</strong>, la cantidad ingresada será el <strong>nuevo stock total</strong> del producto.
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Registrar movimiento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockMovements;
