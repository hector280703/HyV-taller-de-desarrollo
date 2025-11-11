import { useState, useEffect } from 'react';
import { getProducts } from '@services/product.service.js';

const useGetProducts = () => {
    const [products, setProducts] = useState([]);

    const fetchProducts = async () => {
        try {
            const response = await getProducts();
            // Asegurarse de que siempre sea un array
            if (Array.isArray(response)) {
                setProducts(response);
            } else {
                console.log('Respuesta no es un array:', response);
                setProducts([]);
            }
        } catch (error) {
            console.error("Error al obtener productos: ", error);
            setProducts([]);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return { products, fetchProducts, setProducts };
};

export default useGetProducts;
