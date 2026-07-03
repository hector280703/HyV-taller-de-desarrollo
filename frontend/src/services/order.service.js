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
    if (filters.onlyOwn !== undefined) params.append('onlyOwn', filters.onlyOwn);

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

export async function getOrderStats(mes, anio) {
  try {
    const params = new URLSearchParams();
    if (mes) params.append('mes', mes);
    if (anio) params.append('anio', anio);
    
    const queryString = params.toString();
    const url = queryString ? `/orders/stats?${queryString}` : '/orders/stats';

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error.response?.data || error;
  }
}

export async function getShippingZones() {
  try {
    const response = await axios.get('/orders/shipping/zones');
    return response.data;
  } catch (error) {
    console.error('Error al obtener zonas de envío:', error);
    throw error.response?.data || error;
  }
}

export async function calculateShipping(zona, pesoTotal) {
  try {
    const response = await axios.get(`/orders/shipping/calculate?zona=${zona}&pesoTotal=${pesoTotal}`);
    return response.data;
  } catch (error) {
    console.error('Error al calcular envío:', error);
    throw error.response?.data || error;
  }
}

export async function reportStockIssue(orderId, issues) {
  try {
    const response = await axios.post(`/orders/${orderId}/report-stock-issue`, { issues });
    return response.data;
  } catch (error) {
    console.error('Error al reportar incidencia de stock:', error);
    throw error.response?.data || error;
  }
}

export async function getOrderHistory(orderId) {
  try {
    const response = await axios.get(`/orders/${orderId}/history`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener historial de orden:', error);
    throw error.response?.data || error;
  }
}

export async function getDeliveryAvailability(year, month) {
  try {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    const queryString = params.toString();
    const url = queryString ? `/orders/delivery-availability?${queryString}` : '/orders/delivery-availability';
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener disponibilidad de entregas:', error);
    throw error.response?.data || error;
  }
}

export async function updateDeliverySequence(sequences) {
  try {
    const response = await axios.patch('/orders/reorder', { sequences });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar secuencia de entregas:', error);
    throw error.response?.data || error;
  }
}


