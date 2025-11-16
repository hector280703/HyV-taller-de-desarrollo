import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProducts } from '@services/product.service.js';
import '@styles/home.css';

const Home = () => {
  const user = JSON.parse(sessionStorage.getItem('usuario')) || null;
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const products = await getProducts();
        // Obtener los primeros 6 productos para la sección destacada
        setFeaturedProducts(products.slice(0, 6));
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  const categories = [
    { name: 'Cemento y Morteros', icon: '🏗️', value: 'Cemento y Morteros' },
    { name: 'Ladrillos y Bloques', icon: '🧱', value: 'Ladrillos y Bloques' },
    { name: 'Fierro y Acero', icon: '⚙️', value: 'Fierro y Acero' },
    { name: 'Arena y Ripio', icon: '🏔️', value: 'Arena y Ripio' },
    { name: 'Madera', icon: '🪵', value: 'Madera' },
    { name: 'Pintura', icon: '🎨', value: 'Pintura' },
    { name: 'Herramientas', icon: '🔨', value: 'Herramientas' },
    { name: 'Fontanería', icon: '🚿', value: 'Fontanería' },
    { name: 'Electricidad', icon: '💡', value: 'Electricidad' },
    { name: 'Cerámica y Porcelanato', icon: '🎯', value: 'Cerámica y Porcelanato' },
  ];

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

  return (
    <div className="home-container">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <h1>🏗️ HyV Construcciones</h1>
          <p className="hero-subtitle">Materiales de Construcción</p>
          <p>Productos profesionales de alta calidad para tu obra</p>
          <button className="cta-button" onClick={() => navigate('/products')}>
            Ver Catálogo Completo
          </button>
        </div>
      </section>

      {/* Beneficios */}
      <section className="benefits-section">
        <div className="benefit-card">
          <span className="benefit-icon">🚚</span>
          <h3>Envíos a Todo Chile</h3>
          <p>Despacho rápido y seguro</p>
        </div>
        <div className="benefit-card">
          <span className="benefit-icon">💳</span>
          <h3>Pago Seguro</h3>
          <p>Múltiples medios de pago</p>
        </div>
        <div className="benefit-card">
          <span className="benefit-icon">📞</span>
          <h3>Atención Personalizada</h3>
          <p>Asesoría técnica disponible</p>
        </div>
        <div className="benefit-card">
          <span className="benefit-icon">✅</span>
          <h3>Calidad Garantizada</h3>
          <p>Productos certificados</p>
        </div>
      </section>

      {/* Categorías */}
      <section className="categories-section">
        <h2>Nuestras Categorías</h2>
        <div className="categories-grid">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className="category-card"
              onClick={() => navigate('/products')}
            >
              <span className="category-icon">{category.icon}</span>
              <h3>{category.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Productos Destacados */}
      <section className="featured-products-section">
        <h2>Productos Destacados</h2>
        {loading ? (
          <p className="loading-text">Cargando productos...</p>
        ) : featuredProducts.length > 0 ? (
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <div key={product.id} className="product-card">
                {product.imagenUrl ? (
                  <img src={product.imagenUrl} alt={product.nombre} className="product-image" />
                ) : (
                  <div className="product-image-placeholder">📦</div>
                )}
                {product.descuento > 0 && (
                  <span className="discount-badge">-{product.descuento}%</span>
                )}
                <div className="product-info">
                  <h3>{product.nombre}</h3>
                  <p className="product-category">{product.categoria || 'Sin categoría'}</p>
                  {product.marca && <p className="product-brand">{product.marca}</p>}
                  <div className="product-pricing">
                    {product.descuento > 0 ? (
                      <>
                        <span className="price-original">{formatPrice(product.precio)}</span>
                        <span className="price-discount">{formatPrice(calculateDiscountedPrice(product.precio, product.descuento))}</span>
                      </>
                    ) : (
                      <span className="price">{formatPrice(product.precio)}</span>
                    )}
                  </div>
                  <p className="product-stock">
                    {product.stock > 0 ? `✅ Disponible (${product.stock})` : '❌ Sin stock'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-products">No hay productos disponibles en este momento.</p>
        )}
        <button className="view-all-button" onClick={() => navigate('/products')}>
          Ver Todos los Productos
        </button>
      </section>

      {/* Información de Contacto */}
      <section className="contact-info-section">
        <h2>Contacto y Ubicación</h2>
        <div className="contact-details">
          <p className="company-name">HyV Construcciones</p>
          <p>📍 La Cantera N°5, Laraquete, Arauco, Región del Bío Bío, Chile</p>
          <div className="phone-numbers">
            <p>📞 +569 78187692</p>
            <p>📞 +569 58344044</p>
            <p>📞 +569 61251723</p>
          </div>
          <p>✉️ contacto@hyvconstructora.cl</p>
          <div className="social-media">
            <a href="https://www.instagram.com/constructora.hyv" target="_blank" rel="noopener noreferrer" className="social-link instagram">
              <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" className="social-icon" />
              Instagram
            </a>
            <a href="https://www.facebook.com/constructora.hyv" target="_blank" rel="noopener noreferrer" className="social-link facebook">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="social-icon" />
              Facebook
            </a>
          </div>
          <div className="company-link">
            <a href="https://hyvconstructora.cl/" target="_blank" rel="noopener noreferrer">
              🌐 ¿Quieres saber más sobre nuestra empresa? Visita nuestro sitio web
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;