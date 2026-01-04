import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, updateOrderStatus } from '@services/order.service';
import { logout } from '@services/auth.service';
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from '@helpers/sweetAlert';
import '@styles/repartidor.css';

function Repartidor() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendiente');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

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
      procesando: 'marcar como Procesando',
      enviado: 'marcar como Enviado',
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
      enviado: '🚚',
      entregado: '✅',
      cancelado: '❌',
    };
    return icons[status] || '📦';
  };

  const getStatusText = (status) => {
    const texts = {
      pendiente: 'Pendiente',
      procesando: 'Procesando',
      enviado: 'En camino',
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
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pendiente: 'procesando',
      procesando: 'enviado',
      enviado: 'entregado',
    };
    return statusFlow[currentStatus];
  };

  const canUpdateStatus = (status) => {
    return ['pendiente', 'procesando', 'enviado'].includes(status);
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
          className={`filter-btn ${filter === 'pendiente' ? 'active' : ''}`}
          onClick={() => setFilter('pendiente')}
        >
          📋 Pendientes
        </button>
        <button
          className={`filter-btn ${filter === 'procesando' ? 'active' : ''}`}
          onClick={() => setFilter('procesando')}
        >
          ⚙️ Procesando
        </button>
        <button
          className={`filter-btn ${filter === 'enviado' ? 'active' : ''}`}
          onClick={() => setFilter('enviado')}
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

      {/* Lista de órdenes */}
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
          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`order-card ${selectedOrder?.id === order.id ? 'expanded' : ''}`}
                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
              >
                <div className="order-card-header">
                  <div className="order-number">
                    <span className="status-icon">{getStatusIcon(order.estado)}</span>
                    <span className="numero-orden">{order.numeroOrden}</span>
                  </div>
                  <span className={`status-badge status-${order.estado}`}>
                    {getStatusText(order.estado)}
                  </span>
                </div>

                <div className="order-card-info">
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
                    <span className="info-label">📍 Dirección:</span>
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
                      <p className="payment-method">{order.metodoPago}</p>
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
                        
                        {order.estado === 'enviado' && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.direccionEnvio)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-btn map-btn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            🗺️ Ver en Mapa
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Repartidor;
