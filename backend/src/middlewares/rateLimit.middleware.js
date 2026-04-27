"use strict";
import rateLimit from "express-rate-limit";

// Rate limiter para login: max 5 intentos por IP cada 15 minutos
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "Client error",
    message: "Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.",
    data: null,
  },
});

// Rate limiter para registro: max 3 registros por IP cada 60 minutos
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "Client error",
    message: "Demasiados registros desde esta dirección. Intenta nuevamente en 1 hora.",
    data: null,
  },
});

// Rate limiter para crear órdenes: max 10 por IP cada 15 minutos
export const orderCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "Client error",
    message: "Demasiadas órdenes creadas. Intenta nuevamente en 15 minutos.",
    data: null,
  },
});

// Rate limiter general para la API: max 100 requests por IP cada 15 minutos
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "Client error",
    message: "Demasiadas solicitudes. Intenta nuevamente más tarde.",
    data: null,
  },
});
