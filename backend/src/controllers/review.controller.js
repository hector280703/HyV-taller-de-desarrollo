"use strict";
import {
  createReviewService,
  getReviewsByProductService,
  getUserReviewForProductService,
  updateReviewService,
  deleteReviewService,
} from "../services/review.service.js";
import {
  reviewBodyValidation,
  reviewUpdateValidation,
  reviewIdValidation,
  productIdValidation,
} from "../validations/review.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function createReview(req, res) {
  try {
    const { body } = req;
    const userId = req.user.id;

    const { error: bodyError } = reviewBodyValidation.validate(body);

    if (bodyError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en los datos enviados",
        bodyError.message
      );
    }

    const [review, errorReview] = await createReviewService(body, userId);

    if (errorReview) {
      return handleErrorClient(res, 400, "Error creando la reseña", errorReview);
    }

    handleSuccess(res, 201, "Reseña creada correctamente", review);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getReviewsByProduct(req, res) {
  try {
    const { productId } = req.params;

    const { error } = productIdValidation.validate({ productId: parseInt(productId) });

    if (error) {
      return handleErrorClient(
        res,
        400,
        "Error de validación",
        error.message
      );
    }

    const [reviews, errorReviews] = await getReviewsByProductService(parseInt(productId));

    if (errorReviews) {
      return handleErrorClient(res, 404, errorReviews);
    }

    handleSuccess(res, 200, "Reseñas encontradas", reviews);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getUserReviewForProduct(req, res) {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const { error } = productIdValidation.validate({ productId: parseInt(productId) });

    if (error) {
      return handleErrorClient(
        res,
        400,
        "Error de validación",
        error.message
      );
    }

    const [review, errorReview] = await getUserReviewForProductService(
      userId,
      parseInt(productId)
    );

    if (errorReview) {
      return handleErrorClient(res, 404, errorReview);
    }

    if (!review) {
      return handleSuccess(res, 200, "No has calificado este producto", null);
    }

    handleSuccess(res, 200, "Reseña encontrada", review);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateReview(req, res) {
  try {
    const { id } = req.params;
    const { body } = req;
    const userId = req.user.id;

    const { error: idError } = reviewIdValidation.validate({ id: parseInt(id) });

    if (idError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en el id",
        idError.message
      );
    }

    const { error: bodyError } = reviewUpdateValidation.validate(body);

    if (bodyError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en los datos enviados",
        bodyError.message
      );
    }

    const [review, errorReview] = await updateReviewService(
      parseInt(id),
      userId,
      body
    );

    if (errorReview) {
      return handleErrorClient(res, 400, "Error modificando la reseña", errorReview);
    }

    handleSuccess(res, 200, "Reseña modificada correctamente", review);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.rol;

    const { error: idError } = reviewIdValidation.validate({ id: parseInt(id) });

    if (idError) {
      return handleErrorClient(
        res,
        400,
        "Error de validación en el id",
        idError.message
      );
    }

    const [result, errorDelete] = await deleteReviewService(
      parseInt(id),
      userId,
      userRole
    );

    if (errorDelete) {
      return handleErrorClient(res, 400, "Error eliminando la reseña", errorDelete);
    }

    handleSuccess(res, 200, "Reseña eliminada correctamente", result);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
