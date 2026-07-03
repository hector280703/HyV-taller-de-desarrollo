import axios from './root.service.js';

export async function getInvoices(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
    const queryString = params.toString();
    const url = queryString ? `/invoice?${queryString}` : '/invoice';
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    throw error.response?.data || error;
  }
}

export async function getInvoiceByOrder(orderId) {
  try {
    const response = await axios.get(`/invoice/order/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener factura:', error);
    throw error.response?.data || error;
  }
}

export async function updateInvoiceStatus(invoiceId, estado) {
  try {
    const response = await axios.patch(`/invoice/${invoiceId}/status`, { estado });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar estado de factura:', error);
    throw error.response?.data || error;
  }
}
