import Table from '@components/Table';
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
import { useCallback, useState } from 'react';
import '@styles/products.css';

const Products = () => {
  const user = JSON.parse(sessionStorage.getItem('usuario')) || null;
  
  // Debug: Verificar usuario
  console.log('Usuario actual:', user);
  console.log('Rol del usuario:', user?.rol);

  const { products, fetchProducts, setProducts } = useGetProducts();
  const [filterCodigo, setFilterCodigo] = useState('');

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

  const columns = [
    { title: "Código", field: "codigo", width: 150, responsive: 0 },
    { title: "Nombre", field: "nombre", width: 250, responsive: 0 },
    { title: "Descripción", field: "descripcion", width: 300, responsive: 3 },
    { title: "Precio", field: "precio", width: 120, responsive: 2 },
    { title: "Stock", field: "stock", width: 100, responsive: 2 },
    { title: "Categoría", field: "categoria", width: 150, responsive: 3 },
    { title: "Estado", field: "activo", width: 100, responsive: 2 }
  ];

  return (
    <div className='main-container'>
      <div className='table-container'>
        <div className='top-table'>
          <h1 className='title-table'>Gestión de Productos</h1>
          <div className='filter-actions'>
            <Search 
              value={filterCodigo} 
              onChange={handleCodigoFilterChange} 
              placeholder={'Filtrar por código'} 
            />
            <button 
              className='add-product-button' 
              onClick={() => setIsCreatePopupOpen(true)}
            >
              + Nuevo Producto
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
          </div>
        </div>
        <Table
          data={Array.isArray(products) ? products : []}
          columns={columns}
          filter={filterCodigo}
          dataToFilter={'codigo'}
          initialSortName={'nombre'}
          onSelectionChange={handleSelectionChange}
        />
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
