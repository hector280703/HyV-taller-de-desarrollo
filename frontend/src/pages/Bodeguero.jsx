import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, updateOrderStatus, confirmPresentialDelivery } from '@services/order.service';
import { logout } from '@services/auth.service';
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from '@helpers/sweetAlert';
import { formatPrice } from '@helpers/formatData';
import PreparationChecklist from '@components/PreparationChecklist';
import Swal from 'sweetalert2';
import '@styles/bodeguero.css';

const FILTERS = [
  { key: 'pendiente',          label: 'Pendientes',        icon: '📋' },
  { key: 'procesando',         label: 'Procesando',        icon: '⚙️' },
  { key: 'listo_para_envio',   label: 'Listo para Envío',  icon: '📦' },
  { key: 'listo_para_retiro',  label: 'Listo para Retiro', icon: '🏢' },
  { key: 'todas',              label: 'Todas',             icon: '🗂️' },
];

const STATUS_TEXT = {
  pendiente:         'Pendiente',
  procesando:        'Procesando',
  listo_para_envio:  'Listo para Envío',
  listo_para_retiro: 'Listo para Retiro',
  en_camino:         'En camino',
  entregado:         'Entregado',
  cancelado:         'Cancelado',
  incidencia_stock:  'Incidencia Stock',
};

const STATUS_ICON = {
  pendiente:         '📋',
  procesando:        '⚙️',
  listo_para_envio:  '📦',
  listo_para_retiro: '🏢',
  en_camino:         '🚚',
  entregado:         '✅',
  cancelado:         '❌',
};

const METODO_PAGO = {
  efectivo:       '💵 Efectivo',
  transferencia:  '🏦 Transferencia',
  tarjeta:        '💳 Tarjeta Crédito',
  debito:         '💳 Tarjeta Débito',
  mercadopago:    '💙 Mercado Pago',
};

