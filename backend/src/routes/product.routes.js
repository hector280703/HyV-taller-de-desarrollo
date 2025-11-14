"use strict";
import { Router } from "express";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controller.js";

const router = Router();

// Rutas públicas - no requieren autenticación
router
  .get("/", getProducts)
  .get("/detail/", getProduct);

// Rutas protegidas - requieren autenticación y rol de administrador
router
  .post("/", authenticateJwt, isAdmin, createProduct)
  .patch("/detail/", authenticateJwt, isAdmin, updateProduct)
  .delete("/detail/", authenticateJwt, isAdmin, deleteProduct);

export default router;
