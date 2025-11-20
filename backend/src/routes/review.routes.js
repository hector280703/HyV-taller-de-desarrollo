"use strict";
import { Router } from "express";
import {
  createReview,
  getReviewsByProduct,
  getUserReviewForProduct,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router
  .post("/", authenticateJwt, createReview)
  .get("/product/:productId", getReviewsByProduct)
  .get("/product/:productId/user", authenticateJwt, getUserReviewForProduct)
  .put("/:id", authenticateJwt, updateReview)
  .delete("/:id", authenticateJwt, deleteReview);

export default router;
