import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGetProducts from '@hooks/products/useGetProducts.jsx';
import useCreateProduct from '@hooks/products/useCreateProduct.jsx';
import useEditProduct from '@hooks/products/useEditProduct.jsx';
import useDeleteProduct from '@hooks/products/useDeleteProduct.jsx';
import Search from '../components/Search';
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

  const { products, fetchProducts, setProducts } = useGetProducts();
  const [filterCodigo, setFilterCodigo] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const {
    handleCreate,
    isPopupOpen: isCreatePopupOpen,
    setIsPopupOpen: setIsCreatePopupOpen
  } = useCreateProduct(setProducts);

  const {
    handleClickUpdate,
    handleUpdate,
    isPopupOpen: isEditPopupOpen,
    setIsPopupOpen: setIsEditPopupOpen,
    dataProduct,
    setDataProduct
  } = useEditProduct(setProducts);

  const { handleDelete } = useDeleteProduct(fetchProducts, setDataProduct);

  const handleCodigoFilterChange = (e) => {
    setFilterCodigo(e.target.value);
  };

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

  const filteredProducts = products.filter(product => {
    const matchesCode = filterCodigo === '' || product.codigo?.toLowerCase().includes(filterCodigo.toLowerCase());
    const matchesCategory = filterCategory === '' || product.categoria === filterCategory;
    return matchesCode && matchesCategory;
  });

  const categories = ['Cemento y Morteros', 'Ladrillos y Bloques', 'Fierro y Acero', 'Arena y Ripio', 'Madera', 'Pintura', 'Herramientas', 'Fontanería', 'Electricidad', 'Cerámica y Porcelanato', 'Otros'];

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
            <Search 
              value={filterCodigo} 
              onChange={handleCodigoFilterChange} 
              placeholder={'Filtrar por código'} 
            />
            <select 
              className='category-filter'
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
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

        <div className='products-cards-container'>
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
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
