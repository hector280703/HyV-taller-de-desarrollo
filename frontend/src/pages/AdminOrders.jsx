import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, updateOrderStatus, getOrderStats } from '../services/order.service.js';
import { showErrorAlert, showSuccessAlert } from '../helpers/sweetAlert.js';
import { formatPrice } from '../helpers/formatData.js';
import '../styles/adminOrders.css';

// Utilidad para exportar a CSV
const exportToCSV = (stats, orders) => {
  const lines = [];
  const fecha = new Date().toLocaleDateString('es-CL');
  const hora = new Date().toLocaleTimeString('es-CL');

  lines.push('INFORME DE ESTADÍSTICAS - HyV Construcciones');
  lines.push(`Generado el: ${fecha} a las ${hora}`);
  lines.push('');

  // Resumen general
  lines.push('=== RESUMEN GENERAL ===');
  lines.push(`Ventas Hoy,$${stats.ventasHoy || 0}`);
  lines.push(`Ventas Totales,$${stats.ventasTotales || 0}`);
  lines.push(`Pedidos Hoy,${stats.pedidosHoy || 0}`);
  lines.push(`Total Pedidos,${stats.totalPedidos || 0}`);
  lines.push('');

  // Ventas últimos 7 días
  lines.push('=== VENTAS ÚLTIMOS 7 DÍAS ===');
  lines.push('Fecha,Día,Total Ventas,Cantidad Pedidos');
  if (stats.ventasSemana) {
    stats.ventasSemana.forEach(dia => {
      lines.push(`${dia.fecha},${dia.dia},$${dia.total},${dia.cantidad}`);
    });
  }
  lines.push('');

  // Top productos
  lines.push('=== TOP 5 PRODUCTOS MÁS VENDIDOS ===');
  lines.push('Posición,Producto,Unidades Vendidas,Ingresos Totales');
  if (stats.topProductos) {
    stats.topProductos.forEach((prod, i) => {
      lines.push(`${i + 1},"${prod.nombre}",${prod.totalVendido},$${prod.totalIngresos}`);
    });
  }
  lines.push('');

  // Pedidos por estado
  lines.push('=== PEDIDOS POR ESTADO ===');
  lines.push('Estado,Cantidad');
  if (stats.pedidosPorEstado) {
    stats.pedidosPorEstado.forEach(item => {
      lines.push(`${item.estado},${item.cantidad}`);
    });
  }
  lines.push('');

  // Detalle de órdenes
  lines.push('=== DETALLE DE ÓRDENES ===');
  lines.push('Nº Orden,Cliente,Email,Fecha,Total,Estado,Método Pago,Dirección');
  orders.forEach(order => {
    const fecha = new Date(order.createdAt).toLocaleDateString('es-CL');
    lines.push(
      `"${order.numeroOrden}","${order.user?.nombreCompleto || ''}","${order.user?.email || ''}",${fecha},$${order.total},"${order.estado}","${order.metodoPago}","${(order.direccionEnvio || '').replace(/"/g, '""')}"`
    );
  });

  const BOM = '\uFEFF';
  const csvContent = BOM + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `informe_hyv_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Utilidad para exportar a PDF (generado con canvas/HTML puro)
const exportToPDF = (stats, orders, formatPriceFn) => {
  const fecha = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const hora = new Date().toLocaleTimeString('es-CL');

  // Calcular estadísticas por estado
  const estadoResumen = {};
  if (stats.pedidosPorEstado) {
    stats.pedidosPorEstado.forEach(item => {
      estadoResumen[item.estado] = parseInt(item.cantidad);
    });
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Informe HyV Construcciones</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #2c3e50; padding: 40px; background: white; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 4px solid #ff6b35; }
        .header h1 { font-size: 28px; color: #2c3e50; margin-bottom: 5px; }
        .header .subtitle { font-size: 18px; color: #ff6b35; font-weight: 600; }
        .header .date { font-size: 13px; color: #7f8c8d; margin-top: 10px; }
        .section { margin-bottom: 30px; }
        .section h2 { font-size: 18px; color: #ff6b35; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #ecf0f1; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .stat-box { background: #f8f9fa; border-radius: 10px; padding: 15px; text-align: center; border: 1px solid #ecf0f1; }
        .stat-box .label { font-size: 11px; color: #7f8c8d; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
        .stat-box .value { font-size: 22px; font-weight: bold; color: #2c3e50; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        th { background: #2c3e50; color: white; padding: 10px 12px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
        td { padding: 8px 12px; border-bottom: 1px solid #ecf0f1; }
        tr:nth-child(even) { background: #f8f9fa; }
        .badge { padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: white; }
        .badge-pendiente { background: #f39c12; }
        .badge-procesando { background: #3498db; }
        .badge-enviado { background: #9b59b6; }
        .badge-entregado { background: #27ae60; }
        .badge-cancelado { background: #e74c3c; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ecf0f1; color: #7f8c8d; font-size: 11px; }
        @media print { body { padding: 20px; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 HyV Construcciones</h1>
        <div class="subtitle">Informe de Estadísticas y Rendimiento</div>
        <div class="date">Generado el ${fecha} a las ${hora}</div>
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <div class="label">💰 Ventas Hoy</div>
          <div class="value">${formatPriceFn(stats.ventasHoy)}</div>
        </div>
        <div class="stat-box">
          <div class="label">💎 Ventas Totales</div>
          <div class="value">${formatPriceFn(stats.ventasTotales)}</div>
        </div>
        <div class="stat-box">
          <div class="label">📦 Pedidos Hoy</div>
          <div class="value">${stats.pedidosHoy || 0}</div>
        </div>
        <div class="stat-box">
          <div class="label">📋 Total Pedidos</div>
          <div class="value">${stats.totalPedidos || 0}</div>
        </div>
      </div>

      <div class="section">
        <h2>📈 Ventas Últimos 7 Días</h2>
        <table>
          <thead><tr><th>Fecha</th><th>Día</th><th>Total Ventas</th><th>Nº Pedidos</th></tr></thead>
          <tbody>
            ${(stats.ventasSemana || []).map(dia => `
              <tr>
                <td>${dia.fecha}</td>
                <td style="text-transform:capitalize">${dia.dia}</td>
                <td>${formatPriceFn(dia.total)}</td>
                <td>${dia.cantidad}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>🏆 Top 5 Productos Más Vendidos</h2>
        <table>
          <thead><tr><th>#</th><th>Producto</th><th>Uds. Vendidas</th><th>Ingresos</th></tr></thead>
          <tbody>
            ${(stats.topProductos || []).map((prod, i) => `
              <tr>
                <td><strong>${i + 1}</strong></td>
                <td>${prod.nombre}</td>
                <td>${prod.totalVendido}</td>
                <td>${formatPriceFn(prod.totalIngresos)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>📊 Distribución de Pedidos por Estado</h2>
        <table>
          <thead><tr><th>Estado</th><th>Cantidad</th><th>Porcentaje</th></tr></thead>
          <tbody>
            ${(stats.pedidosPorEstado || []).map(item => {
              const percent = stats.totalPedidos > 0 ? ((parseInt(item.cantidad) / stats.totalPedidos) * 100).toFixed(1) : 0;
              return `
                <tr>
                  <td><span class="badge badge-${item.estado}">${item.estado}</span></td>
                  <td>${item.cantidad}</td>
                  <td>${percent}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>📋 Detalle de Órdenes (${orders.length} total)</h2>
        <table>
          <thead><tr><th>Nº Orden</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Pago</th></tr></thead>
          <tbody>
            ${orders.slice(0, 50).map(order => {
              const fechaOrden = new Date(order.createdAt).toLocaleDateString('es-CL');
              return `
                <tr>
                  <td><strong>#${order.numeroOrden}</strong></td>
                  <td>${order.user?.nombreCompleto || 'N/A'}</td>
                  <td>${fechaOrden}</td>
                  <td>${formatPriceFn(order.total)}</td>
                  <td><span class="badge badge-${order.estado}">${order.estado}</span></td>
                  <td>${order.metodoPago}</td>
                </tr>
              `;
            }).join('')}
            ${orders.length > 50 ? `<tr><td colspan="6" style="text-align:center;color:#7f8c8d;">... y ${orders.length - 50} órdenes más</td></tr>` : ''}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>HyV Construcciones — La Cantera N°5, Laraquete, Arauco, Región del Bío Bío</p>
        <p>Este informe fue generado automáticamente desde el panel de administración.</p>
      </div>

      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};

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
        <div className="export-actions">
          <button
            className="btn-export btn-export-csv"
            onClick={() => {
              exportToCSV(stats, orders);
              showSuccessAlert('Exportado', 'El informe CSV se ha descargado correctamente');
            }}
            disabled={!stats}
            title="Descargar datos en formato CSV para análisis en Excel"
          >
            📄 Exportar CSV
          </button>
          <button
            className="btn-export btn-export-pdf"
            onClick={() => exportToPDF(stats, orders, formatPrice)}
            disabled={!stats}
            title="Generar informe visual en PDF para imprimir o compartir"
          >
            📑 Exportar PDF
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <p className="stat-label">Ventas Hoy</p>
                <p className="stat-value">{formatPrice(stats.ventasHoy)}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💎</div>
              <div className="stat-content">
                <p className="stat-label">Ventas Totales</p>
                <p className="stat-value">{formatPrice(stats.ventasTotales)}</p>
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
                      {dia.total > 0 ? formatPrice(dia.total) : '-'}
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
                          <span className="top-product-revenue">{formatPrice(product.totalIngresos)}</span>
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
                      <td className="total-cell">{formatPrice(order.total)}</td>
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
