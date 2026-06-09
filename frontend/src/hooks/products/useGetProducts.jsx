import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '@services/product.service.js';

const useGetProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoria, setCategoria] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const limit = 12;

    const fetchProducts = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const params = {
                search: filters.search !== undefined ? filters.search : search,
                categoria: filters.categoria !== undefined ? filters.categoria : categoria,
                page: filters.page !== undefined ? filters.page : page,
                limit,
            };

            const response = await getProducts(params);

            if (response && Array.isArray(response.products)) {
                setProducts(response.products);
                setTotalPages(response.totalPages || 0);
                setTotal(response.total || 0);
            } else {
                setProducts([]);
                setTotalPages(0);
                setTotal(0);
            }
        } catch (error) {
            console.error("Error al obtener productos: ", error);
            setProducts([]);
            setTotalPages(0);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [search, categoria, page, limit]);

    useEffect(() => {
        fetchProducts();
    }, [search, categoria, page]);

    return {
        products,
        setProducts,
        fetchProducts,
        loading,
        search,
        setSearch,
        categoria,
        setCategoria,
        page,
        setPage,
        totalPages,
        total,
    };
};

export default useGetProducts;
