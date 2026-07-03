"use strict";
import { Router } from "express";
import {
  createPreference,
  paymentWebhook,
  getPaymentStatusController,
  paymentBounce,
} from "../controllers/payment.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

// Webhook de Mercado Pago (NO requiere autenticación)
router.post("/webhook", paymentWebhook);

// Rebote para redireccionar a localhost (NO requiere autenticación)
router.get("/bounce", paymentBounce);

// Rutas protegidas con JWT
router.use(authenticateJwt);

// Crear preferencia de pago
router.post("/create-preference", createPreference);

// Obtener estado de pago de una orden
router.get("/status/:orderId", getPaymentStatusController);

export default router;
