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
    
    if (carrito.length === 0) {
      showErrorAlert('El carrito está vacío', 'Agrega productos antes de finalizar la compra');
      return;
    }

    if (!formData.direccionEnvio || formData.direccionEnvio.length < 10) {
      showErrorAlert('Dirección inválida', 'La dirección debe tener al menos 10 caracteres');
      return;
    }

    if (!formData.telefonoContacto || !/^\+?[\d\s-]{8,15}$/.test(formData.telefonoContacto)) {
      showErrorAlert('Teléfono inválido', 'Ingresa un número de teléfono válido');
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
        direccionEnvio: formData.direccionEnvio,
        telefonoContacto: formData.telefonoContacto,
        notas: formData.notas || undefined,
      };

      const response = await createOrder(orderData);
      
      vaciarCarrito();
      
      showSuccessAlert(
        '¡Pedido realizado!',
        `Tu orden ${response.data.numeroOrden} ha sido creada exitosamente`
      );
      
      navigate('/orders');
    } catch (error) {
      console.error('Error al crear orden:', error);
      showErrorAlert(
        'Error al procesar pedido',
        error.message || 'Ocurrió un error al procesar tu pedido'
      );
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
                placeholder="Calle, número, departamento, comuna, ciudad"
                required
                rows={3}
              />
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
              />
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
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="tarjeta">Tarjeta de Crédito</option>
                <option value="debito">Tarjeta de Débito</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notas">Notas del Pedido (Opcional)</label>
              <textarea
                id="notas"
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                placeholder="Indicaciones adicionales para la entrega"
                rows={3}
              />
            </div>

            <div className="checkout-actions">
              <button
                type="button"
                onClick={() => navigate('/carro')}
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
