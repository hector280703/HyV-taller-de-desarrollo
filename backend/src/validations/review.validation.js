"use strict";
import Joi from "joi";

export const reviewBodyValidation = Joi.object({
  productId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.base": "El productId debe ser un número.",
      "number.integer": "El productId debe ser un número entero.",
      "number.positive": "El productId debe ser un número positivo.",
      "any.required": "El productId es obligatorio.",
    }),
  calificacion: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      "number.base": "La calificación debe ser un número.",
      "number.integer": "La calificación debe ser un número entero.",
      "number.min": "La calificación debe ser al menos 1.",
      "number.max": "La calificación debe ser como máximo 5.",
      "any.required": "La calificación es obligatoria.",
    }),
  comentario: Joi.string()
    .max(1000)
    .allow("", null)
    .messages({
      "string.max": "El comentario no puede tener más de 1000 caracteres.",
    }),
}).messages({
  "object.unknown": "No se permiten propiedades adicionales.",
});

export const reviewUpdateValidation = Joi.object({
  calificacion: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .messages({
      "number.base": "La calificación debe ser un número.",
      "number.integer": "La calificación debe ser un número entero.",
      "number.min": "La calificación debe ser al menos 1.",
      "number.max": "La calificación debe ser como máximo 5.",
    }),
  comentario: Joi.string()
    .max(1000)
    .allow("", null)
    .messages({
      "string.max": "El comentario no puede tener más de 1000 caracteres.",
    }),
}).messages({
  "object.unknown": "No se permiten propiedades adicionales.",
});

export const reviewIdValidation = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.base": "El id debe ser un número.",
      "number.integer": "El id debe ser un número entero.",
      "number.positive": "El id debe ser un número positivo.",
      "any.required": "El id es obligatorio.",
    }),
});

export const productIdValidation = Joi.object({
  productId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.base": "El productId debe ser un número.",
      "number.integer": "El productId debe ser un número entero.",
      "number.positive": "El productId debe ser un número positivo.",
      "any.required": "El productId es obligatorio.",
    }),
});
