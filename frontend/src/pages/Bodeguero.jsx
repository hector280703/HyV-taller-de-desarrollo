import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, updateOrderStatus, confirmPresentialDelivery } from '@services/order.service';
import { logout } from '@services/auth.service';
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from '@helpers/sweetAlert';
import { formatPrice } from '@helpers/formatData';
import PreparationChecklist from '@components/PreparationChecklist';
import Swal from 'sweetalert2';
import '@styles/repartidor.css';

function Bodeguero() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pendiente');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [checklistOrder, setChecklistOrder] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem('usuario'));

  useEffect(() => {
    if (!user || user.rol !== 'bodeguero') {
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
    if (newStatus === 'listo_para_envio' || newStatus === 'listo_para_retiro') {
      const orderToPrepare = orders.find(o => o.id === orderId);
      setChecklistOrder(orderToPrepare);
      return;
    }

    await executeStatusUpdate(orderId, newStatus);
  };

  const executeStatusUpdate = async (orderId, newStatus) => {
    const statusMessages = {
      procesando: 'marcar como Procesando',
      listo_para_envio: 'marcar como Listo para Envío',
      listo_para_retiro: 'marcar como Listo para Retiro',
      entregado: 'marcar como Entregado',
      incidencia_stock: 'reportar incidencia de stock',
    };

    if (newStatus === 'entregado') {
      const order = orders.find(o => o.id === orderId);

      // Flujo diferente para ventas presenciales
      if (order.tipoVenta === 'presencial') {
        const result = await Swal.fire({
          title: '🏪 Confirmar Entrega Presencial',
          html: `
            <p style="margin-bottom:12px; color:#555;">Ingresa el <strong>código de entrega</strong> que el cliente recibió por email.</p>
            <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:12px;margin-bottom:16px;">
              <p style="color:rgba(255,255,255,0.8);font-size:11px;margin:0 0 4px;">CÓDIGO (6 caracteres)</p>
              <p style="color:#fff;font-size:13px;margin:0;">Ej: <strong>A3F7KX</strong></p>
            </div>
          `,
          input: 'text',
          inputAttributes: { maxlength: 6, style: 'text-transform:uppercase;letter-spacing:6px;font-size:22px;font-weight:bold;text-align:center;' },
          showCancelButton: true,
          confirmButtonText: '✅ Confirmar Entrega',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#667eea',
          inputValidator: (value) => {
            if (!value || value.trim().length === 0) return 'Debe ingresar el código';
            if (value.trim().length !== 6) return 'El código debe tener exactamente 6 caracteres';
          }
        });

        if (!result.isConfirmed) return;

        try {
          setUpdating(true);
          const response = await confirmPresentialDelivery(orderId, result.value.trim());
          if (response.status === 'Success') {
            showSuccessAlert('¡Entrega confirmada!', 'La venta presencial fue entregada exitosamente.');
            fetchOrders();
            setSelectedOrder(null);
          }
        } catch (error) {
          showErrorAlert('Código incorrecto', error.message || 'No se pudo confirmar la entrega');
        } finally {
          setUpdating(false);
        }
        return;
      }

      // Flujo original para ventas online
      const result = await Swal.fire({
        title: 'Entregar Pedido',
        text: 'Por favor, ingrese el código de la orden para confirmar la entrega al cliente (ej: ORD-...).',
        input: 'text',
        showCancelButton: true,
        confirmButtonText: 'Confirmar Entrega',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value) {
            return 'Debe ingresar un código';
          }
          if (value !== order.numeroOrden) {
            return 'El código no coincide con el número de orden del cliente';
          }
        }
      });
      
      if (!result.isConfirmed) return;
    } else {
      const confirmed = await showConfirmAlert(
        '¿Confirmar cambio?',
        `¿Deseas ${statusMessages[newStatus]} esta orden?`
      );

      if (!confirmed) return;
    }

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
      listo_para_retiro: '🏢',
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
      listo_para_retiro: 'Listo para Retiro',
      en_camino: 'En camino',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
      incidencia_stock: 'Incidencia de Stock',
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

  const getNextStatus = (order) => {
    const { estado, tipoEntrega } = order;
    const statusFlow = {
      pendiente: 'procesando',
      procesando: tipoEntrega === 'retiro' ? 'listo_para_retiro' : 'listo_para_envio',
      listo_para_retiro: 'entregado'
    };
    return statusFlow[estado];
  };

  const canUpdateStatus = (status) => {
    return ['pendiente', 'procesando', 'listo_para_retiro'].includes(status);
  };

  const getMetodoPagoText = (metodo) => {
    const metodos = {
      efectivo: '💵 Efectivo (Pago contra entrega)',
      transferencia: '🏦 Transferencia Bancaria',
      tarjeta: '💳 Tarjeta de Crédito',
      debito: '💳 Tarjeta de Débito',
      mercadopago: 'Mercado Pago',
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
        <h1>🏭 Panel de Bodega</h1>
        <p className="repartidor-welcome">Bienvenido, {user?.nombreCompleto}</p>
      </div>

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
          className={`filter-btn ${filter === 'listo_para_envio' ? 'active' : ''}`}
          onClick={() => setFilter('listo_para_envio')}
        >
          📦 Listo para Envío
        </button>
        <button
          className={`filter-btn ${filter === 'listo_para_retiro' ? 'active' : ''}`}
          onClick={() => setFilter('listo_para_retiro')}
        >
          🏢 Listo para Retiro
        </button>
        <button
          className={`filter-btn ${filter === 'todas' ? 'active' : ''}`}
          onClick={() => setFilter('todas')}
        >
          📦 Todas
        </button>
        <button
          className="filter-btn"
          onClick={() => navigate('/inventory')}
          style={{ backgroundColor: '#f39c12', color: 'white' }}
        >
          📦 Inventario
        </button>
        <button
          className="filter-btn logout-btn"
          onClick={handleLogout}
        >
          🚪 Salir
        </button>
      </div>

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
              >
                <div 
                  className="order-card-header"
                  onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                >
                  <div className="order-number">
                    <span className="status-icon">{getStatusIcon(order.estado)}</span>
                    <span className="numero-orden">{order.numeroOrden}</span>
                    {order.tipoVenta === 'presencial' && (
                      <span style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.5px' }}>
                        🏪 PRESENCIAL
                      </span>
                    )}
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
                    <span className="info-value">
                      {order.tipoVenta === 'presencial' ? order.clienteNombre : order.user?.nombreCompleto}
                    </span>
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
                            handleUpdateStatus(order.id, getNextStatus(order));
                          }}
                          disabled={updating}
                        >
                          {updating ? '⏳ Actualizando...' : `➡️ ${getStatusText(getNextStatus(order))}`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {checklistOrder && (
        <PreparationChecklist 
          order={checklistOrder}
          onClose={() => setChecklistOrder(null)}
          onSuccess={(orderId, newStatus) => {
            setChecklistOrder(null);
            if (newStatus === 'incidencia_stock') {
              fetchOrders();
              setSelectedOrder(null);
            } else {
              executeStatusUpdate(orderId, newStatus);
            }
          }}
        />
      )}
    </div>
  );
}

export default Bodeguero;
