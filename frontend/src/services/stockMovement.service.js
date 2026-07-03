import axios from './root.service.js';

export async function getStockMovements(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.productId) params.append('productId', filters.productId);
    if (filters.warehouseId) params.append('warehouseId', filters.warehouseId);
    if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
    const queryString = params.toString();
    const url = queryString ? `/stock-movements?${queryString}` : '/stock-movements';
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener movimientos de stock:', error);
    throw error.response?.data || error;
  }
}

export async function getMovementsByProduct(productId) {
  try {
    const response = await axios.get(`/stock-movements/product/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener historial de producto:', error);
    throw error.response?.data || error;
  }
}

export async function createManualMovement(data) {
  try {
    const response = await axios.post('/stock-movements', data);
    return response.data;
  } catch (error) {
    console.error('Error al crear movimiento de stock:', error);
    throw error.response?.data || error;
  }
}
