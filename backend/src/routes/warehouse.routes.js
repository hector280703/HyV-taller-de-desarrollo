"use strict";
import { Router } from "express";
import {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
} from "../controllers/warehouse.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateJwt);

router.post("/", createWarehouse);
router.get("/", getWarehouses);
router.get("/:id", getWarehouseById);
router.put("/:id", updateWarehouse);
router.delete("/:id", deleteWarehouse);

export default router;
