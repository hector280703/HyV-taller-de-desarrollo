import axios from './root.service.js';

export async function getWarehouses() {
  try {
    const response = await axios.get('/warehouse');
    return response.data;
  } catch (error) {
    console.error('Error al obtener almacenes:', error);
    throw error.response?.data || error;
  }
}

export async function getWarehouseById(id) {
  try {
    const response = await axios.get(`/warehouse/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener almacén:', error);
    throw error.response?.data || error;
  }
}

export async function createWarehouse(data) {
  try {
    const response = await axios.post('/warehouse', data);
    return response.data;
  } catch (error) {
    console.error('Error al crear almacén:', error);
    throw error.response?.data || error;
  }
}

export async function updateWarehouse(id, data) {
  try {
    const response = await axios.put(`/warehouse/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar almacén:', error);
    throw error.response?.data || error;
  }
}

export async function deleteWarehouse(id) {
  try {
    const response = await axios.delete(`/warehouse/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar almacén:', error);
    throw error.response?.data || error;
  }
}
