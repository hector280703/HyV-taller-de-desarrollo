import { useNavigate } from 'react-router-dom';
import { useCarroCompras } from '@context/CarroComprasContext';
import { showSuccessAlert, showErrorAlert } from '@helpers/sweetAlert.js';
import '@styles/carroCompras.css';

const CarroCompras = () => {
  const navigate = useNavigate();
  const { carroCompras, eliminarDelCarrito, actualizarCantidad, vaciarCarrito, obtenerTotal } = useCarroCompras();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const calculateDiscountedPrice = (price, discount) => {
    if (!discount || discount === 0) return price;
    return price - (price * discount / 100);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    actualizarCantidad(productId, newQuantity);
  };

  const handleRemoveItem = (productId, productName) => {
    eliminarDelCarrito(productId);
    showSuccessAlert('Eliminado', `${productName} ha sido eliminado del carrito`);
  };

  const handleClearCart = () => {
    if (carroCompras.length === 0) return;
    vaciarCarrito();
    showSuccessAlert('Carrito vacío', 'Se han eliminado todos los productos del carrito');
  };

  const handleCheckout = () => {
    if (carroCompras.length === 0) {
      showErrorAlert('Carrito vacío', 'Agrega productos al carrito antes de finalizar la compra');
      return;
    }
    navigate('/checkout');
  };

  if (carroCompras.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-empty">
          <div className="empty-cart-icon">🛒</div>
          <h2>Tu carrito está vacío</h2>
          <p>¡Explora nuestro catálogo y agrega productos!</p>
          <button className="btn-continue-shopping" onClick={() => navigate('/products')}>
            Ver Productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-content">
        <div className="cart-header">
          <h1>🛒 Mi Carrito</h1>
          <button className="btn-clear-cart" onClick={handleClearCart}>
            Vaciar Carrito
          </button>
        </div>

        <div className="cart-layout">
          <div className="cart-items-section">
            {carroCompras.map(item => {
              const itemPrice = calculateDiscountedPrice(item.precio, item.descuento);
              const itemTotal = itemPrice * item.quantity;

              return (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-image" onClick={() => navigate(`/products/${item.id}`)}>
                    {item.imagenUrl ? (
                      <img src={item.imagenUrl} alt={item.nombre} />
                    ) : (
                      <div className="cart-item-placeholder">📦</div>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <h3 
                      className="cart-item-name" 
                      onClick={() => navigate(`/products/${item.id}`)}
                    >
                      {item.nombre}
                    </h3>
                    <p className="cart-item-code">Código: {item.codigo}</p>
                    {item.marca && <p className="cart-item-brand">Marca: {item.marca}</p>}
                    <p className="cart-item-category">{item.categoria}</p>
                    
                    {item.descuento > 0 && (
                      <div className="cart-item-discount">
                        <span className="discount-badge">-{item.descuento}%</span>
                        <span className="original-price">{formatPrice(item.precio)}</span>
                      </div>
                    )}
                  </div>

                  <div className="cart-item-quantity">
                    <label>Cantidad:</label>
                    <div className="quantity-controls">
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        min="1"
                        max={item.stock}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                        className="quantity-input"
                      />
                      <button 
                        className="qty-btn"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        +
                      </button>
                    </div>
                    <p className="stock-info">Stock disponible: {item.stock}</p>
                  </div>

                  <div className="cart-item-price">
                    <p className="unit-price">{formatPrice(itemPrice)} c/u</p>
                    <p className="total-price">{formatPrice(itemTotal)}</p>
                  </div>

                  <button 
                    className="btn-remove-item"
                    onClick={() => handleRemoveItem(item.id, item.nombre)}
                    title="Eliminar producto"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <h2>Resumen del Pedido</h2>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>Productos ({carroCompras.length})</span>
                <span>{carroCompras.reduce((acc, item) => acc + item.quantity, 0)} unidades</span>
              </div>
              
              <div className="summary-row subtotal">
                <span>Subtotal</span>
                <span>{formatPrice(obtenerTotal())}</span>
              </div>

              <div className="summary-info">
                <p>💡 El costo de envío se calculará al finalizar la compra</p>
              </div>

              <div className="summary-row total">
                <span>Total</span>
                <span>{formatPrice(obtenerTotal())}</span>
              </div>
            </div>

            <button className="btn-checkout" onClick={handleCheckout}>
              Finalizar Compra
            </button>

            <button className="btn-continue-shopping-secondary" onClick={() => navigate('/products')}>
              ← Seguir Comprando
            </button>

            <div className="payment-methods">
              <p>Métodos de pago aceptados:</p>
              <div className="payment-icons">
                <span>💳</span>
                <span>💵</span>
                <span>🏦</span>
              </div>
            </div>

            <div className="contact-info-summary">
              <h3>¿Necesitas ayuda?</h3>
              <p>📞 +569 78187692</p>
              <p>✉️ contacto@hyvconstructora.cl</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarroCompras;
