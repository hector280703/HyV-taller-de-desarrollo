"use strict";
import Joi from "joi";

export const productQueryValidation = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .messages({
      "number.base": "El id debe ser un número.",
      "number.integer": "El id debe ser un número entero.",
      "number.positive": "El id debe ser un número positivo.",
    }),
  codigo: Joi.string()
    .min(1)
    .max(50)
    .messages({
      "string.empty": "El código no puede estar vacío.",
      "string.base": "El código debe ser de tipo string.",
      "string.min": "El código debe tener como mínimo 1 caracter.",
      "string.max": "El código debe tener como máximo 50 caracteres.",
    }),
  nombre: Joi.string()
    .min(3)
    .max(100)
    .messages({
      "string.empty": "El nombre no puede estar vacío.",
      "string.base": "El nombre debe ser de tipo string.",
      "string.min": "El nombre debe tener como mínimo 3 caracteres.",
      "string.max": "El nombre debe tener como máximo 100 caracteres.",
    }),
})
  .or("id", "codigo", "nombre")
  .unknown(false)
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
    "object.missing":
      "Debes proporcionar al menos un parámetro: id, codigo o nombre.",
  });

export const productBodyValidation = Joi.object({
  nombre: Joi.string()
    .min(3)
    .max(100)
    .messages({
      "string.empty": "El nombre no puede estar vacío.",
      "string.base": "El nombre debe ser de tipo string.",
      "string.min": "El nombre debe tener como mínimo 3 caracteres.",
      "string.max": "El nombre debe tener como máximo 100 caracteres.",
    }),
  codigo: Joi.string()
    .min(1)
    .max(50)
    .messages({
      "string.empty": "El código no puede estar vacío.",
      "string.base": "El código debe ser de tipo string.",
      "string.min": "El código debe tener como mínimo 1 caracter.",
      "string.max": "El código debe tener como máximo 50 caracteres.",
    }),
  descripcion: Joi.string()
    .max(500)
    .allow("")
    .messages({
      "string.base": "La descripción debe ser de tipo string.",
      "string.max": "La descripción debe tener como máximo 500 caracteres.",
    }),
  precio: Joi.number()
    .positive()
    .precision(2)
    .messages({
      "number.base": "El precio debe ser un número.",
      "number.positive": "El precio debe ser un número positivo.",
    }),
  stock: Joi.number()
    .integer()
    .min(0)
    .messages({
      "number.base": "El stock debe ser un número.",
      "number.integer": "El stock debe ser un número entero.",
      "number.min": "El stock no puede ser negativo.",
    }),
  categoria: Joi.string()
    .max(50)
    .allow("")
    .messages({
      "string.base": "La categoría debe ser de tipo string.",
      "string.max": "La categoría debe tener como máximo 50 caracteres.",
    }),
  unidadMedida: Joi.string()
    .max(20)
    .messages({
      "string.base": "La unidad de medida debe ser de tipo string.",
      "string.max": "La unidad de medida debe tener como máximo 20 caracteres.",
    }),
  marca: Joi.string()
    .max(100)
    .allow("")
    .messages({
      "string.base": "La marca debe ser de tipo string.",
      "string.max": "La marca debe tener como máximo 100 caracteres.",
    }),
  imagenUrl: Joi.string()
    .uri()
    .allow("")
    .messages({
      "string.base": "La URL de la imagen debe ser de tipo string.",
      "string.uri": "Debe ser una URL válida.",
    }),
  descuento: Joi.number()
    .min(0)
    .max(100)
    .precision(2)
    .messages({
      "number.base": "El descuento debe ser un número.",
      "number.min": "El descuento no puede ser negativo.",
      "number.max": "El descuento no puede ser mayor a 100.",
    }),
  peso: Joi.number()
    .positive()
    .precision(2)
    .allow(null)
    .messages({
      "number.base": "El peso debe ser un número.",
      "number.positive": "El peso debe ser un número positivo.",
    }),
  dimensiones: Joi.string()
    .max(100)
    .allow("")
    .messages({
      "string.base": "Las dimensiones deben ser de tipo string.",
      "string.max": "Las dimensiones deben tener como máximo 100 caracteres.",
    }),
  activo: Joi.boolean()
    .messages({
      "boolean.base": "El campo activo debe ser de tipo boolean.",
    }),
})
  .or("nombre", "codigo", "descripcion", "precio", "stock", "categoria", "unidadMedida", "marca", "imagenUrl", "descuento", "peso", "dimensiones", "activo")
  .unknown(false)
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
    "object.missing":
      "Debes proporcionar al menos un campo: nombre, codigo, descripcion, precio, stock, categoria, unidadMedida, marca, imagenUrl, descuento, peso, dimensiones o activo.",
  });

