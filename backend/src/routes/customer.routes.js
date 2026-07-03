"use strict";
import { Router } from "express";
import {
  getMyCustomerProfile,
  updateMyCustomerProfile,
  getCustomers,
  getCustomerById,
} from "../controllers/customer.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateJwt);

// Perfil propio del cliente autenticado
router.get("/me", getMyCustomerProfile);
router.put("/me", updateMyCustomerProfile);

// Rutas de administrador
router.get("/", getCustomers);
router.get("/:id", getCustomerById);

export default router;
