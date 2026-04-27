"use strict";
import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { uploadImage } from "../controllers/upload.controller.js";

const router = Router();

// POST /api/upload/image — solo admins autenticados pueden subir imágenes
// Nota: multer se ejecuta dentro del controlador para capturar sus errores correctamente
router.post("/image", authenticateJwt, isAdmin, uploadImage);

export default router;
