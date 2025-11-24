"use strict";
import { AppDataSource } from "../config/configDb.js";
import ReviewSchema from "../entity/review.entity.js";
import ProductSchema from "../entity/product.entity.js";
import UserSchema from "../entity/user.entity.js";

export async function createReviewService(reviewData, userId) {
  try {
    const reviewRepository = AppDataSource.getRepository(ReviewSchema);
    const productRepository = AppDataSource.getRepository(ProductSchema);
    const userRepository = AppDataSource.getRepository(UserSchema);

    const product = await productRepository.findOne({
      where: { id: reviewData.productId },
    });

    if (!product) {
      return [null, "El producto no existe"];
    }

    const user = await userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return [null, "El usuario no existe"];
    }

    const existingReview = await reviewRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: reviewData.productId },
      },
    });

    if (existingReview) {
      return [null, "Ya has calificado este producto"];
    }

    const newReview = reviewRepository.create({
      calificacion: reviewData.calificacion,
      comentario: reviewData.comentario || null,
      user: user,
      product: product,
    });

    await reviewRepository.save(newReview);

    const savedReview = await reviewRepository.findOne({
      where: { id: newReview.id },
      relations: ["user", "product"],
    });

    return [savedReview, null];
  } catch (error) {
    console.error("Error al crear la reseña:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getReviewsByProductService(productId) {
  try {
    const reviewRepository = AppDataSource.getRepository(ReviewSchema);
    const productRepository = AppDataSource.getRepository(ProductSchema);

    const product = await productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      return [null, "El producto no existe"];
    }

    const reviews = await reviewRepository.find({
      where: { product: { id: productId } },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });

    const reviewsWithUserInfo = reviews.map((review) => ({
      id: review.id,
      calificacion: review.calificacion,
      comentario: review.comentario,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.user.id,
        nombreCompleto: review.user.nombreCompleto,
      },
    }));

    const avgCalificacion = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.calificacion, 0) / reviews.length
      : 0;

    return [
      {
        reviews: reviewsWithUserInfo,
        totalReviews: reviews.length,
        avgCalificacion: Math.round(avgCalificacion * 10) / 10,
      },
      null,
    ];
  } catch (error) {
    console.error("Error al obtener las reseñas:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getUserReviewForProductService(userId, productId) {
  try {
    const reviewRepository = AppDataSource.getRepository(ReviewSchema);

    const review = await reviewRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
      relations: ["user", "product"],
    });

    if (!review) {
      return [null, null];
    }

    return [
      {
        id: review.id,
        calificacion: review.calificacion,
        comentario: review.comentario,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
      null,
    ];
  } catch (error) {
    console.error("Error al obtener la reseña del usuario:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateReviewService(reviewId, userId, reviewData) {
  try {
    const reviewRepository = AppDataSource.getRepository(ReviewSchema);

    const review = await reviewRepository.findOne({
      where: { id: reviewId },
      relations: ["user"],
    });

    if (!review) {
      return [null, "La reseña no existe"];
    }

    if (review.user.id !== userId) {
      return [null, "No tienes permiso para editar esta reseña"];
    }

    if (reviewData.calificacion !== undefined) {
      review.calificacion = reviewData.calificacion;
    }
    if (reviewData.comentario !== undefined) {
      review.comentario = reviewData.comentario;
    }

    await reviewRepository.save(review);

    const updatedReview = await reviewRepository.findOne({
      where: { id: reviewId },
      relations: ["user", "product"],
    });

    return [updatedReview, null];
  } catch (error) {
    console.error("Error al actualizar la reseña:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function deleteReviewService(reviewId, userId, userRole) {
  try {
    const reviewRepository = AppDataSource.getRepository(ReviewSchema);

    const review = await reviewRepository.findOne({
      where: { id: reviewId },
      relations: ["user"],
    });

    if (!review) {
      return [null, "La reseña no existe"];
    }

    if (review.user.id !== userId && userRole !== "administrador") {
      return [null, "No tienes permiso para eliminar esta reseña"];
    }

    await reviewRepository.remove(review);

    return [{ message: "Reseña eliminada correctamente" }, null];
  } catch (error) {
    console.error("Error al eliminar la reseña:", error);
    return [null, "Error interno del servidor"];
  }
}
