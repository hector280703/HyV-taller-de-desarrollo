import { useState } from 'react';
import { createProduct } from '@services/product.service.js';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert.js';

const useCreateProduct = (setProducts, fetchProducts) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleCreate = async (newProductData) => {
        if (newProductData) {
            try {
                const response = await createProduct(newProductData);
                
                if (response.status === 'Client error') {
                    showErrorAlert('Error', response.details || 'Error al crear el producto');
                    return;
                }

                showSuccessAlert('¡Creado!', 'El producto ha sido creado correctamente.');
                setIsPopupOpen(false);
                
                // Recargar productos desde el servidor
                if (fetchProducts) {
                    await fetchProducts();
                } else {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Error al crear el producto:', error);
                showErrorAlert('Error', 'Ocurrió un error al crear el producto.');
            }
        }
    };

    return {
        handleCreate,
        isPopupOpen,
        setIsPopupOpen
    };
};

export default useCreateProduct;
