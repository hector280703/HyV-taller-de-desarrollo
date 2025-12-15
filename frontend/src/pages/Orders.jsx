import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, cancelOrder } from '../services/order.service.js';
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from '../helpers/sweetAlert.js';
import '../styles/orders.css';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await getOrders({ onlyOwn: true });
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      showErrorAlert('Error', 'No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmed = await showConfirmAlert(
      '¿Cancelar pedido?',
      'Esta acción no se puede deshacer y el stock será restaurado'
    );

    if (!confirmed) return;

    try {
      await cancelOrder(orderId);
      showSuccessAlert('Pedido cancelado', 'El pedido ha sido cancelado exitosamente');
      loadOrders();
    } catch (error) {
      console.error('Error al cancelar orden:', error);
      showErrorAlert('Error', error.message || 'No se pudo cancelar el pedido');
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { text: 'Pendiente', class: 'badge-pending' },
      procesando: { text: 'Procesando', class: 'badge-processing' },
      enviado: { text: 'Enviado', class: 'badge-shipped' },
      entregado: { text: 'Entregado', class: 'badge-delivered' },
      cancelado: { text: 'Cancelado', class: 'badge-cancelled' },
    };
    return badges[estado] || { text: estado, class: 'badge-default' };
  };

  const getMetodoPagoText = (metodo) => {
    const metodos = {
      efectivo: 'Efectivo',
      transferencia: 'Transferencia',
      tarjeta: 'Tarjeta de Crédito',
      debito: 'Tarjeta de Débito',
    };
    return metodos[metodo] || metodo;
  };

  const filteredOrders = filter
    ? orders.filter(order => order.estado === filter)
    : orders;

  if (loading) {
    return (
      <div className="orders-container">
        <div className="loading">Cargando órdenes...</div>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>Mis Pedidos</h1>
        <div className="orders-filters">
          <button
            className={filter === '' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('')}
          >
            Todos
          </button>
          <button
            className={filter === 'pendiente' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('pendiente')}
          >
            Pendientes
          </button>
          <button
            className={filter === 'procesando' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('procesando')}
          >
            Procesando
          </button>
          <button
            className={filter === 'enviado' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('enviado')}
          >
            Enviados
          </button>
          <button
            className={filter === 'entregado' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('entregado')}
          >
            Entregados
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="orders-empty">
          <p>No tienes pedidos {filter && `en estado "${filter}"`}</p>
          <button onClick={() => navigate('/products')} className="btn-primary">
            Ir a Comprar
          </button>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => {
            const badge = getEstadoBadge(order.estado);
            const fecha = new Date(order.createdAt).toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <h3>Pedido #{order.numeroOrden}</h3>
                    <p className="order-date">{fecha}</p>
                  </div>
                  <span className={`order-badge ${badge.class}`}>
                    {badge.text}
                  </span>
                </div>

                <div className="order-card-body">
                  <div className="order-info">
                    <p><strong>Método de pago:</strong> {getMetodoPagoText(order.metodoPago)}</p>
                    <p><strong>Dirección:</strong> {order.direccionEnvio}</p>
                    <p><strong>Teléfono:</strong> {order.telefonoContacto}</p>
                  </div>

                  <div className="order-items-preview">
                    <p className="items-count">
                      {order.orderItems?.length || 0} producto(s)
                    </p>
                    <div className="items-list">
                      {order.orderItems?.slice(0, 3).map((item, index) => (
                        <span key={index} className="item-name">
                          {item.nombreProducto} x{item.cantidad}
                        </span>
                      ))}
                      {order.orderItems?.length > 3 && (
                        <span className="item-name">
                          +{order.orderItems.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="order-total">
                    <span>Total:</span>
                    <span className="total-amount">
                      ${order.total?.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>

                <div className="order-card-footer">
                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="btn-details"
                  >
                    Ver Detalles
                  </button>
                  {order.estado === 'pendiente' && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="btn-cancel"
                    >
                      Cancelar Pedido
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
