"use strict";
import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
} from "../controllers/order.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

// Usar autenticación en todas las rutas
router.use(authenticateJwt);

// Crear orden
router.post("/", createOrder);

// Obtener órdenes (admin: todas, usuario: propias)
router.get("/", getOrders);

// Obtener estadísticas (solo admin)
router.get("/stats", getOrderStats);

// Obtener orden por ID
router.get("/:id", getOrderById);

// Actualizar estado de orden (solo admin)
router.patch("/:id/status", updateOrderStatus);

// Cancelar orden (usuario propietario o admin)
router.delete("/:id", cancelOrder);

export default router;
