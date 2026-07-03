"use strict";
import { Router } from "express";
import {
  getStockMovements,
  getMovementsByProduct,
  createManualMovement,
} from "../controllers/stockMovement.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateJwt);

// Listar todos los movimientos con filtros opcionales (admin/bodeguero)
router.get("/", getStockMovements);

// Historial de movimientos de un producto (admin/bodeguero)
router.get("/product/:id", getMovementsByProduct);

// Crear movimiento manual (admin/bodeguero)
router.post("/", createManualMovement);

export default router;
