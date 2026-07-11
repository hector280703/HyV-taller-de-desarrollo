import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrderStats, getOrders } from '@services/order.service.js';
import { logout } from '@services/auth.service.js';
import {
  HomeIcon,
  TruckIcon,
  BoxIcon,
  FileTextIcon,
  StoreIcon,
  ActivityIcon,
  UserIcon,
  CartIcon,
  LogOutIcon
} from './Icons';
import '@styles/adminDashboard.css';

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Month and Year selections
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Obtener estadísticas del mes y año seleccionados
        const statsRes = await getOrderStats(selectedMonth, selectedYear);
        if (statsRes && statsRes.status === 'Success') {
          setStats(statsRes.data);
        }

        // Obtener pedidos recientes (primeros 5)
        const ordersRes = await getOrders();
        if (ordersRes && ordersRes.status === 'Success') {
          // Tomar los 5 más recientes
          const sortedOrders = (ordersRes.data || []).slice(0, 5);
          setRecentOrders(sortedOrders);
        }
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('No se pudo cargar la información del dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/home';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // SVG Line Chart Data Calculation
  const renderLineChart = () => {
    if (!stats || !stats.ventasDiariasMes || stats.ventasDiariasMes.length === 0) {
      return (
        <svg viewBox="0 0 400 150" className="dashboard-svg-chart">
          <path d="M 30,120 Q 110,60 200,90 T 370,50" fill="none" stroke="#ff6b35" strokeWidth="3" />
        </svg>
      );
    }

    const points = stats.ventasDiariasMes;
    const maxVal = Math.max(...points.map(p => p.total), 1000);
    const width = 360;
    const height = 110;
    const paddingLeft = 30;
    const paddingTop = 20;

    const coords = points.map((p, idx) => {
      const x = paddingLeft + (idx * (width / (points.length - 1 || 1)));
      const y = (paddingTop + height) - ((p.total / maxVal) * height);
      return { x, y };
    });

    let pathD = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      pathD += ` L ${coords[i].x},${coords[i].y}`;
    }

    return (
      <svg viewBox="0 0 420 160" className="dashboard-svg-chart">
        {/* Grid lines */}
        <line x1="30" y1="20" x2="390" y2="20" stroke="rgba(0,0,0,0.05)" />
        <line x1="30" y1="75" x2="390" y2="75" stroke="rgba(0,0,0,0.05)" />
        <line x1="30" y1="130" x2="390" y2="130" stroke="rgba(0,0,0,0.05)" />
        
        {/* Glow path */}
        <path d={pathD} fill="none" stroke="#ff6b35" strokeWidth="5" opacity="0.15" style={{ filter: 'blur(4px)' }} />
        
        {/* Main Line path */}
        <path d={pathD} fill="none" stroke="url(#orangeGradient)" strokeWidth="3.5" strokeLinecap="round" />
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="orangeGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff6b35" />
            <stop offset="100%" stopColor="#f7931e" />
          </linearGradient>
        </defs>

        {/* Data points */}
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="4" fill="#ffffff" stroke="#ff6b35" strokeWidth="2.5" />
        ))}
      </svg>
    );
  };

  const getOrderStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'entregado': return 'status-entregado';
      case 'pendiente': return 'status-pendiente';
      case 'en proceso': return 'status-proceso';
      case 'cancelado': return 'status-cancelado';
      default: return 'status-generico';
    }
  };

  return (
    <main className="dashboard-content" style={{ width: '100%' }}>
      {/* Header Superior */}
      <header className="dashboard-content-header">
        <div className="header-titles">
          <h1>Dashboard</h1>
          <p>Bienvenido, {user?.nombreCompleto || 'Administrador'}. Resumen comercial del negocio.</p>
        </div>
        <div className="header-actions">
          <div className="dashboard-filters">
            <span className="filter-label">Mes:</span>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))} 
              className="dashboard-select-filter"
            >
              <option value={1}>Enero</option>
              <option value={2}>Febrero</option>
              <option value={3}>Marzo</option>
              <option value={4}>Abril</option>
              <option value={5}>Mayo</option>
              <option value={6}>Junio</option>
              <option value={7}>Julio</option>
              <option value={8}>Agosto</option>
              <option value={9}>Septiembre</option>
              <option value={10}>Octubre</option>
              <option value={11}>Noviembre</option>
              <option value={12}>Diciembre</option>
            </select>

            <span className="filter-label">Año:</span>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))} 
              className="dashboard-select-filter"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="dashboard-loader">
          <div className="spinner"></div>
          <p>Cargando panel de control...</p>
        </div>
      ) : error ? (
        <div className="dashboard-error">
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Tarjetas de Métricas */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon-wrapper sales-icon">
                <FileTextIcon size={24} color="#ff6b35" />
              </div>
              <div className="metric-content">
                <span className="metric-label">Ventas del Mes</span>
                <span className="metric-value">{formatPrice(stats?.ventasMes || 0)}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper sales-today-icon">
                <FileTextIcon size={24} color="#f7931e" />
              </div>
              <div className="metric-content">
                <span className="metric-label">Ventas de Hoy</span>
                <span className="metric-value">{formatPrice(stats?.ventasHoy || 0)}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper orders-icon">
                <TruckIcon size={24} color="#3b82f6" />
              </div>
              <div className="metric-content">
                <span className="metric-label">Pedidos del Mes</span>
                <span className="metric-value">{stats?.pedidosMes || 0}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrapper total-orders-icon">
                <TruckIcon size={24} color="#10b981" />
              </div>
              <div className="metric-content">
                <span className="metric-label">Pedidos Totales</span>
                <span className="metric-value">{stats?.totalPedidos || 0}</span>
              </div>
            </div>
          </div>

          {/* Fila de Gráficos */}
          <div className="charts-grid">
            {/* Resumen de Balance */}
            <div className="chart-card large-chart">
              <div className="chart-header">
                <h3>Resumen de Ventas Diarias (Mes)</h3>
                <span className="chart-period">
                  {selectedMonth.toString().padStart(2, '0')}/{selectedYear}
                </span>
              </div>
              <div className="chart-body">
                {renderLineChart()}
              </div>
            </div>

            {/* Estadísticas de Pedidos */}
            <div className="chart-card thin-chart">
              <div className="chart-header">
                <h3>Distribución de Pedidos</h3>
              </div>
              <div className="chart-body states-chart">
                <div className="states-indicators">
                  {Array.isArray(stats?.pedidosPorEstado) && stats.pedidosPorEstado.length > 0 ? (
                    stats.pedidosPorEstado.map((item, idx) => (
                      <div key={idx} className="state-indicator-row">
                        <span className={`state-bullet ${getOrderStatusBadgeClass(item.estado)}`}></span>
                        <span className="state-name">{item.estado}</span>
                        <strong className="state-qty">{item.cantidad}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="empty-section-message" style={{ padding: '1rem 0' }}>No hay registros de estados</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fila Inferior: Transacciones Recientes y Productos Más Vendidos */}
          <div className="bottom-sections-grid">
            {/* Transacciones Recientes */}
            <div className="dashboard-section-card">
              <div className="section-card-header">
                <h3>Pedidos Recientes</h3>
                <button className="btn-link" onClick={() => navigate('/admin/orders')}>Ver Todos</button>
              </div>
              <div className="table-responsive">
                <table className="recent-orders-table">
                  <thead>
                    <tr>
                      <th>N° Orden</th>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)} style={{ cursor: 'pointer' }}>
                          <td><span className="order-number">#{order.numeroOrden}</span></td>
                          <td>{order.clienteNombre || order.user?.nombreCompleto || 'Caja Presencial'}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td><strong>{formatPrice(order.total)}</strong></td>
                          <td>
                            <span className={`status-dot-badge ${getOrderStatusBadgeClass(order.estadoPago === 'pagado' ? 'entregado' : 'pendiente')}`}>
                              {order.estadoPago === 'pagado' ? 'Pagado' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="empty-table">No hay transacciones registradas</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Productos Más Vendidos */}
            <div className="dashboard-section-card">
              <div className="section-card-header">
                <h3>Productos Más Vendidos</h3>
                <button className="btn-link" onClick={() => navigate('/inventory')}>Ir a Inventario</button>
              </div>
              <div className="top-products-list">
                {stats?.topProductos && stats.topProductos.length > 0 ? (
                  stats.topProductos.map((prod, idx) => {
                    const maxUnits = Math.max(...stats.topProductos.map(p => p.totalVendido), 1);
                    const percentage = (prod.totalVendido / maxUnits) * 100;
                    return (
                      <div key={idx} className="top-product-item">
                        <div className="top-product-info">
                          <span className="product-rank">#{idx + 1}</span>
                          <span className="product-name">{prod.nombre}</span>
                          <span className="product-qty">{prod.totalVendido} u.</span>
                        </div>
                        <div className="product-progress-wrapper">
                          <div className="product-progress-bar" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <span className="product-revenue">{formatPrice(prod.totalIngresos)}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="empty-section-message">No hay registros de ventas este mes</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default AdminDashboard;
