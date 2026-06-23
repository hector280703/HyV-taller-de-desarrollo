"use strict";
import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getShippingZones,
  calculateShipping,
} from "../controllers/order.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { orderCreateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

// Rutas públicas de envío (no requieren autenticación)
router.get("/shipping/zones", getShippingZones);
router.get("/shipping/calculate", calculateShipping);

// Usar autenticación en el resto de las rutas
router.use(authenticateJwt);

// Crear orden
router.post("/", orderCreateLimiter, createOrder);

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
