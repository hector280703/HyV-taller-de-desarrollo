import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, cancelOrder } from '../services/order.service.js';
import { createPaymentPreference } from '../services/payment.service.js';
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from '../helpers/sweetAlert.js';
import { formatPrice } from '../helpers/formatData.js';
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
      mercadopago: '🟦 Mercado Pago',
    };
    return metodos[metodo] || metodo;
  };

  const handlePayWithMP = async () => {
    try {
      const paymentRes = await createPaymentPreference(order.id);
      const initPoint = paymentRes.data.initPoint || paymentRes.data.sandboxInitPoint;
      if (initPoint) {
        window.location.href = initPoint;
      } else {
        showErrorAlert('Error', 'No se pudo generar el enlace de pago');
      }
    } catch (error) {
      console.error('Error al crear preferencia:', error);
      showErrorAlert('Error', 'No se pudo conectar con Mercado Pago');
    }
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
            <h2>{order.tipoEntrega === 'retiro' ? '🏢 Información de Retiro' : '📍 Información de Envío'}</h2>
            <div className="info-group">
              <label>Método de Entrega:</label>
              <p><strong>{order.tipoEntrega === 'retiro' ? '🏢 Retiro en Tienda' : '🚚 Despacho a Domicilio'}</strong></p>
            </div>
            <div className="info-group">
              <label>{order.tipoEntrega === 'retiro' ? 'Lugar de Retiro:' : 'Dirección de Entrega:'}</label>
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
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.descuentoTotal > 0 && (
                <div className="summary-line discount">
                  <span>Descuentos:</span>
                  <span>-{formatPrice(order.descuentoTotal)}</span>
                </div>
              )}
              {order.costoEnvio !== undefined && order.costoEnvio !== null && parseFloat(order.costoEnvio) > 0 && (
                <div className="summary-line shipping">
                  <span>Envío {order.zonaEnvio ? `(${order.zonaEnvio})` : ''}:</span>
                  <span>{formatPrice(order.costoEnvio)}</span>
                </div>
              )}
              <div className="summary-line total">
                <span>Total:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
            {order.estadoPago && (
              <div className="info-group" style={{marginTop: '1rem'}}>
                <label>Estado del Pago:</label>
                <p>
                  <span className={`pago-badge pago-${order.estadoPago}`}>
                    {order.estadoPago === 'aprobado' && '✅ '}
                    {order.estadoPago === 'pendiente' && '⏳ '}
                    {order.estadoPago === 'rechazado' && '❌ '}
                    {order.estadoPago === 'reembolsado' && '↩️ '}
                    {order.estadoPago.charAt(0).toUpperCase() + order.estadoPago.slice(1)}
                  </span>
                </p>
              </div>
            )}
            {order.metodoPago === 'mercadopago' && order.estadoPago === 'pendiente' && order.estado === 'pendiente' && (
              <div style={{marginTop: '1rem'}}>
                <button onClick={handlePayWithMP} className="btn-primary" style={{width: '100%'}}>
                  🟦 Pagar con Mercado Pago
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="detail-section products-section">
          <h2>📦 Productos del Pedido</h2>
          <div className="products-table">
            {order.orderItems?.map((item, index) => (
              <div key={index} className="product-row">
                {item.product?.imagenUrl ? (
                  <img 
                    src={item.product.imagenUrl} 
                    alt={item.nombreProducto}
                    className="product-thumbnail"
                  />
                ) : (
                  <div className="product-thumbnail-placeholder">📦</div>
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
                    {formatPrice(item.precioUnitario)} c/u
                  </p>
                  <p className="item-subtotal">
                    {formatPrice(item.subtotal)}
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
