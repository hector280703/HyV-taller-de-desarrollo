"use strict";
import { Router } from "express";
import {
  getInvoices,
  getInvoiceByOrder,
  updateInvoiceStatus,
} from "../controllers/invoice.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateJwt);

// Listar todas las facturas (solo admin)
router.get("/", getInvoices);

// Obtener factura de una orden específica (propietario o admin)
router.get("/order/:orderId", getInvoiceByOrder);

// Actualizar estado de factura (solo admin)
router.patch("/:id/status", updateInvoiceStatus);

export default router;
