import axios from './root.service.js';

export async function createReview(reviewData) {
  try {
    const { data } = await axios.post('/review/', reviewData);
    return data.data;
  } catch (error) {
    console.error('Error al crear la reseña:', error);
    throw error;
  }
}

export async function getReviewsByProduct(productId) {
  try {
    const { data } = await axios.get(`/review/product/${productId}`);
    return data.data;
  } catch (error) {
    console.error('Error al obtener las reseñas:', error);
    throw error;
  }
}

export async function getUserReviewForProduct(productId) {
  try {
    const { data } = await axios.get(`/review/product/${productId}/user`);
    return data.data;
  } catch (error) {
    console.error('Error al obtener la reseña del usuario:', error);
    throw error;
  }
}

export async function updateReview(reviewId, reviewData) {
  try {
    const { data } = await axios.put(`/review/${reviewId}`, reviewData);
    return data.data;
  } catch (error) {
    console.error('Error al actualizar la reseña:', error);
    throw error;
  }
}

export async function deleteReview(reviewId) {
  try {
    const { data } = await axios.delete(`/review/${reviewId}`);
    return data.data;
  } catch (error) {
    console.error('Error al eliminar la reseña:', error);
    throw error;
  }
}
