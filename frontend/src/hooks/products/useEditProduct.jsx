import { useState } from 'react';
import { updateProduct } from '@services/product.service.js';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert.js';

const useEditProduct = (setProducts, fetchProducts) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [dataProduct, setDataProduct] = useState([]);
    
    const handleClickUpdate = () => {
        if (dataProduct.length > 0) {
            setIsPopupOpen(true);
        }
    };

    const handleUpdate = async (updatedProductData) => {
        if (updatedProductData && dataProduct.length > 0) {
            try {
                const response = await updateProduct(updatedProductData, dataProduct[0].id);
                
                if (response.status === 'Client error') {
                    showErrorAlert('Error', response.details || 'Error al actualizar el producto');
                    return;
                }

                showSuccessAlert('¡Actualizado!', 'El producto ha sido actualizado correctamente.');
                setIsPopupOpen(false);
                setDataProduct([]);
                
                // Recargar productos desde el servidor
                if (fetchProducts) {
                    await fetchProducts();
                } else {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Error al actualizar el producto:', error);
                showErrorAlert('Error', 'Ocurrió un error al actualizar el producto.');
            }
        }
    };

    return {
        handleClickUpdate,
        handleUpdate,
        isPopupOpen,
        setIsPopupOpen,
        dataProduct,
        setDataProduct
    };
};

export default useEditProduct;
