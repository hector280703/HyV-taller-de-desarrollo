import axios from './root.service.js';

export async function getProducts(filters = {}) {
    try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.categoria) params.append('categoria', filters.categoria);
        if (filters.page) params.append('page', filters.page);
        if (filters.limit) params.append('limit', filters.limit);

        const queryString = params.toString();
        const url = `/product/${queryString ? `?${queryString}` : ''}`;

        const { data } = await axios.get(url);
        return data.data || { products: [], total: 0, page: 1, totalPages: 0 };
    } catch (error) {
        console.error('Error en getProducts:', error);
        return { products: [], total: 0, page: 1, totalPages: 0 };
    }
}

export async function getProduct(id) {
    try {
        const { data } = await axios.get(`/product/detail/?id=${id}`);
        return data.data;
    } catch (error) {
        return error.response?.data;
    }
}

export async function createProduct(productData) {
    try {
        const response = await axios.post('/product/', productData);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
}

export async function updateProduct(productData, id) {
    try {
        const response = await axios.patch(`/product/detail/?id=${id}`, productData);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
}

export async function deleteProduct(id) {
    try {
        const response = await axios.delete(`/product/detail/?id=${id}`);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
}

export async function getLowStockProducts() {
    try {
        const { data } = await axios.get('/product/low-stock');
        return data.data || [];
    } catch (error) {
        console.error('Error al obtener productos con stock bajo:', error);
        return [];
    }
}
