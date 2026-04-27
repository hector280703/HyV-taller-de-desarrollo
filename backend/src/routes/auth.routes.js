"use strict";
import { Router } from "express";
import { login, logout, register } from "../controllers/auth.controller.js";
import { loginLimiter, registerLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router
  .post("/login", loginLimiter, login)
  .post("/register", registerLimiter, register)
  .post("/logout", logout);

export default router;