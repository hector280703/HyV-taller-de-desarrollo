"use strict";
import Joi from "joi";

export const orderCreateValidation = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().integer().positive().required().messages({
          "number.base": "El ID del producto debe ser un número",
          "number.positive": "El ID del producto debe ser positivo",
          "any.required": "El ID del producto es requerido",
        }),
        cantidad: Joi.number().integer().min(1).required().messages({
          "number.base": "La cantidad debe ser un número",
          "number.min": "La cantidad debe ser al menos 1",
          "any.required": "La cantidad es requerida",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Debe haber al menos un producto en el pedido",
      "any.required": "Los items del pedido son requeridos",
    }),
  metodoPago: Joi.string()
    .valid("efectivo", "transferencia", "tarjeta", "debito", "mercadopago")
    .required()
    .messages({
      "string.base": "El método de pago debe ser texto",
      "any.only": "El método de pago debe ser: efectivo, transferencia, tarjeta, debito o mercadopago",
      "any.required": "El método de pago es requerido",
    }),
  direccionEnvio: Joi.string().min(10).max(500).required().messages({
    "string.base": "La dirección debe ser texto",
    "string.min": "La dirección debe tener al menos 10 caracteres",
    "string.max": "La dirección no debe exceder 500 caracteres",
    "any.required": "La dirección de envío es requerida",
  }),
  telefonoContacto: Joi.string()
    .pattern(/^[+]?[\d\s-]{8,20}$/)
    .required()
    .messages({
      "string.base": "El teléfono debe ser texto",
      "string.pattern.base": "El teléfono debe tener un formato válido",
      "any.required": "El teléfono de contacto es requerido",
    }),
  notas: Joi.string().max(1000).allow("", null).messages({
    "string.max": "Las notas no deben exceder 1000 caracteres",
  }),
  zonaEnvio: Joi.string()
    .valid("local", "arauco", "biobio", "regional", "nacional")
    .allow("", null)
    .messages({
      "any.only": "La zona de envío debe ser: local, arauco, biobio, regional o nacional",
    }),
  tipoEntrega: Joi.string()
    .valid("retiro", "envio")
    .default("envio")
    .messages({
      "any.only": "El tipo de entrega debe ser: retiro o envio",
    }),
  fechaEntrega: Joi.date().iso().allow(null, "").messages({
    "date.base": "La fecha de entrega debe ser una fecha válida",
    "date.format": "La fecha de entrega debe tener formato ISO",
  }),
  clienteEmail: Joi.string().email({ tlds: { allow: false } }).allow("", null).messages({
    "string.base": "El email del cliente debe ser texto",
    "string.email": "El email del cliente debe tener un formato válido",
  }),
  clienteNombre: Joi.string().min(2).max(255).allow("", null).messages({
    "string.base": "El nombre del cliente debe ser texto",
    "string.min": "El nombre del cliente debe tener al menos 2 caracteres",
    "string.max": "El nombre del cliente no debe exceder 255 caracteres",
  }),
}).messages({
  "object.base": "Los datos del pedido deben ser un objeto válido",
});

export const orderStatusValidation = Joi.object({
  estado: Joi.string()
    .valid("pendiente", "procesando", "listo_para_envio", "listo_para_retiro", "en_camino", "entregado", "cancelado", "incidencia_stock")
    .required()
    .messages({
      "string.base": "El estado debe ser texto",
      "any.only": "El estado debe ser: pendiente, procesando, listo_para_envio, listo_para_retiro, en_camino, entregado, cancelado o incidencia_stock",
      "any.required": "El estado es requerido",
    }),
}).messages({
  "object.base": "Los datos deben ser un objeto válido",
});

export const orderQueryValidation = Joi.object({
  id: Joi.number().integer().positive().messages({
    "number.base": "El ID debe ser un número",
    "number.positive": "El ID debe ser positivo",
  }),
  estado: Joi.string()
    .valid("pendiente", "procesando", "listo_para_envio", "listo_para_retiro", "en_camino", "entregado", "cancelado", "incidencia_stock")
    .messages({
      "any.only": "El estado debe ser: pendiente, procesando, listo_para_envio, listo_para_retiro, en_camino, entregado, cancelado o incidencia_stock",
    }),
  fechaDesde: Joi.date().messages({
    "date.base": "La fecha desde debe ser una fecha válida",
  }),
  fechaHasta: Joi.date().messages({
    "date.base": "La fecha hasta debe ser una fecha válida",
  }),
  onlyOwn: Joi.boolean().messages({
    "boolean.base": "El parámetro onlyOwn debe ser booleano",
  }),
}).messages({
  "object.base": "Los filtros deben ser un objeto válido",
});

export const presentialSaleValidation = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().integer().positive().required().messages({
          "number.base": "El ID del producto debe ser un número",
          "number.positive": "El ID del producto debe ser positivo",
          "any.required": "El ID del producto es requerido",
        }),
        cantidad: Joi.number().integer().min(1).required().messages({
          "number.base": "La cantidad debe ser un número",
          "number.min": "La cantidad debe ser al menos 1",
          "any.required": "La cantidad es requerida",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Debe haber al menos un producto en la venta",
      "any.required": "Los items de la venta son requeridos",
    }),
  metodoPago: Joi.string()
    .valid("efectivo", "transferencia")
    .required()
    .messages({
      "string.base": "El método de pago debe ser texto",
      "any.only": "El método de pago debe ser: efectivo o transferencia",
      "any.required": "El método de pago es requerido",
    }),
  clienteNombre: Joi.string().min(2).max(255).required().messages({
    "string.base": "El nombre del cliente debe ser texto",
    "string.min": "El nombre del cliente debe tener al menos 2 caracteres",
    "string.max": "El nombre del cliente no debe exceder 255 caracteres",
    "any.required": "El nombre del cliente es requerido",
  }),
  clienteEmail: Joi.string().email({ tlds: { allow: false } }).required().messages({
    "string.base": "El email del cliente debe ser texto",
    "string.email": "El email del cliente debe tener un formato válido",
    "any.required": "El email del cliente es requerido",
  }),
  telefonoContacto: Joi.string()
    .pattern(/^[+]?[\d\s-]{8,20}$/)
    .required()
    .messages({
      "string.base": "El teléfono debe ser texto",
      "string.pattern.base": "El teléfono debe tener un formato válido",
      "any.required": "El teléfono de contacto es requerido",
    }),
  notas: Joi.string().max(1000).allow("", null).messages({
    "string.max": "Las notas no deben exceder 1000 caracteres",
  }),
}).messages({
  "object.base": "Los datos de la venta deben ser un objeto válido",
});
