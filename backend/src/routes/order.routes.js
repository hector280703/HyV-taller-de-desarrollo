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
  reportStockIssue,
  getOrderHistory,
  getDeliveryAvailability,
  updateDeliverySequence,
  createPresentialSale,
  confirmPresentialDelivery,
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

// Reportar problema de stock (bodeguero o admin)
router.post("/:id/report-stock-issue", reportStockIssue);

// Obtener historial de estados de una orden
router.get("/:id/history", getOrderHistory);

// Cancelar orden (usuario propietario o admin)
router.delete("/:id", cancelOrder);

// Obtener disponibilidad de entregas diarias
router.get("/delivery-availability", getDeliveryAvailability);

// Reordenar secuencia de entregas
router.patch("/reorder", updateDeliverySequence);

// Crear venta presencial (vendedor_presencial o admin)
router.post("/presential", createPresentialSale);

// Confirmar entrega de venta presencial con código (bodeguero o admin)
router.post("/:id/confirm-delivery", confirmPresentialDelivery);

export default router;
