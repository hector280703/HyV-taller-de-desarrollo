import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '@services/product.service.js';
import { useCarroCompras } from '@context/CarroComprasContext';
import { showSuccessAlert, showErrorAlert } from '@helpers/sweetAlert.js';
import Reviews from '@components/Reviews';
import '@styles/productDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { agregarAlCarrito, estaEnCarrito, obtenerCantidadItem } = useCarroCompras();
  const user = JSON.parse(sessionStorage.getItem('usuario')) || null;
  const isAdmin = user?.rol === 'administrador';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await getProduct(id);
        if (data) {
          setProduct(data);
        } else {
          setError('Producto no encontrado');
        }
      } catch (err) {
        console.error('Error al cargar el producto:', err);
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

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

  const calculateSavings = (price, discount) => {
    if (!discount || discount === 0) return 0;
    return (price * discount / 100);
  };

  const handleAddToCart = () => {
    if (product.stock === 0) {
      showErrorAlert('Sin stock', 'Este producto no está disponible');
      return;
    }
    
    const cantidadEnCarrito = obtenerCantidadItem(product.id);
    if (cantidadEnCarrito + quantity > product.stock) {
      showErrorAlert('Stock insuficiente', `Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    agregarAlCarrito(product, quantity);
    showSuccessAlert('¡Agregado!', `${product.nombre} agregado al carrito`);
  };

  const handleBuyNow = () => {
    if (product.stock === 0) {
      showErrorAlert('Sin stock', 'Este producto no está disponible');
      return;
    }
    
    agregarAlCarrito(product, quantity);
    navigate('/carroCompras');
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-container">
        <div className="error-container">
          <h2>😔 {error || 'Producto no encontrado'}</h2>
          <button className="btn-back" onClick={() => navigate('/products')}>
            ← Volver al Catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail-content">
        <button className="btn-back-top" onClick={() => navigate('/products')}>
          ← Volver al Catálogo
        </button>

        <div className="product-detail-grid">
          {/* Imagen del Producto */}
          <div className="product-image-section">
            {product.imagenUrl ? (
              <img src={product.imagenUrl} alt={product.nombre} className="product-detail-image" />
            ) : (
              <div className="product-detail-placeholder">
                <span>📦</span>
                <p>Sin imagen disponible</p>
              </div>
            )}
          </div>

          {/* Información del Producto */}
          <div className="product-info-section">
            {product.categoria && (
              <span className="product-detail-category">{product.categoria}</span>
            )}
            
            <h1 className="product-detail-title">{product.nombre}</h1>
            
            <div className="product-detail-code">
              <span className="label">Código:</span>
              <span className="value">{product.codigo}</span>
            </div>

            {product.marca && (
              <div className="product-detail-brand">
                <span className="label">Marca:</span>
                <span className="value">{product.marca}</span>
              </div>
            )}

            {/* Precio */}
            <div className="product-pricing-section">
              {product.descuento > 0 ? (
                <>
                  <div className="discount-info">
                    <span className="discount-badge-large">-{product.descuento}% OFF</span>
                  </div>
                  <div className="price-original-large">{formatPrice(product.precio)}</div>
                  <div className="price-sale-large">{formatPrice(calculateDiscountedPrice(product.precio, product.descuento))}</div>
                  <div className="savings-info">
                    ¡Ahorras {formatPrice(calculateSavings(product.precio, product.descuento))}!
                  </div>
                </>
              ) : (
                <div className="price-large">{formatPrice(product.precio)}</div>
              )}
            </div>

            {/* Stock y Disponibilidad */}
            <div className="stock-section">
              {product.stock > 0 ? (
                <>
                  <div className="stock-available">
                    <span className="stock-icon">✅</span>
                    <span className="stock-text">Disponible ({product.stock} unidades)</span>
                  </div>
                  {product.stock < 10 && (
                    <div className="low-stock-warning">
                      ⚠️ ¡Últimas unidades disponibles!
                    </div>
                  )}
                </>
              ) : (
                <div className="stock-unavailable">
                  <span className="stock-icon">❌</span>
                  <span className="stock-text">Sin stock</span>
                </div>
              )}
            </div>

            {/* Cantidad y Botones de Compra */}
            {product.stock > 0 && (
              <div className="purchase-section">
                <div className="quantity-selector">
                  <label>Cantidad:</label>
                  <div className="quantity-controls-detail">
                    <button 
                      className="qty-btn-detail"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      min="1"
                      max={product.stock}
                      onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="quantity-input-detail"
                    />
                    <button 
                      className="qty-btn-detail"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="action-buttons">
                  <button className="btn-add-to-cart" onClick={handleAddToCart}>
                    🛒 Agregar al Carrito
                  </button>
                  <button className="btn-buy-now" onClick={handleBuyNow}>
                    ⚡ Comprar Ahora
                  </button>
                </div>

                {estaEnCarrito(product.id) && (
                  <div className="in-cart-notice">
                    ✓ Ya tienes {obtenerCantidadItem(product.id)} unidad(es) en el carrito
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Detalles Técnicos */}
        <div className="product-details-section">
          <h2>Detalles del Producto</h2>
          
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Unidad de Medida:</span>
              <span className="detail-value">{product.unidadMedida || 'No especificado'}</span>
            </div>

            {product.peso && (
              <div className="detail-item">
                <span className="detail-label">Peso:</span>
                <span className="detail-value">{product.peso} kg</span>
              </div>
            )}

            {product.dimensiones && (
              <div className="detail-item">
                <span className="detail-label">Dimensiones:</span>
                <span className="detail-value">{product.dimensiones}</span>
              </div>
            )}

            <div className="detail-item">
              <span className="detail-label">Estado:</span>
              <span className={`detail-value ${product.activo ? 'active' : 'inactive'}`}>
                {product.activo ? '✅ Activo' : '❌ Inactivo'}
              </span>
            </div>
          </div>

          {product.descripcion && (
            <div className="description-section">
              <h3>Descripción</h3>
              <p>{product.descripcion}</p>
            </div>
          )}
        </div>

        {/* Información Adicional */}
        <div className="additional-info">
          <div className="info-card">
            <span className="info-icon">🚚</span>
            <h4>Envío a Todo Chile</h4>
            <p>Despacho disponible a todas las regiones</p>
          </div>
          <div className="info-card">
            <span className="info-icon">💳</span>
            <h4>Múltiples Formas de Pago</h4>
            <p>Efectivo, transferencia y tarjetas</p>
          </div>
          <div className="info-card">
            <span className="info-icon">📞</span>
            <h4>Asesoría Técnica</h4>
            <p>Expertos disponibles para ayudarte</p>
          </div>
        </div>

        {/* Reviews Section */}
        <Reviews productId={id} user={user} />

        {/* Contacto HyV Construcciones */}
        <div className="contact-section">
          <h2>Contáctanos</h2>
          <div className="contact-info-detail">
            <p className="company-name-detail">HyV Construcciones</p>
            <p className="contact-item">📍 La Cantera N°5, Laraquete, Arauco, Región del Bío Bío, Chile</p>
            <div className="phone-group">
              <p className="contact-item">📞 +569 78187692</p>
              <p className="contact-item">📞 +569 58344044</p>
              <p className="contact-item">📞 +569 61251723</p>
            </div>
            <p className="contact-item">✉️ contacto@hyvconstructora.cl</p>
            <div className="social-media-detail">
              <a href="https://www.instagram.com/constructora.hyv" target="_blank" rel="noopener noreferrer" className="social-link-detail instagram">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" className="social-icon-detail" />
                Instagram
              </a>
              <a href="https://www.facebook.com/constructora.hyv" target="_blank" rel="noopener noreferrer" className="social-link-detail facebook">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="social-icon-detail" />
                Facebook
              </a>
            </div>
            <div className="website-link">
              <a href="https://hyvconstructora.cl/" target="_blank" rel="noopener noreferrer">
                🌐 Visita nuestro sitio web
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
