import axios from './root.service.js';

export async function createOrder(orderData) {
  try {
    const response = await axios.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Error al crear orden:', error);
    throw error.response?.data || error;
  }
}

export async function getOrders(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);

    const queryString = params.toString();
    const url = queryString ? `/orders?${queryString}` : '/orders';
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    throw error.response?.data || error;
  }
}

export async function getOrderById(orderId) {
  try {
    const response = await axios.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener orden:', error);
    throw error.response?.data || error;
  }
}

export async function updateOrderStatus(orderId, estado) {
  try {
    const response = await axios.patch(`/orders/${orderId}/status`, { estado });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    throw error.response?.data || error;
  }
}

export async function cancelOrder(orderId) {
  try {
    const response = await axios.delete(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error al cancelar orden:', error);
    throw error.response?.data || error;
  }
}

export async function getOrderStats() {
  try {
    const response = await axios.get('/orders/stats');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error.response?.data || error;
  }
}
