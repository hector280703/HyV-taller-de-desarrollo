import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarroCompras } from '../context/CarroComprasContext';
import { createOrder } from '../services/order.service.js';
import { showErrorAlert, showSuccessAlert } from '../helpers/sweetAlert.js';
import '../styles/checkout.css';

export default function Checkout() {
  const navigate = useNavigate();
  const { carrito, totalCarrito, vaciarCarrito } = useCarroCompras();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    direccionEnvio: '',
    telefonoContacto: '',
    metodoPago: 'efectivo',
    notas: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de carrito vacío
    if (carrito.length === 0) {
      showErrorAlert('Carrito vacío', 'Agrega productos antes de finalizar la compra');
      return;
    }

    // Validación de dirección
    const direccion = formData.direccionEnvio.trim();
    if (!direccion || direccion.length < 10) {
      showErrorAlert('Dirección inválida', 'La dirección debe tener al menos 10 caracteres y ser descriptiva (calle, número, comuna, ciudad)');
      return;
    }
    if (direccion.length > 500) {
      showErrorAlert('Dirección muy larga', 'La dirección no debe exceder 500 caracteres');
      return;
    }

    // Validación de teléfono mejorada
    const telefono = formData.telefonoContacto.trim();
    if (!telefono) {
      showErrorAlert('Teléfono requerido', 'Debes ingresar un teléfono de contacto');
      return;
    }
    // Acepta formatos: +56912345678, 912345678, +56 9 1234 5678, 9-1234-5678
    if (!/^\+?[\d\s-]{8,20}$/.test(telefono)) {
      showErrorAlert('Teléfono inválido', 'Ingresa un número de teléfono válido (ej: +56 9 1234 5678)');
      return;
    }

    // Validación de método de pago
    if (!formData.metodoPago) {
      showErrorAlert('Método de pago requerido', 'Selecciona un método de pago');
      return;
    }

    // Validación de notas (opcional)
    if (formData.notas && formData.notas.length > 1000) {
      showErrorAlert('Notas muy largas', 'Las notas no deben exceder 1000 caracteres');
      return;
    }

    setLoading(true);

    try {
      const items = carrito.map(item => ({
        productId: item.id,
        cantidad: item.quantity || item.cantidad
      }));

      const orderData = {
        items,
        metodoPago: formData.metodoPago,
        direccionEnvio: direccion,
        telefonoContacto: telefono,
        notas: formData.notas?.trim() || undefined,
      };

      const response = await createOrder(orderData);
      
      vaciarCarrito();
      
      showSuccessAlert(
        '¡Pedido realizado exitosamente!',
        `Tu orden #${response.data.numeroOrden} ha sido creada. Pronto recibirás confirmación.`
      );
      
      navigate('/orders');
    } catch (error) {
      console.error('Error al crear orden:', error);
      const errorMessage = error.message || error.details || 'Ocurrió un error al procesar tu pedido. Por favor intenta nuevamente.';
      showErrorAlert('Error al procesar pedido', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calcularSubtotal = () => {
    return carrito.reduce((acc, item) => acc + (item.precio * (item.quantity || item.cantidad)), 0);
  };

  const calcularDescuentos = () => {
    return carrito.reduce((acc, item) => {
      const descuento = item.descuento || 0;
      return acc + (item.precio * descuento / 100 * (item.quantity || item.cantidad));
    }, 0);
  };

  if (carrito.length === 0) {
    return (
      <div className="checkout-container">
        <div className="checkout-empty">
          <h2>Carrito Vacío</h2>
          <p>No tienes productos en tu carrito</p>
          <button onClick={() => navigate('/products')} className="btn-primary">
            Ver Productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        <div className="checkout-summary">
          <h2>Resumen del Pedido</h2>
          <div className="order-items">
            {carrito.map((item) => {
              const precioConDescuento = item.precio - (item.precio * (item.descuento || 0) / 100);
              return (
                <div key={item.id} className="order-item">
                  <img src={item.imagenes?.[0] || '/placeholder.png'} alt={item.nombre} />
                  <div className="item-details">
                    <h4>{item.nombre}</h4>
                    <p>Cantidad: {item.quantity || item.cantidad}</p>
                    {item.descuento > 0 && (
                      <span className="item-discount">{item.descuento}% OFF</span>
                    )}
                  </div>
                  <div className="item-price">
                    {item.descuento > 0 && (
                      <span className="price-original">${item.precio.toLocaleString('es-CL')}</span>
                    )}
                    <span className="price-final">
                      ${precioConDescuento.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${calcularSubtotal().toLocaleString('es-CL')}</span>
            </div>
            {calcularDescuentos() > 0 && (
              <div className="total-row discount">
                <span>Descuentos:</span>
                <span>-${calcularDescuentos().toLocaleString('es-CL')}</span>
              </div>
            )}
            <div className="total-row total">
              <span>Total:</span>
              <span>${totalCarrito.toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>

        <div className="checkout-form-container">
          <h2>Información de Envío</h2>
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-group">
              <label htmlFor="direccionEnvio">Dirección de Envío *</label>
              <textarea
                id="direccionEnvio"
                name="direccionEnvio"
                value={formData.direccionEnvio}
                onChange={handleChange}
                placeholder="Ej: Av. Libertador 1234, Depto 501, Viña del Mar, Región de Valparaíso"
                required
                minLength={10}
                maxLength={500}
                rows={3}
              />
              <small className="form-help">
                Incluye calle, número, depto/casa, comuna y ciudad ({formData.direccionEnvio.length}/500)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="telefonoContacto">Teléfono de Contacto *</label>
              <input
                type="tel"
                id="telefonoContacto"
                name="telefonoContacto"
                value={formData.telefonoContacto}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                required
                maxLength={20}
              />
              <small className="form-help">
                Formato: +56 9 XXXX XXXX (incluye código de país)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="metodoPago">Método de Pago *</label>
              <select
                id="metodoPago"
                name="metodoPago"
                value={formData.metodoPago}
                onChange={handleChange}
                required
              >
                <option value="efectivo">💵 Efectivo (pago contra entrega)</option>
                <option value="transferencia">🏦 Transferencia Bancaria</option>
                <option value="tarjeta">💳 Tarjeta de Crédito</option>
                <option value="debito">💳 Tarjeta de Débito</option>
              </select>
              <small className="form-help">
                Selecciona tu forma de pago preferida
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="notas">Notas del Pedido (Opcional)</label>
              <textarea
                id="notas"
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                placeholder="Indicaciones adicionales para la entrega, horario preferido, etc."
                maxLength={1000}
                rows={3}
              />
              <small className="form-help">
                Información adicional para el repartidor ({formData.notas.length}/1000)
              </small>
            </div>

            <div className="checkout-actions">
              <button
                type="button"
                onClick={() => navigate('/carroCompras')}
                className="btn-secondary"
                disabled={loading}
              >
                Volver al Carrito
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Finalizar Pedido'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