export const productCreateValidation = Joi.object({
  nombre: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.empty": "El nombre no puede estar vacío.",
      "string.base": "El nombre debe ser de tipo string.",
      "string.min": "El nombre debe tener como mínimo 3 caracteres.",
      "string.max": "El nombre debe tener como máximo 100 caracteres.",
      "any.required": "El nombre es obligatorio.",
    }),
  codigo: Joi.string()
    .min(1)
    .max(50)
    .required()
    .messages({
      "string.empty": "El código no puede estar vacío.",
      "string.base": "El código debe ser de tipo string.",
      "string.min": "El código debe tener como mínimo 1 caracter.",
      "string.max": "El código debe tener como máximo 50 caracteres.",
      "any.required": "El código es obligatorio.",
    }),
  descripcion: Joi.string()
    .max(500)
    .allow("")
    .messages({
      "string.base": "La descripción debe ser de tipo string.",
      "string.max": "La descripción debe tener como máximo 500 caracteres.",
    }),
  precio: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      "number.base": "El precio debe ser un número.",
      "number.positive": "El precio debe ser un número positivo.",
      "any.required": "El precio es obligatorio.",
    }),
  stock: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      "number.base": "El stock debe ser un número.",
      "number.integer": "El stock debe ser un número entero.",
      "number.min": "El stock no puede ser negativo.",
    }),
  categoria: Joi.string()
    .max(50)
    .allow("")
    .messages({
      "string.base": "La categoría debe ser de tipo string.",
      "string.max": "La categoría debe tener como máximo 50 caracteres.",
    }),
  unidadMedida: Joi.string()
    .max(20)
    .required()
    .messages({
      "string.base": "La unidad de medida debe ser de tipo string.",
      "string.max": "La unidad de medida debe tener como máximo 20 caracteres.",
      "any.required": "La unidad de medida es obligatoria.",
    }),
  marca: Joi.string()
    .max(100)
    .allow("")
    .messages({
      "string.base": "La marca debe ser de tipo string.",
      "string.max": "La marca debe tener como máximo 100 caracteres.",
    }),
  imagenUrl: Joi.string()
    .uri()
    .allow("")
    .messages({
      "string.base": "La URL de la imagen debe ser de tipo string.",
      "string.uri": "Debe ser una URL válida.",
    }),
  descuento: Joi.number()
    .min(0)
    .max(100)
    .precision(2)
    .default(0)
    .messages({
      "number.base": "El descuento debe ser un número.",
      "number.min": "El descuento no puede ser negativo.",
      "number.max": "El descuento no puede ser mayor a 100.",
    }),
  peso: Joi.number()
    .positive()
    .precision(2)
    .allow(null)
    .messages({
      "number.base": "El peso debe ser un número.",
      "number.positive": "El peso debe ser un número positivo.",
    }),
  dimensiones: Joi.string()
    .max(100)
    .allow("")
    .messages({
      "string.base": "Las dimensiones deben ser de tipo string.",
      "string.max": "Las dimensiones deben tener como máximo 100 caracteres.",
    }),
  activo: Joi.boolean()
    .default(true)
    .messages({
      "boolean.base": "El campo activo debe ser de tipo boolean.",
    }),
})
  .unknown(false)
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
  });
