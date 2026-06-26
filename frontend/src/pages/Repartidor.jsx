import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, updateOrderStatus } from '@services/order.service';
import { logout } from '@services/auth.service';
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from '@helpers/sweetAlert';
import { formatPrice } from '@helpers/formatData';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@styles/repartidor.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
}

function Repartidor() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('listo_para_envio');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [mapCenter, setMapCenter] = useState([-37.1653, -73.1835]);
  const navigate = useNavigate();

  const parseCoordinates = (direccion) => {
    const match = direccion?.match(/\[📍\s*(-?\d+\.\d+),\s*(-?\d+\.\d+)\]/);
    if (match) {
      return [parseFloat(match[1]), parseFloat(match[2])];
    }
    return null;
  };

  const user = JSON.parse(sessionStorage.getItem('usuario'));

  useEffect(() => {
    if (!user || user.rol !== 'repartidor') {
      showErrorAlert('Acceso denegado', 'No tienes permisos para acceder a esta página');
      navigate('/');
      return;
    }
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const filters = filter === 'todas' ? {} : { estado: filter };
      const response = await getOrders(filters);
      
      if (response.status === 'Success') {
        setOrders(response.data);
      }
    } catch (error) {
      showErrorAlert('Error', 'No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    const statusMessages = {
      en_camino: 'marcar como En Camino',
      entregado: 'marcar como Entregado',
    };

    const confirmed = await showConfirmAlert(
      '¿Confirmar cambio?',
      `¿Deseas ${statusMessages[newStatus]} esta orden?`
    );

    if (!confirmed) return;

    try {
      setUpdating(true);
      const response = await updateOrderStatus(orderId, newStatus);
      
      if (response.status === 'Success') {
        showSuccessAlert('Estado actualizado', 'El estado de la orden se actualizó correctamente');
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      showErrorAlert('Error', error.message || 'No se pudo actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pendiente: '📋',
      procesando: '⚙️',
      listo_para_envio: '📦',
      en_camino: '🚚',
      entregado: '✅',
      cancelado: '❌',
    };
    return icons[status] || '📦';
  };

  const getStatusText = (status) => {
    const texts = {
      pendiente: 'Pendiente',
      procesando: 'Procesando',
      listo_para_envio: 'Listo para Envío',
      en_camino: 'En camino',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Hoy ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Ayer ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return formatPrice(amount);
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      listo_para_envio: 'en_camino',
      en_camino: 'entregado',
    };
    return statusFlow[currentStatus];
  };

  const canUpdateStatus = (status) => {
    return ['listo_para_envio', 'en_camino'].includes(status);
  };

  const getMetodoPagoText = (metodo) => {
    const metodos = {
      efectivo: '💵 Efectivo (Pago contra entrega)',
      transferencia: '🏦 Transferencia Bancaria',
      tarjeta: '💳 Tarjeta de Crédito',
      debito: '💳 Tarjeta de Débito',
    };
    return metodos[metodo] || metodo;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('usuario');
    window.dispatchEvent(new Event('userSessionChanged'));
    logout();
    window.location.href = '/';
  };

  return (
    <div className="repartidor-container">
      <div className="repartidor-header">
        <h1>🚚 Panel de Repartidor</h1>
        <p className="repartidor-welcome">Bienvenido, {user?.nombreCompleto}</p>
      </div>

      {/* Filtros */}
      <div className="repartidor-filters">
        <button
          className={`filter-btn ${filter === 'listo_para_envio' ? 'active' : ''}`}
          onClick={() => setFilter('listo_para_envio')}
        >
          📦 Listo para Envío
        </button>
        <button
          className={`filter-btn ${filter === 'en_camino' ? 'active' : ''}`}
          onClick={() => setFilter('en_camino')}
        >
          🚚 En camino
        </button>
        <button
          className={`filter-btn ${filter === 'entregado' ? 'active' : ''}`}
          onClick={() => setFilter('entregado')}
        >
          ✅ Entregados
        </button>
        <button
          className={`filter-btn ${filter === 'todas' ? 'active' : ''}`}
          onClick={() => setFilter('todas')}
        >
          📦 Todas
        </button>
        <button
          className="filter-btn logout-btn"
          onClick={handleLogout}
        >
          🚪 Salir
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="repartidor-content">
        {loading ? (
          <div className="repartidor-loading">
            <div className="spinner"></div>
            <p>Cargando órdenes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="repartidor-empty">
            <p>📭 No hay órdenes {filter !== 'todas' ? getStatusText(filter).toLowerCase() : ''}</p>
          </div>
        ) : (
          <div className="repartidor-layout">
            
            {/* Mapa de Entregas */}
            <div className="delivery-map-container">
              <h2 className="section-title">🗺️ Mapa de Entregas</h2>
              <div className="map-wrapper" style={{ height: '400px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid #ecf0f1', marginBottom: '2rem' }}>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <MapController center={mapCenter} zoom={15} />
                  
                  {orders.map(order => {
                    const coords = parseCoordinates(order.direccionEnvio);
                    if (coords && order.tipoEntrega === 'envio') {
                      return (
                        <Marker key={order.id} position={coords} icon={deliveryIcon}>
                          <Popup>
                            <div className="map-popup-content">
                              <strong>#{order.numeroOrden}</strong>
                              <p>{order.user?.nombreCompleto}</p>
                              <span className={`status-badge status-${order.estado}`}>{getStatusText(order.estado)}</span>
                              <div style={{ marginTop: '10px' }}>
                                <button 
                                  className="action-btn map-btn"
                                  style={{ width: '100%', padding: '5px' }}
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    document.getElementById(`order-${order.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }}
                                >
                                  Ver Detalles
                                </button>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    }
                    return null;
                  })}
                </MapContainer>
              </div>
            </div>

            {/* Lista de Órdenes */}
            <div className="orders-list">
              <h2 className="section-title">📋 Lista de Pedidos</h2>
              {orders.map((order) => {
                const hasCoords = !!parseCoordinates(order.direccionEnvio);
                return (
              <div
                id={`order-${order.id}`}
                key={order.id}
                className={`order-card ${selectedOrder?.id === order.id ? 'expanded' : ''}`}
              >
                <div 
                  className="order-card-header"
                  onClick={() => {
                    setSelectedOrder(selectedOrder?.id === order.id ? null : order);
                    if (hasCoords && selectedOrder?.id !== order.id) {
                      setMapCenter(parseCoordinates(order.direccionEnvio));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  <div className="order-number">
                    <span className="status-icon">{getStatusIcon(order.estado)}</span>
                    <span className="numero-orden">{order.numeroOrden}</span>
                  </div>
                  <div className="header-badge-wrapper">
                    <span className={`status-badge status-${order.estado}`}>
                      {getStatusText(order.estado)}
                    </span>
                    <span className={`chevron-indicator ${selectedOrder?.id === order.id ? 'open' : ''}`}>▼</span>
                  </div>
                </div>

                <div className="order-card-info">
                  <div className="info-row">
                    <span className="info-label">📦 Entrega:</span>
                    <span className="info-value">
                      <strong>{order.tipoEntrega === 'retiro' ? '🏢 Retiro en Tienda' : '🚚 Despacho a Domicilio'}</strong>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">👤 Cliente:</span>
                    <span className="info-value">{order.user?.nombreCompleto}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">📞 Teléfono:</span>
                    <span className="info-value">
                      <a href={`tel:${order.telefonoContacto}`}>{order.telefonoContacto}</a>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">📍 {order.tipoEntrega === 'retiro' ? 'Lugar de Retiro' : 'Dirección'}:</span>
                    <span className="info-value">{order.direccionEnvio}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">💰 Total:</span>
                    <span className="info-value total-amount">{formatCurrency(order.total)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">🕐 Fecha:</span>
                    <span className="info-value">{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                {selectedOrder?.id === order.id && (
                  <div className="order-details">
                    <div className="order-items">
                      <h3>📦 Productos</h3>
                      {order.orderItems?.map((item, index) => (
                        <div key={index} className="order-item">
                          <span className="item-name">
                            {item.nombreProducto} x{item.cantidad}
                          </span>
                          <span className="item-price">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                      ))}
                      
                      <div className="order-totals">
                        <div className="total-row">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.descuentoTotal > 0 && (
                          <div className="total-row discount">
                            <span>Descuento:</span>
                            <span>-{formatCurrency(order.descuentoTotal)}</span>
                          </div>
                        )}
                        {order.costoEnvio !== undefined && order.costoEnvio !== null && parseFloat(order.costoEnvio) > 0 && (
                          <div className="total-row shipping">
                            <span>Envío {order.zonaEnvio ? `(${order.zonaEnvio})` : ''}:</span>
                            <span>{formatCurrency(order.costoEnvio)}</span>
                          </div>
                        )}
                        <div className="total-row final">
                          <span>Total:</span>
                          <span>{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </div>

                    {order.notas && (
                      <div className="order-notes">
                        <h3>📝 Notas</h3>
                        <p>{order.notas}</p>
                      </div>
                    )}

                    <div className="order-payment">
                      <h3>💳 Método de Pago</h3>
                      <p className="payment-method">{getMetodoPagoText(order.metodoPago)}</p>
                    </div>

                    {canUpdateStatus(order.estado) && (
                      <div className="order-actions">
                        <button
                          className="action-btn next-status"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(order.id, getNextStatus(order.estado));
                          }}
                          disabled={updating}
                        >
                          {updating ? '⏳ Actualizando...' : `➡️ ${getStatusText(getNextStatus(order.estado))}`}
                        </button>
                        
                        {order.estado === 'listo_para_envio' || order.estado === 'en_camino' ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.direccionEnvio)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-btn map-btn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🗺️ Ver en Mapa
                          </a>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Repartidor;
