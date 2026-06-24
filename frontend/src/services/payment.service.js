import axios from './root.service.js';

/**
 * Crea una preferencia de pago de Mercado Pago para una orden.
 * @param {number} orderId - ID de la orden.
 * @returns {Object} - { preferenceId, initPoint, sandboxInitPoint }
 */
export async function createPaymentPreference(orderId) {
  try {
    const response = await axios.post('/payments/create-preference', { orderId });
    return response.data;
  } catch (error) {
    console.error('Error al crear preferencia de pago:', error);
    throw error.response?.data || error;
  }
}

/**
 * Obtiene el estado de pago de una orden.
 * @param {number} orderId - ID de la orden.
 * @returns {Object} - Estado del pago.
 */
export async function getPaymentStatus(orderId) {
  try {
    const response = await axios.get(`/payments/status/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener estado de pago:', error);
    throw error.response?.data || error;
  }
}
