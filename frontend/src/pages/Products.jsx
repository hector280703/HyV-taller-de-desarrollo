import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarroCompras } from '@context/CarroComprasContext';
import { showSuccessAlert, showErrorAlert } from '@helpers/sweetAlert.js';
import useGetProducts from '@hooks/products/useGetProducts.jsx';
import useCreateProduct from '@hooks/products/useCreateProduct.jsx';
import useEditProduct from '@hooks/products/useEditProduct.jsx';
import useDeleteProduct from '@hooks/products/useDeleteProduct.jsx';
import Popup from '../components/Popup';
import DeleteIcon from '../assets/deleteIcon.svg';
import UpdateIcon from '../assets/updateIcon.svg';
import UpdateIconDisable from '../assets/updateIconDisabled.svg';
import DeleteIconDisable from '../assets/deleteIconDisabled.svg';
import '@styles/products.css';

const Products = () => {
  const user = JSON.parse(sessionStorage.getItem('usuario')) || null;
  const isAdmin = user?.rol === 'administrador';
  const navigate = useNavigate();
  const { agregarAlCarrito } = useCarroCompras();

  const {
    products,
    fetchProducts,
    setProducts,
    loading,
    search,
    setSearch,
    categoria,
    setCategoria,
    page,
    setPage,
    totalPages,
    total,
  } = useGetProducts();

  const [searchInput, setSearchInput] = useState('');
  const debounceRef = useRef(null);

  // Debounce de búsqueda (400ms)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchInput]);

  const {
    handleCreate,
    isPopupOpen: isCreatePopupOpen,
    setIsPopupOpen: setIsCreatePopupOpen
  } = useCreateProduct(setProducts, fetchProducts);

  const {
    handleClickUpdate,
    handleUpdate,
    isPopupOpen: isEditPopupOpen,
    setIsPopupOpen: setIsEditPopupOpen,
    dataProduct,
    setDataProduct
  } = useEditProduct(setProducts, fetchProducts);

  const { handleDelete } = useDeleteProduct(fetchProducts, setDataProduct);

  const handleSelectionChange = useCallback((selectedProducts) => {
    setDataProduct(selectedProducts);
  }, [setDataProduct]);

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

  const handleCategoryChange = (e) => {
    setCategoria(e.target.value);
    setPage(1);
  };

  const categories = ['Cemento y Morteros', 'Ladrillos y Bloques', 'Fierro y Acero', 'Arena y Ripio', 'Madera', 'Pintura', 'Herramientas', 'Fontanería', 'Electricidad', 'Cerámica y Porcelanato', 'Otros'];

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    if (product.stock === 0) {
      showErrorAlert('Sin stock', 'Este producto no está disponible');
      return;
    }
    agregarAlCarrito(product, 1);
    showSuccessAlert('¡Agregado!', `${product.nombre} agregado al carrito`);
  };

  // Generar array de números de página para renderizar
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(1, page - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);
      const adjustedStart = Math.max(1, end - maxVisible + 1);

      if (adjustedStart > 1) pages.push(1);
      if (adjustedStart > 2) pages.push('...');

      for (let i = adjustedStart; i <= end; i++) pages.push(i);

      if (end < totalPages - 1) pages.push('...');
      if (end < totalPages) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className='main-container'>
      <div className='table-container'>
        {!user && (
          <div className='info-banner'>
            <p>📦 Explora nuestro catálogo de materiales de construcción.</p>
          </div>
        )}
        <div className='top-table'>
          <h1 className='title-table'>Materiales de Construcción</h1>
          <div className='filter-actions'>
            <div className='search-input-wrapper'>
              <span className='search-icon'>🔍</span>
              <input
                type="text"
                className='search-input-advanced'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder='Buscar por nombre o código...'
              />
              {searchInput && (
                <button 
                  className='search-clear-btn'
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                    setPage(1);
                  }}
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
            <select 
              className='category-filter'
              value={categoria}
              onChange={handleCategoryChange}
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {isAdmin && (
              <>
                <button 
                  className='add-product-button' 
                  onClick={() => setIsCreatePopupOpen(true)}
                >
                  + Agregar Material
                </button>
                <button 
                  onClick={handleClickUpdate} 
                  disabled={dataProduct.length === 0}
                >
                  {dataProduct.length === 0 ? (
                    <img src={UpdateIconDisable} alt="edit-disabled" />
                  ) : (
                    <img src={UpdateIcon} alt="edit" />
                  )}
                </button>
                <button 
                  className='delete-product-button' 
                  disabled={dataProduct.length === 0} 
                  onClick={() => handleDelete(dataProduct)}
                >
                  {dataProduct.length === 0 ? (
                    <img src={DeleteIconDisable} alt="delete-disabled" />
                  ) : (
                    <img src={DeleteIcon} alt="delete" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Indicador de resultados */}
        {(search || categoria) && (
          <div className='search-results-info'>
            <p>
              {total} resultado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
              {search && <span> para &quot;<strong>{search}</strong>&quot;</span>}
              {categoria && <span> en <strong>{categoria}</strong></span>}
            </p>
          </div>
        )}

        {loading ? (
          <div className='products-loading'>
            <div className='products-spinner'></div>
            <p>Cargando productos...</p>
          </div>
        ) : (
          <>
            <div className='products-cards-container'>
              {products.length > 0 ? (
                products.map(product => (
                  <div key={product.id} className='product-card-catalog'>
                    <div 
                      className='product-card-clickable'
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      {product.imagenUrl ? (
                        <img src={product.imagenUrl} alt={product.nombre} className='product-card-image' />
                      ) : (
                        <div className='product-card-placeholder'>📦</div>
                      )}
                      {product.descuento > 0 && (
                        <span className='product-discount-badge'>-{product.descuento}%</span>
                      )}
                      <div className='product-card-content'>
                        <span className='product-card-category'>{product.categoria || 'Sin categoría'}</span>
                        <h3 className='product-card-title'>{product.nombre}</h3>
                        <p className='product-card-code'>Código: {product.codigo}</p>
                        {product.marca && <p className='product-card-brand'>Marca: {product.marca}</p>}
                        <p className='product-card-unit'>{product.unidadMedida}</p>
                        <div className='product-card-pricing'>
                          {product.descuento > 0 ? (
                            <>
                              <span className='product-price-original'>{formatPrice(product.precio)}</span>
                              <span className='product-price-sale'>{formatPrice(calculateDiscountedPrice(product.precio, product.descuento))}</span>
                            </>
                          ) : (
                            <span className='product-price'>{formatPrice(product.precio)}</span>
                          )}
                        </div>
                        <p className={`product-card-stock ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
                          {product.stock > 0 ? `✅ Stock: ${product.stock}` : '❌ Sin stock'}
                        </p>
                      </div>
                    </div>
                    
                    {!isAdmin && product.stock > 0 && (
                      <button 
                        className='btn-add-to-cart-card'
                        onClick={(e) => handleAddToCart(e, product)}
                      >
                        🛒 Agregar al Carrito
                      </button>
                    )}

                    {isAdmin && (
                      <div className='product-card-admin-actions'>
                        <button 
                          className='btn-edit-card'
                          onClick={(e) => {
                            e.stopPropagation();
                            setDataProduct([product]);
                            setIsEditPopupOpen(true);
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button 
                          className='btn-delete-card'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete([product]);
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className='no-products-message'>No se encontraron productos.</p>
              )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className='pagination-container'>
                <button
                  className='pagination-btn pagination-prev'
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  ← Anterior
                </button>

                <div className='pagination-numbers'>
                  {getPageNumbers().map((p, index) => (
                    p === '...' ? (
                      <span key={`dots-${index}`} className='pagination-dots'>...</span>
                    ) : (
                      <button
                        key={p}
                        className={`pagination-num ${page === p ? 'active' : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    )
                  ))}
                </div>

                <button
                  className='pagination-btn pagination-next'
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente →
                </button>

                <span className='pagination-info'>
                  Página {page} de {totalPages} ({total} productos)
                </span>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Popup para crear producto */}
      <Popup 
        show={isCreatePopupOpen} 
        setShow={setIsCreatePopupOpen} 
        data={[]} 
        action={handleCreate}
        isProductForm={true}
        isCreateMode={true}
      />
      
      {/* Popup para editar producto */}
      <Popup 
        show={isEditPopupOpen} 
        setShow={setIsEditPopupOpen} 
        data={dataProduct} 
        action={handleUpdate}
        isProductForm={true}
        isCreateMode={false}
      />
    </div>
  );
};

export default Products;
