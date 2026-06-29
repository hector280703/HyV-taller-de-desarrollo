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
    { name: 'Cemento y Morteros', image: 'https://www.acepconcretos.com/wp-content/uploads/2021/04/mortero-930x620.jpg', value: 'Cemento y Morteros' },
    { name: 'Ladrillos y Bloques', image: 'https://www.reformadisimo.es/wp-content/uploads/2019/10/tipos-de-ladrillos.jpg', value: 'Ladrillos y Bloques' },
    { name: 'Fierro y Acero', image: 'https://grupocasalima.com/wp-content/uploads/2022/04/tipos-de-fierros-de-construccion.webp', value: 'Fierro y Acero' },
    { name: 'Arena y Ripio', image: 'https://i0.wp.com/www.glosarioarquitectonico.com/wp-content/uploads/2015/12/ripio-1.jpg?resize=300%2C300&ssl=1', value: 'Arena y Ripio' },
    { name: 'Madera', image: 'https://b1929112.smushcdn.com/1929112/imagenes/2025/03/Tablas-de-madera-para-construccion-y-carpinteria.png?lossy=0&strip=1&webp=1', value: 'Madera' },
    { name: 'Pintura', image: 'http://www.pinturassuper.com/wp-content/uploads/2019/04/ASPECTOS-A-TENER-EN-CUENTA-PARA-COMPRAR-LA-PINTURA.jpg', value: 'Pintura' },
    { name: 'Herramientas', image: 'https://cdnx.jumpseller.com/ferreteria-mfs/image/18473713/imprescindibles.jpg.jpg?1629945732', value: 'Herramientas' },
    { name: 'Fontanería', image: 'https://www.bisermax.com/wp-content/uploads/2024/05/Herramientas-de-fontaneria.jpg', value: 'Fontanería' },
    { name: 'Electricidad', image: 'https://www.pavezmartinez.cl/wp-content/uploads/2024/11/automaticos.jpg', value: 'Electricidad' },
    { name: 'Cerámica y Porcelanato', image: 'https://www.rubi.com/es/blog/wp-content/uploads/2021/06/alicatar-una-pared-1.jpg', value: 'Cerámica y Porcelanato' },
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
          <img src="https://transporte-inmediato.com/wp-content/uploads/2020/12/entregas-a-domicilio-1080x675.jpg" alt="Envíos a Todo Chile" className="benefit-image" />
          <h3>Envíos a Todo Chile</h3>
          <p>Despacho rápido y seguro</p>
        </div>
        <div className="benefit-card">
          <img src="https://img.freepik.com/vector-gratis/concepto-pago-tarjeta-credito-pagina-inicio_52683-24768.jpg?semt=ais_hybrid&w=740&q=80" alt="Pago Seguro" className="benefit-image" />
          <h3>Pago Seguro</h3>
          <p>Múltiples medios de pago</p>
        </div>
        <div className="benefit-card">
          <img src="https://www.supermercadosruizgalan.es/documents/10180/2672051/logo+atencion.png/5fd21c0a-0bc7-48b1-8388-867085a84538?t=1612256921229" alt="Atención Personalizada" className="benefit-image" />
          <h3>Atención Personalizada</h3>
          <p>Asesoría técnica disponible</p>
        </div>
        <div className="benefit-card">
          <img src="https://www.shutterstock.com/image-vector/medal-approved-successful-icon-quality-600nw-2421797193.jpg" alt="Calidad Garantizada" className="benefit-image" />
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