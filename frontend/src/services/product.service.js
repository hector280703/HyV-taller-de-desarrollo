import axios from './root.service.js';

export async function getProducts() {
    try {
        const { data } = await axios.get('/product/');
        console.log('Respuesta de getProducts:', data);
        // Asegurarse de devolver siempre un array
        return Array.isArray(data.data) ? data.data : [];
    } catch (error) {
        console.error('Error en getProducts:', error);
        return [];
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
