import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, updateOrderStatus, getOrderStats } from '../services/order.service.js';
import { getLowStockProducts } from '../services/product.service.js';
import { showErrorAlert, showSuccessAlert } from '../helpers/sweetAlert.js';
import { formatPrice } from '../helpers/formatData.js';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import CountUp from '../components/CountUp.jsx';
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
  lines.push(`Ventas Mes (${stats.mesSeleccionado}),$${stats.ventasMes || 0}`);
  lines.push(`Ventas Totales,$${stats.ventasTotales || 0}`);
  lines.push(`Pedidos Hoy,${stats.pedidosHoy || 0}`);
  lines.push(`Pedidos Mes (${stats.mesSeleccionado}),${stats.pedidosMes || 0}`);
  lines.push(`Total Pedidos,${stats.totalPedidos || 0}`);
  lines.push('');

  // Ventas Anuales
  lines.push(`=== VENTAS MENSUALES (${stats.anioSeleccionado}) ===`);
  lines.push('Mes,Total Ventas,Cantidad Pedidos');
  if (stats.ventasMensualesAnio) {
    stats.ventasMensualesAnio.forEach(mes => {
      lines.push(`${mes.mes},$${mes.total},${mes.cantidad}`);
    });
  }
  lines.push('');

  // Ventas Diarias
  lines.push(`=== VENTAS DIARIAS (${stats.mesSeleccionado}) ===`);
  lines.push('Día,Total Ventas,Cantidad Pedidos');
  if (stats.ventasDiariasMes) {
    stats.ventasDiariasMes.forEach(dia => {
      lines.push(`${dia.dia},$${dia.total},${dia.cantidad}`);
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
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
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
          <div class="label">📅 Ventas Mes (${stats.mesSeleccionado})</div>
          <div class="value">${formatPriceFn(stats.ventasMes)}</div>
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
          <div class="label">📊 Pedidos Mes (${stats.mesSeleccionado})</div>
          <div class="value">${stats.pedidosMes || 0}</div>
        </div>
        <div class="stat-box">
          <div class="label">📋 Total Pedidos</div>
          <div class="value">${stats.totalPedidos || 0}</div>
        </div>
      </div>

      <div class="section">
        <h2>📆 Ventas Mensuales (Año ${stats.anioSeleccionado})</h2>
        <table>
          <thead><tr><th>Mes</th><th>Total Ventas</th><th>Nº Pedidos</th></tr></thead>
          <tbody>
            ${(stats.ventasMensualesAnio || []).map(mes => `
              <tr>
                <td>${mes.mes}</td>
                <td>${formatPriceFn(mes.total)}</td>
                <td>${mes.cantidad}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>📈 Ventas Diarias (Mes ${stats.mesSeleccionado})</h2>
        <table>
          <thead><tr><th>Día</th><th>Total Ventas</th><th>Nº Pedidos</th></tr></thead>
          <tbody>
            ${(stats.ventasDiariasMes || []).map(dia => `
              <tr>
                <td>Día ${dia.dia}</td>
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
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [selectedMonthStr, setSelectedMonthStr] = useState(defaultMonth);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, [selectedMonthStr]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      let mes, anio;
      if (selectedMonthStr) {
        [anio, mes] = selectedMonthStr.split('-');
      }

      const [ordersResponse, statsResponse, lowStockData] = await Promise.all([
        getOrders(),
        getOrderStats(mes, anio),
        getLowStockProducts()
      ]);
      setOrders(ordersResponse.data || []);
      setStats(statsResponse.data || {});
      setLowStockProducts(lowStockData || []);
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

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter ? order.estado === filter : true;
    const matchesSearch = searchTerm 
      ? (
          order.numeroOrden?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          order.user?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        ) 
      : true;
    return matchesFilter && matchesSearch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handleCopyOrderNumber = (numeroOrden) => {
    navigator.clipboard.writeText(numeroOrden);
    showSuccessAlert('Copiado', 'Número de orden copiado al portapapeles');
  };

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
          <div className="month-selector">
            <input 
              type="month" 
              value={selectedMonthStr} 
              onChange={(e) => setSelectedMonthStr(e.target.value)} 
              className="month-input"
              title="Seleccionar mes para filtrar estadísticas"
            />
          </div>
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

      {/* Sección de Alertas de Stock */}
      {lowStockProducts.length > 0 && (
        <div className="stock-alerts-section">
          <div className="stock-alerts-header">
            <span className="stock-alerts-icon">🚨</span>
            <div>
              <h2 className="stock-alerts-title">Alertas de Stock</h2>
              <p className="stock-alerts-subtitle">
                {lowStockProducts.filter(p => p.sinStock).length > 0 && (
                  <span className="stock-count sin-stock-count">
                    {lowStockProducts.filter(p => p.sinStock).length} sin stock
                  </span>
                )}
                {lowStockProducts.filter(p => !p.sinStock).length > 0 && (
                  <span className="stock-count bajo-stock-count">
                    {lowStockProducts.filter(p => !p.sinStock).length} stock bajo
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="stock-alerts-grid">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className={`stock-alert-card ${product.sinStock ? 'alert-sin-stock' : 'alert-stock-bajo'}`}
              >
                <div className="stock-alert-card-icon">
                  {product.sinStock ? '❌' : '⚠️'}
                </div>
                <div className="stock-alert-card-info">
                  <span className="stock-alert-card-name">{product.nombre}</span>
                  {product.categoria && (
                    <span className="stock-alert-card-category">{product.categoria}</span>
                  )}
                </div>
                <div className={`stock-alert-card-badge ${product.sinStock ? 'badge-sin-stock' : 'badge-stock-bajo'}`}>
                  {product.sinStock ? 'SIN STOCK' : `${product.stock} uds`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <p className="stat-label">Ventas Hoy</p>
                <p className="stat-value"><CountUp end={stats.ventasHoy} isCurrency={true} /></p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <p className="stat-label">Ventas Mes ({stats.mesSeleccionado})</p>
                <p className="stat-value"><CountUp end={stats.ventasMes} isCurrency={true} /></p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💎</div>
              <div className="stat-content">
                <p className="stat-label">Ventas Totales</p>
                <p className="stat-value"><CountUp end={stats.ventasTotales} isCurrency={true} /></p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <p className="stat-label">Pedidos Hoy</p>
                <p className="stat-value"><CountUp end={stats.pedidosHoy} /></p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <p className="stat-label">Pedidos Mes ({stats.mesSeleccionado})</p>
                <p className="stat-value"><CountUp end={stats.pedidosMes} /></p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <p className="stat-label">Total Pedidos</p>
                <p className="stat-value"><CountUp end={stats.totalPedidos} /></p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-grid">
            {/* Monthly Sales Chart (Year) */}
            <div className="chart-card recharts-card" style={{ gridColumn: '1 / -1' }}>
              <h3 className="chart-title">📆 Ventas Mensuales (Año {stats.anioSeleccionado})</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={stats.ventasMensualesAnio || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecf0f1" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#7f8c8d', fontSize: 12}} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#7f8c8d', fontSize: 12}}
                      tickFormatter={(value) => `$${(value/1000)}k`}
                    />
                    <RechartsTooltip 
                      formatter={(value) => formatPrice(value)}
                      labelStyle={{color: '#2c3e50', fontWeight: 'bold'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="total" fill="#3498db" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Sales Chart (Month) */}
            <div className="chart-card recharts-card" style={{ gridColumn: '1 / -1' }}>
              <h3 className="chart-title">📈 Ventas Diarias (Mes {stats.mesSeleccionado})</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={stats.ventasDiariasMes || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotalDiario" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecf0f1" />
                    <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{fill: '#7f8c8d', fontSize: 12}} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#7f8c8d', fontSize: 12}}
                      tickFormatter={(value) => `$${(value/1000)}k`}
                    />
                    <RechartsTooltip 
                      formatter={(value) => formatPrice(value)}
                      labelStyle={{color: '#2c3e50', fontWeight: 'bold'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}
                    />
                    <Area type="monotone" dataKey="total" stroke="#ff6b35" strokeWidth={3} fillOpacity={1} fill="url(#colorTotalDiario)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            <div className="chart-card recharts-card">
              <h3 className="chart-title">🏆 Productos Más Vendidos</h3>
              {stats.topProductos?.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={stats.topProductos} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ecf0f1" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{fill: '#2c3e50', fontSize: 11, width: 100}} width={100} />
                      <RechartsTooltip 
                        formatter={(value) => `${value} uds`}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}
                      />
                      <Bar dataKey="totalVendido" fill="#3498db" radius={[0, 4, 4, 0]}>
                        {stats.topProductos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#ff6b35', '#f39c12', '#3498db', '#9b59b6', '#2ecc71'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="no-data">No hay datos de productos aún</div>
              )}
            </div>

            {/* Orders by Status */}
            <div className="chart-card recharts-card">
              <h3 className="chart-title">📊 Pedidos por Estado</h3>
              <div style={{ width: '100%', height: 300 }}>
                {stats.pedidosPorEstado?.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={stats.pedidosPorEstado.map(item => ({...item, value: parseInt(item.cantidad)}))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="estado"
                      >
                        {stats.pedidosPorEstado.map((entry, index) => {
                          const colors = {
                            pendiente: '#f39c12',
                            procesando: '#3498db',
                            enviado: '#9b59b6',
                            entregado: '#27ae60',
                            cancelado: '#e74c3c'
                          };
                          return <Cell key={`cell-${index}`} fill={colors[entry.estado] || '#95a5a6'} />;
                        })}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => `${value} pedidos`}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="no-data">No hay pedidos registrados</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Orders Table */}
      <div className="orders-section">
        <div className="section-header">
          <h2>Listado de Pedidos</h2>
          <div className="orders-actions-header">
            <div className="search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar cliente, orden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
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
        </div>

        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>No se encontraron pedidos {filter && `en estado "${filter}"`} {searchTerm && `con búsqueda "${searchTerm}"`}</p>
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
                {currentOrders.map((order) => {
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
                      <td className="order-number">
                        #{order.numeroOrden}
                        <button 
                          className="btn-copy-mini" 
                          onClick={() => handleCopyOrderNumber(order.numeroOrden)}
                          title="Copiar N° Orden"
                        >
                          📋
                        </button>
                      </td>
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
                          <a href={`mailto:${order.user?.email}`} className="btn-email-mini" title="Enviar correo">📧</a>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <button 
                  className="btn-page" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Anterior
                </button>
                <span className="page-info">Página {currentPage} de {totalPages}</span>
                <button 
                  className="btn-page" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
