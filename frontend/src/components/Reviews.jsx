import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import StarRating from './StarRating';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '@helpers/sweetAlert.js';
import {
  createReview,
  getReviewsByProduct,
  getUserReviewForProduct,
  updateReview,
  deleteReview,
  canReviewProduct,
} from '@services/review.service.js';
import '@styles/reviews.css';

const Reviews = ({ productId, user }) => {
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [canReview, setCanReview] = useState(false);
  
  const [formData, setFormData] = useState({
    calificacion: 0,
    comentario: '',
  });

  useEffect(() => {
    fetchReviews();
    if (user) {
      fetchUserReview();
      fetchCanReview();
    }
  }, [productId, user]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getReviewsByProduct(productId);
      setReviews(data.reviews || []);
      setAvgRating(data.avgCalificacion || 0);
      setTotalReviews(data.totalReviews || 0);
    } catch (error) {
      console.error('Error al cargar reseñas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReview = async () => {
    try {
      const data = await getUserReviewForProduct(productId);
      if (data) {
        setUserReview(data);
        setFormData({
          calificacion: data.calificacion,
          comentario: data.comentario || '',
        });
      }
    } catch (error) {
      console.error('Error al cargar reseña del usuario:', error);
    }
  };

  const fetchCanReview = async () => {
    try {
      const data = await canReviewProduct(productId);
      setCanReview(data?.canReview || false);
    } catch (error) {
      console.error('Error al verificar elegibilidad:', error);
      setCanReview(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.calificacion === 0) {
      showErrorAlert('Error', 'Por favor selecciona una calificación');
      return;
    }

    try {
      setSubmitting(true);

      const reviewData = {
        productId: parseInt(productId),
        calificacion: formData.calificacion,
        comentario: formData.comentario.trim(),
      };

      if (userReview) {
        await updateReview(userReview.id, {
          calificacion: formData.calificacion,
          comentario: formData.comentario.trim(),
        });
        showSuccessAlert('¡Actualizado!', 'Tu reseña ha sido actualizada');
      } else {
        await createReview(reviewData);
        showSuccessAlert('¡Gracias!', 'Tu reseña ha sido publicada');
      }

      setShowForm(false);
      await fetchReviews();
      await fetchUserReview();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al guardar la reseña';
      showErrorAlert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirmAlert(
      '¿Estás seguro?',
      'Esta acción no se puede deshacer'
    );

    if (confirmed) {
      try {
        await deleteReview(userReview.id);
        showSuccessAlert('¡Eliminado!', 'Tu reseña ha sido eliminada');
        setUserReview(null);
        setFormData({ calificacion: 0, comentario: '' });
        setShowForm(false);
        await fetchReviews();
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Error al eliminar la reseña';
        showErrorAlert('Error', errorMessage);
      }
    }
  };

  const handleEdit = () => {
    setFormData({
      calificacion: userReview.calificacion,
      comentario: userReview.comentario || '',
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    if (userReview) {
      setFormData({
        calificacion: userReview.calificacion,
        comentario: userReview.comentario || '',
      });
    } else {
      setFormData({ calificacion: 0, comentario: '' });
    }
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h2>Opiniones de Clientes</h2>
        {totalReviews > 0 && (
          <div className="reviews-summary">
            <div className="avg-rating">
              <span className="avg-number">{avgRating.toFixed(1)}</span>
              <StarRating rating={avgRating} readonly size="large" />
              <span className="total-reviews">({totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'})</span>
            </div>
          </div>
        )}
      </div>

      {user ? (
        <div className="user-review-section">
          {!userReview && !showForm && canReview && (
            <button className="btn-write-review" onClick={() => setShowForm(true)}>
              ✍️ Escribir una reseña
            </button>
          )}

          {!userReview && !showForm && !canReview && (
            <div className="review-not-eligible">
              <p>📦 Debes haber recibido este producto para poder dejar una reseña</p>
            </div>
          )}

          {userReview && !showForm && (
            <div className="user-review-card">
              <div className="review-card-header">
                <h3>Tu reseña</h3>
                <div className="review-actions">
                  <button className="btn-edit-review" onClick={handleEdit}>
                    ✏️ Editar
                  </button>
                  <button className="btn-delete-review" onClick={handleDelete}>
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
              <StarRating rating={userReview.calificacion} readonly size="medium" />
              {userReview.comentario && (
                <p className="review-comment">{userReview.comentario}</p>
              )}
              <span className="review-date">Publicado el {formatDate(userReview.createdAt)}</span>
            </div>
          )}

          {showForm && (
            <form className="review-form" onSubmit={handleSubmit}>
              <h3>{userReview ? 'Editar tu reseña' : 'Escribe tu reseña'}</h3>
              
              <div className="form-group">
                <label>Calificación *</label>
                <StarRating
                  rating={formData.calificacion}
                  onRatingChange={(value) => setFormData({ ...formData, calificacion: value })}
                  size="large"
                />
              </div>

              <div className="form-group">
                <label htmlFor="comentario">Comentario (opcional)</label>
                <textarea
                  id="comentario"
                  value={formData.comentario}
                  onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                  placeholder="Comparte tu experiencia con este producto..."
                  maxLength={1000}
                  rows={4}
                />
                <span className="char-count">{formData.comentario.length}/1000</span>
              </div>

              <div className="form-buttons">
                <button
                  type="button"
                  className="btn-cancel-review"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-submit-review"
                  disabled={submitting || formData.calificacion === 0}
                >
                  {submitting ? 'Guardando...' : userReview ? 'Actualizar' : 'Publicar'}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="login-prompt">
          <p>🔒 Debes iniciar sesión para dejar una reseña</p>
        </div>
      )}

      <div className="reviews-list">
        {loading ? (
          <div className="loading-reviews">
            <div className="loader"></div>
            <p>Cargando reseñas...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="no-reviews">
            <p>📝 Aún no hay reseñas para este producto</p>
            <p className="subtitle">¡Sé el primero en dejar tu opinión!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="review-user-info">
                  <span className="user-avatar">👤</span>
                  <div>
                    <span className="user-name">{review.user.nombreCompleto}</span>
                    <span className="review-date">{formatDate(review.createdAt)}</span>
                  </div>
                </div>
                <StarRating rating={review.calificacion} readonly size="small" />
              </div>
              {review.comentario && (
                <p className="review-comment">{review.comentario}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

Reviews.propTypes = {
  productId: PropTypes.string.isRequired,
  user: PropTypes.object,
};

export default Reviews;
