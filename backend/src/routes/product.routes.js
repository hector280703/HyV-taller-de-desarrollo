"use strict";
import { Router } from "express";
import { isAdmin, isAdminOrBodeguero } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
  getLowStockProducts,
} from "../controllers/product.controller.js";

const router = Router();

// Rutas públicas - no requieren autenticación
router
  .get("/", getProducts)
  .get("/detail/", getProduct);

// Ruta de alertas de stock - administradores y bodegueros
router
  .get("/low-stock", authenticateJwt, isAdminOrBodeguero, getLowStockProducts);

// Rutas protegidas - requieren autenticación y rol de administrador/bodeguero
router
  .post("/", authenticateJwt, isAdminOrBodeguero, createProduct)
  .patch("/detail/", authenticateJwt, isAdminOrBodeguero, updateProduct)
  .delete("/detail/", authenticateJwt, isAdminOrBodeguero, deleteProduct);

export default router;
