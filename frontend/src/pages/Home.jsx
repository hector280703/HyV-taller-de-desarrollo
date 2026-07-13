import { useNavigate, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProducts } from '@services/product.service.js';
import { BoxIcon, MapPinIcon } from '../components/Icons';
import '@styles/home.css';

const Home = () => {
  const user = JSON.parse(sessionStorage.getItem('usuario')) || null;
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  if (user?.rol === 'administrador') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await getProducts({ limit: 6 });
        // Obtener los primeros 6 productos para la sección destacada
        setFeaturedProducts(response.products || []);
      } catch (error) {
        console.error('Error al cargar productos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  const categories = [
    { name: 'Cemento y Morteros', image: '/images/categories/cemento_y_morteros.png', value: 'Cemento y Morteros' },
    { name: 'Ladrillos y Bloques', image: '/images/categories/ladrillos_y_bloques.png', value: 'Ladrillos y Bloques' },
    { name: 'Fierro y Acero', image: '/images/categories/fierro_y_acero.png', value: 'Fierro y Acero' },
    { name: 'Arena y Ripio', image: '/images/categories/arena_y_ripio.png', value: 'Arena y Ripio' },
    { name: 'Madera', image: '/images/categories/madera.png', value: 'Madera' },
    { name: 'Pintura', image: '/images/categories/pintura.png', value: 'Pintura' },
    { name: 'Herramientas', image: '/images/categories/herramientas.png', value: 'Herramientas' },
    { name: 'Fontanería', image: '/images/categories/fontaneria.png', value: 'Fontanería' },
    { name: 'Electricidad', image: '/images/categories/electricidad.png', value: 'Electricidad' },
    { name: 'Cerámica y Porcelanato', image: '/images/categories/ceramica_y_porcelanato.png', value: 'Cerámica y Porcelanato' },
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
          <img src="/logo_hyv.png" alt="HyV Construcciones" className="hero-logo-img" />
          <h1>HyV Construcciones</h1>
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
          <img src="/images/benefits/envios.jpg" alt="Envíos a Todo Chile" className="benefit-image" />
          <h3>Envíos a Todo Chile</h3>
          <p>Despacho rápido y seguro</p>
        </div>
        <div className="benefit-card">
          <img src="/images/benefits/pago.jpg" alt="Pago Seguro" className="benefit-image" />
          <h3>Pago Seguro</h3>
          <p>Múltiples medios de pago</p>
        </div>
        <div className="benefit-card">
          <img src="/images/benefits/atencion.png" alt="Atención Personalizada" className="benefit-image" />
          <h3>Atención Personalizada</h3>
          <p>Asesoría técnica disponible</p>
        </div>
        <div className="benefit-card">
          <img src="/images/benefits/calidad.jpg" alt="Calidad Garantizada" className="benefit-image" />
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
              onClick={() => navigate('/products', { state: { categoria: category.value } })}
            >
              <img src={category.image} alt={category.name} className="category-image" />
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
              <div
                key={product.id}
                className="product-card"
                onClick={() => navigate(`/products/${product.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {product.imagenUrl ? (
                  <img src={product.imagenUrl} alt={product.nombre} className="product-image" />
                ) : (
                  <div className="product-image-placeholder">
                    <BoxIcon size={40} color="#94a3b8" />
                  </div>
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
                    {product.stock > 0 ? `Disponible (${product.stock})` : 'Sin stock'}
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
          <p>
            <MapPinIcon size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            La Cantera N°5, Laraquete, Arauco, Región del Bío Bío, Chile
          </p>
          <div className="phone-numbers">
            <p>Teléfono: +569 78187692</p>
            <p>Teléfono: +569 58344044</p>
            <p>Teléfono: +569 61251723</p>
          </div>
          <p>Correo: contacto@hyvconstructora.cl</p>
          <div className="social-media">
            <a href="https://www.instagram.com/constructora.hyv" target="_blank" rel="noopener noreferrer" className="social-link instagram">
              <img src="/images/social/instagram.png" alt="Instagram" className="social-icon" />
              Instagram
            </a>
            <a href="https://www.facebook.com/constructora.hyv" target="_blank" rel="noopener noreferrer" className="social-link facebook">
              <img src="/images/social/facebook.svg" alt="Facebook" className="social-icon" />
              Facebook
            </a>
          </div>
          <div className="company-link">
            <a href="https://hyvconstructora.cl/" target="_blank" rel="noopener noreferrer">
              ¿Quieres saber más sobre nuestra empresa? Visita nuestro sitio web
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;