function Bodeguero() {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('pendiente');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating]         = useState(false);
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
      if (response.status === 'Success') setOrders(response.data);
    } catch {
      showErrorAlert('Error', 'No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (newStatus === 'listo_para_envio' || newStatus === 'listo_para_retiro') {
      setChecklistOrder(orders.find(o => o.id === orderId));
      return;
    }
    await executeStatusUpdate(orderId, newStatus);
  };

  const executeStatusUpdate = async (orderId, newStatus) => {
    if (newStatus === 'entregado') {
      const order = orders.find(o => o.id === orderId);

      if (order.tipoVenta === 'presencial') {
        const result = await Swal.fire({
          title: '🏪 Confirmar Entrega Presencial',
          html: `
            <p style="margin-bottom:12px;color:#555;">Ingresa el <strong>código de entrega</strong> que el cliente recibió por email.</p>
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
          inputValidator: (v) => {
            if (!v || !v.trim()) return 'Debe ingresar el código';
            if (v.trim().length !== 6) return 'El código debe tener 6 caracteres';
          }
        });
        if (!result.isConfirmed) return;
        try {
          setUpdating(true);
          const res = await confirmPresentialDelivery(orderId, result.value.trim());
          if (res.status === 'Success') {
            showSuccessAlert('¡Entrega confirmada!', 'La venta presencial fue entregada exitosamente.');
            fetchOrders(); setSelectedOrder(null);
          }
        } catch (err) {
          showErrorAlert('Código incorrecto', err.message || 'No se pudo confirmar la entrega');
        } finally { setUpdating(false); }
        return;
      }

      // Online
      const result = await Swal.fire({
        title: 'Entregar Pedido',
        text: 'Ingrese el código de la orden para confirmar la entrega al cliente (ej: ORD-...).',
        input: 'text',
        showCancelButton: true,
        confirmButtonText: 'Confirmar Entrega',
        cancelButtonText: 'Cancelar',
        inputValidator: (v) => {
          if (!v) return 'Debe ingresar un código';
          if (v !== order.numeroOrden) return 'El código no coincide con el número de orden';
        }
      });
      if (!result.isConfirmed) return;
    } else {
      const confirmed = await showConfirmAlert('¿Confirmar cambio?', `¿Deseas actualizar el estado de esta orden?`);
      if (!confirmed) return;
    }

    try {
      setUpdating(true);
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.status === 'Success') {
        showSuccessAlert('Estado actualizado', 'El estado de la orden se actualizó correctamente');
        fetchOrders(); setSelectedOrder(null);
      }
    } catch (err) {
      showErrorAlert('Error', err.message || 'No se pudo actualizar el estado');
    } finally { setUpdating(false); }
  };

  const getNextStatus = (order) => {
    const flow = {
      pendiente:  'procesando',
      procesando: order.tipoEntrega === 'retiro' ? 'listo_para_retiro' : 'listo_para_envio',
      listo_para_retiro: 'entregado',
    };
    return flow[order.estado];
  };

  const canUpdate = (status) => ['pendiente', 'procesando', 'listo_para_retiro'].includes(status);

  const formatDate = (d) => {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString())
      return `Hoy ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    if (date.toDateString() === yesterday.toDateString())
      return `Ayer ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const initials = user?.nombreCompleto
    ? user.nombreCompleto.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'B';

  const currentFilterLabel = FILTERS.find(f => f.key === filter)?.label ?? 'Órdenes';

  return (
    <div className="bodeguero-app">
      {/* ── TOP BAR ── */}
      <header className="bodeguero-topbar">
        <div className="bodeguero-topbar-brand">
          <img src="/logo_hyv.png" alt="HyV" onError={e => { e.currentTarget.style.display = 'none'; }} />
          <span className="bodeguero-topbar-title">🏭 Panel de Bodega</span>
          <span className="bodeguero-topbar-badge">Bodeguero</span>
        </div>
        <div className="bodeguero-topbar-user">
          <div className="bodeguero-user-avatar">{initials}</div>
          <div>
            <div className="bodeguero-user-name">{user?.nombreCompleto || 'Bodeguero'}</div>
            <div className="bodeguero-user-role">Gestor de Bodega</div>
          </div>
          <button className="bodeguero-logout-btn" onClick={() => { logout(); window.location.href = '/'; }}>
            🚪 Salir
          </button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <div className="bodeguero-main">
        {/* ── SIDEBAR ── */}
        <aside className="bodeguero-sidebar">
          <div className="bodeguero-sidebar-label">Filtrar por estado</div>
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`bodeguero-nav-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
              {filter === f.key && !loading && (
                <span className="nav-count">{orders.length}</span>
              )}
            </button>
          ))}

          <div className="bodeguero-sidebar-divider" />
          <div className="bodeguero-sidebar-label">Acciones rápidas</div>
          <button className="bodeguero-inventory-nav-btn" onClick={() => navigate('/inventory')}>
            📦 Ver Inventario
          </button>
        </aside>

        {/* ── CONTENT ── */}
        <main className="bodeguero-content">
          <div className="bodeguero-content-header">
            <div className="bodeguero-content-info">
              <h2>{currentFilterLabel}</h2>
              <p>
                {loading ? 'Cargando...' : `${orders.length} orden${orders.length !== 1 ? 'es' : ''} encontrada${orders.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="bodeguero-stats-chips">
              <span className="bodeguero-chip">🕐 {new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div className="bodeguero-orders-area">
            {loading ? (
              <div className="bwg-loading">
                <div className="bwg-spinner" />
                <p>Cargando órdenes...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bwg-empty">
                <span className="bwg-empty-emoji">📭</span>
                <p>No hay órdenes {filter !== 'todas' ? STATUS_TEXT[filter]?.toLowerCase() : ''}</p>
              </div>
            ) : (
              <div className="bodeguero-orders-grid">
                {orders.map(order => {
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <div
                      key={order.id}
                      className={`bodeguero-order-card ${isSelected ? 'selected' : ''}`}
                    >
                      {/* Card header */}
                      <div
                        className="bodeguero-card-head"
                        onClick={() => setSelectedOrder(isSelected ? null : order)}
                      >
                        <div className="bodeguero-card-left">
                          <div className="bodeguero-status-icon">
                            {STATUS_ICON[order.estado] || '📦'}
                          </div>
                          <span className="bodeguero-order-num">{order.numeroOrden}</span>
                          {order.tipoVenta === 'presencial' && (
                            <span className="bodeguero-presencial-badge">🏪 Presencial</span>
                          )}
                        </div>
                        <div className="bodeguero-card-right">
                          <span className={`bwg-badge s-${order.estado}`}>
                            {STATUS_TEXT[order.estado] || order.estado}
                          </span>
                          <span className={`bwg-chevron ${isSelected ? 'open' : ''}`}>▼</span>
                        </div>
                      </div>

                      {/* Card summary */}
                      <div className="bodeguero-card-summary">
                        <div className="bwg-info">
                          <span className="bwg-info-label">Entrega</span>
                          <span className="bwg-info-value">
                            <span className={`bwg-delivery-pill ${order.tipoEntrega === 'retiro' ? 'retiro' : 'envio'}`}>
                              {order.tipoEntrega === 'retiro' ? '🏢 Retiro' : '🚚 Despacho'}
                            </span>
                          </span>
                        </div>
                        <div className="bwg-info">
                          <span className="bwg-info-label">Cliente</span>
                          <span className="bwg-info-value">
                            {order.tipoVenta === 'presencial' ? order.clienteNombre : order.user?.nombreCompleto}
                          </span>
                        </div>
                        <div className="bwg-info">
                          <span className="bwg-info-label">Total</span>
                          <span className="bwg-info-value total">{formatPrice(order.total)}</span>
                        </div>
                        <div className="bwg-info">
                          <span className="bwg-info-label">Fecha</span>
                          <span className="bwg-info-value">{formatDate(order.createdAt)}</span>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isSelected && (
                        <div className="bodeguero-card-expanded">
                          {/* Products */}
                          <div>
                            <div className="bwg-section-head">📦 Productos</div>
                            <table className="bwg-table">
                              <thead>
                                <tr>
                                  <th>Producto</th>
                                  <th style={{ textAlign: 'center' }}>Cant.</th>
                                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.orderItems?.map((item, i) => (
                                  <tr key={i}>
                                    <td>{item.nombreProducto}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 700 }}>×{item.cantidad}</td>
                                    <td>{formatPrice(item.subtotal)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            <div className="bwg-totals">
                              <div className="bwg-total-row">
                                <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                              </div>
                              {order.descuentoTotal > 0 && (
                                <div className="bwg-total-row discount">
                                  <span>Descuento</span><span>-{formatPrice(order.descuentoTotal)}</span>
                                </div>
                              )}
                              {parseFloat(order.costoEnvio) > 0 && (
                                <div className="bwg-total-row">
                                  <span>Envío {order.zonaEnvio ? `(${order.zonaEnvio})` : ''}</span>
                                  <span>{formatPrice(order.costoEnvio)}</span>
                                </div>
                              )}
                              <div className="bwg-total-row final">
                                <span>Total</span><span>{formatPrice(order.total)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Contact & delivery */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <div className="bwg-section-head">📞 Contacto</div>
                              <div className="bwg-info">
                                <span className="bwg-info-label">Teléfono</span>
                                <span className="bwg-info-value">
                                  <a href={`tel:${order.telefonoContacto}`}>{order.telefonoContacto}</a>
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="bwg-section-head">📍 {order.tipoEntrega === 'retiro' ? 'Lugar de Retiro' : 'Dirección'}</div>
                              <div className="bwg-info">
                                <span className="bwg-info-value" style={{ whiteSpace: 'normal' }}>{order.direccionEnvio}</span>
                              </div>
                            </div>
                          </div>

                          {/* Payment */}
                          <div>
                            <div className="bwg-section-head">💳 Pago</div>
                            <span className="bwg-payment">{METODO_PAGO[order.metodoPago] || order.metodoPago}</span>
                          </div>

                          {/* Notes */}
                          {order.notas && (
                            <div>
                              <div className="bwg-section-head">📝 Notas</div>
                              <div className="bwg-notes">{order.notas}</div>
                            </div>
                          )}

                          {/* Action */}
                          {canUpdate(order.estado) && (
                            <button
                              className="bwg-action-btn"
                              onClick={e => { e.stopPropagation(); handleUpdateStatus(order.id, getNextStatus(order)); }}
                              disabled={updating}
                            >
                              {updating ? '⏳ Actualizando...' : `➡️ Mover a: ${STATUS_TEXT[getNextStatus(order)]}`}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Preparation checklist modal */}
      {checklistOrder && (
        <PreparationChecklist
          order={checklistOrder}
          onClose={() => setChecklistOrder(null)}
          onSuccess={(orderId, newStatus) => {
            setChecklistOrder(null);
            if (newStatus === 'incidencia_stock') { fetchOrders(); setSelectedOrder(null); }
            else { executeStatusUpdate(orderId, newStatus); }
          }}
        />
      )}
    </div>
  );
}

export default Bodeguero;
