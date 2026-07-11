import { useState, useEffect } from 'react';
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '@services/warehouse.service.js';
import { StoreIcon, MapPinIcon, BoxIcon } from '../components/Icons';
import '@styles/warehouses.css';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    ciudad: '',
    region: '',
    capacidad: '',
    activo: true,
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await getWarehouses();
      setWarehouses(data.data || []);
    } catch (err) {
      setError('Error al cargar los almacenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarehouses(); }, []);

  const openModal = (warehouse = null) => {
    setEditingWarehouse(warehouse);
    setFormData(warehouse
      ? { nombre: warehouse.nombre, ubicacion: warehouse.ubicacion || '', ciudad: warehouse.ciudad || '', region: warehouse.region || '', capacidad: warehouse.capacidad || '', activo: warehouse.activo }
      : { nombre: '', ubicacion: '', ciudad: '', region: '', capacidad: '', activo: true }
    );
    setShowModal(true);
    setError(null);
  };

  const closeModal = () => { setShowModal(false); setEditingWarehouse(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, capacidad: formData.capacidad ? parseInt(formData.capacidad) : null };
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, payload);
        setSuccessMsg('Almacén actualizado correctamente');
      } else {
        await createWarehouse(payload);
        setSuccessMsg('Almacén creado correctamente');
      }
      closeModal();
      fetchWarehouses();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al guardar el almacén');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este almacén?')) return;
    try {
      await deleteWarehouse(id);
      setSuccessMsg('Almacén eliminado correctamente');
      fetchWarehouses();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Error al eliminar el almacén');
    }
  };

  return (
    <div className="warehouses-container">
      <div className="warehouses-header">
        <div>
          <h1>Gestión de Almacenes</h1>
          <p className="warehouses-subtitle">Administra los almacenes y bodegas del negocio</p>
        </div>
        <button className="btn-new-warehouse" onClick={() => openModal()}>
          + Nuevo Almacén
        </button>
      </div>

      {successMsg && <div className="alert-success">{successMsg}</div>}
      {error && <div className="alert-error">{error}</div>}

      <div className="warehouses-card">
        {loading ? (
          <div className="warehouses-loading">
            <div className="spinner"></div>
            <p>Cargando almacenes...</p>
          </div>
        ) : warehouses.length === 0 ? (
          <div className="warehouses-empty">
            <StoreIcon size={48} color="#94a3b8" />
            <p>No hay almacenes registrados</p>
            <button className="btn-new-warehouse" onClick={() => openModal()}>Crear primer almacén</button>
          </div>
        ) : (
          <div className="warehouses-grid">
            {warehouses.map((w) => (
              <div key={w.id} className={`warehouse-card ${!w.activo ? 'inactive' : ''}`}>
                <div className="warehouse-card-header">
                  <span className="warehouse-icon-wrapper">
                    <StoreIcon size={24} />
                  </span>
                  <span className={`warehouse-badge ${w.activo ? 'badge-active' : 'badge-inactive'}`}>
                    {w.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <h3>{w.nombre}</h3>
                <div className="warehouse-info">
                  {w.ciudad && (
                    <p>
                      <MapPinIcon size={14} style={{ verticalAlign: 'middle' }} />
                      <span>{w.ciudad}{w.region ? `, ${w.region}` : ''}</span>
                    </p>
                  )}
                  {w.ubicacion && (
                    <p>
                      <MapPinIcon size={14} style={{ verticalAlign: 'middle' }} />
                      <span>{w.ubicacion}</span>
                    </p>
                  )}
                  {w.capacidad && (
                    <p>
                      <BoxIcon size={14} style={{ verticalAlign: 'middle' }} />
                      <span>Capacidad: {w.capacidad.toLocaleString()} unidades</span>
                    </p>
                  )}
                </div>
                <div className="warehouse-actions">
                  <button className="btn-edit" onClick={() => openModal(w)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleDelete(w.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingWarehouse ? 'Editar Almacén' : 'Nuevo Almacén'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="warehouse-form">
              <div className="form-group">
                <label>Nombre del almacén *</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Bodega Central" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ciudad</label>
                  <input type="text" value={formData.ciudad} onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })} placeholder="Concepción" />
                </div>
                <div className="form-group">
                  <label>Región</label>
                  <input type="text" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} placeholder="Bío Bío" />
                </div>
              </div>
              <div className="form-group">
                <label>Dirección / Ubicación</label>
                <input type="text" value={formData.ubicacion} onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })} placeholder="Calle 123, sector..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Capacidad (unidades)</label>
                  <input type="number" value={formData.capacidad} onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })} placeholder="1000" min="0" />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input type="checkbox" checked={formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} />
                    Almacén activo
                  </label>
                </div>
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn-save">{editingWarehouse ? 'Guardar cambios' : 'Crear almacén'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouses;
