import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { getPaymentStatus } from '../services/payment.service.js';
import { getOrderById } from '../services/order.service.js';
import { formatPrice } from '../helpers/formatData.js';
import '../styles/paymentResult.css';

export default function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);

  // Determinar el tipo de resultado basado en la ruta
  const pathSegment = location.pathname.split('/').pop(); // success, failure, pending
  const orderId = searchParams.get('order_id');

  const resultConfig = {
    success: {
      icon: '✅',
      title: '¡Pago Exitoso!',
      subtitle: 'Tu pago ha sido procesado correctamente',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    failure: {
      icon: '❌',
      title: 'Pago Rechazado',
      subtitle: 'No se pudo procesar tu pago',
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    },
    pending: {
      icon: '⏳',
      title: 'Pago Pendiente',
      subtitle: 'Tu pago está siendo procesado',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
  };

  const config = resultConfig[pathSegment] || resultConfig.pending;

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const [orderRes, paymentRes] = await Promise.allSettled([
          getOrderById(orderId),
          getPaymentStatus(orderId),
        ]);

        if (orderRes.status === 'fulfilled') {
          setOrder(orderRes.value.data);
        }
        if (paymentRes.status === 'fulfilled') {
          setPaymentInfo(paymentRes.value.data);
        }
      } catch (error) {
        console.error('Error cargando info de pago:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="payment-result-container">
        <div className="payment-result-loading">
          <div className="payment-spinner"></div>
          <p>Verificando estado del pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-container">
      <div className="payment-result-card">
        <div
          className="payment-result-header"
          style={{ background: config.gradient }}
        >
          <span className="payment-result-icon">{config.icon}</span>
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>

        <div className="payment-result-body">
          {order && (
            <div className="payment-order-info">
              <div className="payment-info-row">
                <span className="payment-info-label">N° de Orden</span>
                <span className="payment-info-value">{order.numeroOrden}</span>
              </div>
              <div className="payment-info-row">
                <span className="payment-info-label">Total</span>
                <span className="payment-info-value payment-total">
                  {formatPrice(parseFloat(order.total))}
                </span>
              </div>
              <div className="payment-info-row">
                <span className="payment-info-label">Estado del Pedido</span>
                <span className={`payment-status-badge status-${order.estado}`}>
                  {order.estado?.charAt(0).toUpperCase() + order.estado?.slice(1)}
                </span>
              </div>
              {paymentInfo && (
                <div className="payment-info-row">
                  <span className="payment-info-label">Estado del Pago</span>
                  <span className={`payment-status-badge pago-${paymentInfo.estadoPago}`}>
                    {paymentInfo.estadoPago?.charAt(0).toUpperCase() +
                      paymentInfo.estadoPago?.slice(1)}
                  </span>
                </div>
              )}
            </div>
          )}

          {pathSegment === 'success' && (
            <div className="payment-success-message">
              <p>
                🎉 Tu pedido ha sido confirmado y está siendo procesado. Recibirás
                un correo electrónico con los detalles de tu compra.
              </p>
            </div>
          )}

          {pathSegment === 'failure' && (
            <div className="payment-failure-message">
              <p>
                Tu pago no pudo ser procesado. Tu pedido ha sido creado pero permanece
                pendiente de pago. Puedes intentar pagar nuevamente desde tus órdenes.
              </p>
            </div>
          )}

          {pathSegment === 'pending' && (
            <div className="payment-pending-message">
              <p>
                Tu pago está siendo procesado por Mercado Pago. Te notificaremos
                cuando se confirme. Esto puede tomar unos minutos.
              </p>
            </div>
          )}

          <div className="payment-result-actions">
            {order && (
              <button
                className="btn-primary"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                Ver Detalle del Pedido
              </button>
            )}
            <button
              className="btn-secondary"
              onClick={() => navigate('/orders')}
            >
              Mis Pedidos
            </button>
            <button
              className="btn-outline"
              onClick={() => navigate('/products')}
            >
              Seguir Comprando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
