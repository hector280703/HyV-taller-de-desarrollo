import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, cancelOrder } from '../services/order.service.js';
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from '../helpers/sweetAlert.js';
import '../styles/orderDetail.css';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const response = await getOrderById(id);
      setOrder(response.data);
    } catch (error) {
      console.error('Error al cargar orden:', error);
      showErrorAlert('Error', 'No se pudo cargar el detalle del pedido');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    const confirmed = await showConfirmAlert(
      '¿Cancelar pedido?',
      'Esta acción no se puede deshacer y el stock será restaurado'
    );

    if (!confirmed) return;

    try {
      await cancelOrder(order.id);
      showSuccessAlert('Pedido cancelado', 'El pedido ha sido cancelado exitosamente');
      loadOrder();
    } catch (error) {
      console.error('Error al cancelar orden:', error);
      showErrorAlert('Error', error.message || 'No se pudo cancelar el pedido');
    }
  };

  const getEstadoInfo = (estado) => {
    const estados = {
      pendiente: { text: 'Pendiente', class: 'status-pending', icon: '⏳' },
      procesando: { text: 'Procesando', class: 'status-processing', icon: '⚙️' },
      enviado: { text: 'Enviado', class: 'status-shipped', icon: '🚚' },
      entregado: { text: 'Entregado', class: 'status-delivered', icon: '✅' },
      cancelado: { text: 'Cancelado', class: 'status-cancelled', icon: '❌' },
    };
    return estados[estado] || { text: estado, class: 'status-default', icon: '📦' };
  };

  const getMetodoPagoText = (metodo) => {
    const metodos = {
      efectivo: '💵 Efectivo',
      transferencia: '🏦 Transferencia Bancaria',
      tarjeta: '💳 Tarjeta de Crédito',
      debito: '💳 Tarjeta de Débito',
    };
    return metodos[metodo] || metodo;
  };

  if (loading) {
    return (
      <div className="order-detail-container">
        <div className="loading">Cargando detalles del pedido...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-container">
        <div className="order-not-found">
          <h2>Pedido no encontrado</h2>
          <button onClick={() => navigate('/orders')} className="btn-back">
            Volver a Mis Pedidos
          </button>
        </div>
      </div>
    );
  }

  const estadoInfo = getEstadoInfo(order.estado);
  const fecha = new Date(order.createdAt).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="order-detail-container">
      <div className="order-detail-content">
        <div className="detail-header">
          <button onClick={() => navigate('/orders')} className="btn-back-arrow">
            ← Volver
          </button>
          <div className="header-info">
            <h1>Pedido #{order.numeroOrden}</h1>
            <p className="order-date-detail">{fecha}</p>
          </div>
          <div className={`status-badge-large ${estadoInfo.class}`}>
            <span className="status-icon">{estadoInfo.icon}</span>
            <span>{estadoInfo.text}</span>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-section shipping-info">
            <h2>📍 Información de Envío</h2>
            <div className="info-group">
              <label>Dirección de Entrega:</label>
              <p>{order.direccionEnvio}</p>
            </div>
            <div className="info-group">
              <label>Teléfono de Contacto:</label>
              <p>{order.telefonoContacto}</p>
            </div>
            {order.notas && (
              <div className="info-group">
                <label>Notas del Pedido:</label>
                <p className="order-notes">{order.notas}</p>
              </div>
            )}
          </div>

          <div className="detail-section payment-info">
            <h2>💳 Información de Pago</h2>
            <div className="info-group">
              <label>Método de Pago:</label>
              <p>{getMetodoPagoText(order.metodoPago)}</p>
            </div>
            <div className="payment-summary">
              <div className="summary-line">
                <span>Subtotal:</span>
                <span>${order.subtotal?.toLocaleString('es-CL')}</span>
              </div>
              {order.descuentoTotal > 0 && (
                <div className="summary-line discount">
                  <span>Descuentos:</span>
                  <span>-${order.descuentoTotal?.toLocaleString('es-CL')}</span>
                </div>
              )}
              <div className="summary-line total">
                <span>Total:</span>
                <span>${order.total?.toLocaleString('es-CL')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-section products-section">
          <h2>📦 Productos del Pedido</h2>
          <div className="products-table">
            {order.orderItems?.map((item, index) => (
              <div key={index} className="product-row">
                {item.product?.imagenes?.[0] && (
                  <img 
                    src={item.product.imagenes[0]} 
                    alt={item.nombreProducto}
                    className="product-thumbnail"
                  />
                )}
                <div className="product-info">
                  <h4>{item.nombreProducto}</h4>
                  <p className="product-quantity">Cantidad: {item.cantidad}</p>
                  {item.descuento > 0 && (
                    <span className="product-discount">{item.descuento}% OFF</span>
                  )}
                </div>
                <div className="product-prices">
                  <p className="unit-price">
                    ${item.precioUnitario?.toLocaleString('es-CL')} c/u
                  </p>
                  <p className="item-subtotal">
                    ${item.subtotal?.toLocaleString('es-CL')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {order.estado === 'pendiente' && (
          <div className="detail-actions">
            <button onClick={handleCancelOrder} className="btn-cancel-order">
              ❌ Cancelar Pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
