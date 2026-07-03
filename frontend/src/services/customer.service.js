import axios from './root.service.js';

export async function getMyCustomerProfile() {
  try {
    const response = await axios.get('/customer/me');
    return response.data;
  } catch (error) {
    console.error('Error al obtener perfil de cliente:', error);
    throw error.response?.data || error;
  }
}

export async function updateMyCustomerProfile(data) {
  try {
    const response = await axios.put('/customer/me', data);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar perfil de cliente:', error);
    throw error.response?.data || error;
  }
}

export async function getCustomers() {
  try {
    const response = await axios.get('/customer');
    return response.data;
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    throw error.response?.data || error;
  }
}

export async function getCustomerById(id) {
  try {
    const response = await axios.get(`/customer/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    throw error.response?.data || error;
  }
}
