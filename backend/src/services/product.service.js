"use strict";
import Product from "../entity/product.entity.js";
import { AppDataSource } from "../config/configDb.js";

export async function createProductService(body) {
  try {
    const productRepository = AppDataSource.getRepository(Product);

    // Verificar si ya existe un producto con el mismo nombre
    const existingProductByName = await productRepository.findOne({
      where: { nombre: body.nombre },
    });

    if (existingProductByName) {
      return [null, "Ya existe un producto con ese nombre"];
    }

    // Verificar si ya existe un producto con el mismo código
    const existingProductByCode = await productRepository.findOne({
      where: { codigo: body.codigo },
    });

    if (existingProductByCode) {
      return [null, "Ya existe un producto con ese código"];
    }

    const newProduct = productRepository.create({
      nombre: body.nombre,
      codigo: body.codigo,
      descripcion: body.descripcion || "",
      precio: body.precio,
      stock: body.stock || 0,
      categoria: body.categoria || "",
      unidadMedida: body.unidadMedida || "unidad",
      marca: body.marca || null,
      imagenUrl: body.imagenUrl || null,
      descuento: body.descuento || 0,
      peso: body.peso || null,
      dimensiones: body.dimensiones || null,
      activo: body.activo !== undefined ? body.activo : true,
    });

    const productSaved = await productRepository.save(newProduct);

    return [productSaved, null];
  } catch (error) {
    console.error("Error al crear el producto:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getProductService(query) {
  try {
    const { id, codigo, nombre } = query;

    const productRepository = AppDataSource.getRepository(Product);

    const productFound = await productRepository.findOne({
      where: [{ id: id }, { codigo: codigo }, { nombre: nombre }],
    });

    if (!productFound) return [null, "Producto no encontrado"];

    return [productFound, null];
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getProductsService() {
  try {
    const productRepository = AppDataSource.getRepository(Product);

    const products = await productRepository.find({
      order: {
        createdAt: "DESC",
      },
    });

    if (!products || products.length === 0) return [null, "No hay productos"];

    return [products, null];
  } catch (error) {
    console.error("Error al obtener los productos:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateProductService(query, body) {
  try {
    const { id, codigo, nombre } = query;

    const productRepository = AppDataSource.getRepository(Product);

    const productFound = await productRepository.findOne({
      where: [{ id: id }, { codigo: codigo }, { nombre: nombre }],
    });

    if (!productFound) return [null, "Producto no encontrado"];

    // Verificar si el nuevo nombre ya existe en otro producto
    if (body.nombre && body.nombre !== productFound.nombre) {
      const existingProductByName = await productRepository.findOne({
        where: { nombre: body.nombre },
      });

      if (existingProductByName && existingProductByName.id !== productFound.id) {
        return [null, "Ya existe un producto con ese nombre"];
      }
    }

    // Verificar si el nuevo código ya existe en otro producto
    if (body.codigo && body.codigo !== productFound.codigo) {
      const existingProductByCode = await productRepository.findOne({
        where: { codigo: body.codigo },
      });

      if (existingProductByCode && existingProductByCode.id !== productFound.id) {
        return [null, "Ya existe un producto con ese código"];
      }
    }

    const dataProductUpdate = {
      nombre: body.nombre || productFound.nombre,
      codigo: body.codigo || productFound.codigo,
      descripcion: body.descripcion !== undefined ? body.descripcion : productFound.descripcion,
      precio: body.precio !== undefined ? body.precio : productFound.precio,
      stock: body.stock !== undefined ? body.stock : productFound.stock,
      categoria: body.categoria !== undefined ? body.categoria : productFound.categoria,
      unidadMedida: body.unidadMedida !== undefined ? body.unidadMedida : productFound.unidadMedida,
      marca: body.marca !== undefined ? body.marca : productFound.marca,
      imagenUrl: body.imagenUrl !== undefined ? body.imagenUrl : productFound.imagenUrl,
      descuento: body.descuento !== undefined ? body.descuento : productFound.descuento,
      peso: body.peso !== undefined ? body.peso : productFound.peso,
      dimensiones: body.dimensiones !== undefined ? body.dimensiones : productFound.dimensiones,
      activo: body.activo !== undefined ? body.activo : productFound.activo,
      updatedAt: new Date(),
    };

    await productRepository.update({ id: productFound.id }, dataProductUpdate);

    const productUpdated = await productRepository.findOne({
      where: { id: productFound.id },
    });

    if (!productUpdated) {
      return [null, "Producto no encontrado después de actualizar"];
    }

    return [productUpdated, null];
  } catch (error) {
    console.error("Error al modificar el producto:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function deleteProductService(query) {
  try {
    const { id, codigo, nombre } = query;

    const productRepository = AppDataSource.getRepository(Product);

    const productFound = await productRepository.findOne({
      where: [{ id: id }, { codigo: codigo }, { nombre: nombre }],
    });

    if (!productFound) return [null, "Producto no encontrado"];

    const productDeleted = await productRepository.remove(productFound);

    return [productDeleted, null];
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    return [null, "Error interno del servidor"];
  }
}
