import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, updateOrderStatus, getOrderStats } from '../services/order.service.js';
import { showErrorAlert, showSuccessAlert } from '../helpers/sweetAlert.js';
import '../styles/adminOrders.css';

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersResponse, statsResponse] = await Promise.all([
        getOrders(),
        getOrderStats()
      ]);
      setOrders(ordersResponse.data || []);
      setStats(statsResponse.data || {});
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showErrorAlert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showSuccessAlert('Estado actualizado', 'El estado del pedido ha sido actualizado');
      loadData();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      showErrorAlert('Error', error.message || 'No se pudo actualizar el estado');
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

  const filteredOrders = filter
    ? orders.filter(order => order.estado === filter)
    : orders;

  // Calcular la altura máxima de las barras del gráfico
  const maxVenta = stats?.ventasSemana?.length > 0
    ? Math.max(...stats.ventasSemana.map(v => v.total))
    : 0;

  if (loading) {
    return (
      <div className="admin-orders-container">
        <div className="loading">Cargando panel de administración...</div>
      </div>
    );
  }

  return (
    <div className="admin-orders-container">
      <div className="admin-header">
        <h1>📊 Panel de Administración</h1>
        <p className="admin-subtitle">Estadísticas, seguimiento de órdenes y rendimiento</p>
      </div>

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <p className="stat-label">Ventas Hoy</p>
                <p className="stat-value">${stats.ventasHoy?.toLocaleString('es-CL')}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💎</div>
              <div className="stat-content">
                <p className="stat-label">Ventas Totales</p>
                <p className="stat-value">${stats.ventasTotales?.toLocaleString('es-CL')}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <p className="stat-label">Pedidos Hoy</p>
                <p className="stat-value">{stats.pedidosHoy || 0}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <p className="stat-label">Total Pedidos</p>
                <p className="stat-value">{stats.totalPedidos || 0}</p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-grid">
            {/* Weekly Sales Chart */}
            <div className="chart-card">
              <h3 className="chart-title">📈 Ventas Últimos 7 Días</h3>
              <div className="bar-chart">
                {stats.ventasSemana?.map((dia, index) => (
                  <div key={index} className="bar-group">
                    <div className="bar-value">
                      {dia.total > 0 ? `$${Math.round(dia.total).toLocaleString('es-CL')}` : '-'}
                    </div>
                    <div className="bar-wrapper">
                      <div
                        className="bar"
                        style={{
                          height: maxVenta > 0 ? `${Math.max((dia.total / maxVenta) * 100, 4)}%` : '4%',
                        }}
                      >
                        {dia.cantidad > 0 && (
                          <span className="bar-orders">{dia.cantidad}</span>
                        )}
                      </div>
                    </div>
                    <div className="bar-label">{dia.dia}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="chart-card">
              <h3 className="chart-title">🏆 Productos Más Vendidos</h3>
              {stats.topProductos?.length > 0 ? (
                <div className="top-products-list">
                  {stats.topProductos.map((product, index) => {
                    const maxSold = stats.topProductos[0]?.totalVendido || 1;
                    const widthPercent = (product.totalVendido / maxSold) * 100;
                    return (
                      <div key={index} className="top-product-item">
                        <div className="top-product-rank">#{index + 1}</div>
                        <div className="top-product-info">
                          <div className="top-product-header">
                            <span className="top-product-name">{product.nombre}</span>
                            <span className="top-product-sold">{product.totalVendido} uds</span>
                          </div>
                          <div className="top-product-bar-bg">
                            <div
                              className="top-product-bar-fill"
                              style={{ width: `${widthPercent}%` }}
                            ></div>
                          </div>
                          <span className="top-product-revenue">${product.totalIngresos?.toLocaleString('es-CL')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-data">No hay datos de productos aún</div>
              )}
            </div>

            {/* Orders by Status */}
            <div className="chart-card">
              <h3 className="chart-title">📊 Pedidos por Estado</h3>
              <div className="status-chart">
                {stats.pedidosPorEstado?.map((item) => {
                  const badge = getEstadoBadge(item.estado);
                  const percent = stats.totalPedidos > 0 ? ((parseInt(item.cantidad) / stats.totalPedidos) * 100).toFixed(1) : 0;
                  return (
                    <div key={item.estado} className="status-chart-item">
                      <div className="status-chart-header">
                        <span className={`mini-badge ${badge.class}`}>{badge.text}</span>
                        <span className="status-chart-count">{item.cantidad}</span>
                      </div>
                      <div className="status-chart-bar-bg">
                        <div className={`status-chart-bar-fill ${badge.class}`} style={{ width: `${percent}%` }}></div>
                      </div>
                      <span className="status-chart-percent">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Orders Table */}
      <div className="orders-section">
        <div className="section-header">
          <h2>Listado de Pedidos</h2>
          <div className="orders-filters">
            <button
              className={filter === '' ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilter('')}
            >
              Todos ({orders.length})
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
          <div className="no-orders">
            <p>No hay pedidos {filter && `en estado "${filter}"`}</p>
          </div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Nº Orden</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const badge = getEstadoBadge(order.estado);
                  const fecha = new Date(order.createdAt).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={order.id}>
                      <td className="order-number">#{order.numeroOrden}</td>
                      <td>
                        <div className="customer-cell">
                          <p className="customer-name">{order.user?.nombreCompleto}</p>
                          <p className="customer-email">{order.user?.email}</p>
                        </div>
                      </td>
                      <td>{fecha}</td>
                      <td className="total-cell">${order.total?.toLocaleString('es-CL')}</td>
                      <td>
                        <span className={`table-badge ${badge.class}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          {order.estado !== 'cancelado' && order.estado !== 'entregado' && (
                            <select
                              value={order.estado}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="status-select"
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="procesando">Procesando</option>
                              <option value="enviado">Enviado</option>
                              <option value="entregado">Entregado</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                          )}
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="btn-view"
                            title="Ver detalles"
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
