"use strict";
import Warehouse from "../entity/warehouse.entity.js";
import { AppDataSource } from "../config/configDb.js";

/**
 * Crear un nuevo almacén (solo admin).
 */
export async function createWarehouseService(body) {
  try {
    const warehouseRepository = AppDataSource.getRepository(Warehouse);

    const existing = await warehouseRepository.findOne({ where: { nombre: body.nombre } });
    if (existing) return [null, "Ya existe un almacén con ese nombre"];

    const newWarehouse = warehouseRepository.create({
      nombre: body.nombre,
      ubicacion: body.ubicacion || null,
      ciudad: body.ciudad || null,
      region: body.region || null,
      capacidad: body.capacidad || null,
      activo: body.activo !== undefined ? body.activo : true,
    });

    const saved = await warehouseRepository.save(newWarehouse);
    return [saved, null];
  } catch (error) {
    console.error("Error al crear almacén:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Listar todos los almacenes.
 */
export async function getWarehousesService() {
  try {
    const warehouseRepository = AppDataSource.getRepository(Warehouse);

    const warehouses = await warehouseRepository.find({
      order: { createdAt: "DESC" },
    });

    return [warehouses, null];
  } catch (error) {
    console.error("Error al obtener almacenes:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Obtener un almacén por ID.
 */
export async function getWarehouseByIdService(id) {
  try {
    const warehouseRepository = AppDataSource.getRepository(Warehouse);

    const warehouse = await warehouseRepository.findOne({ where: { id } });
    if (!warehouse) return [null, "Almacén no encontrado"];

    return [warehouse, null];
  } catch (error) {
    console.error("Error al obtener almacén:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Actualizar un almacén (solo admin).
 */
export async function updateWarehouseService(id, body) {
  try {
    const warehouseRepository = AppDataSource.getRepository(Warehouse);

    const warehouse = await warehouseRepository.findOne({ where: { id } });
    if (!warehouse) return [null, "Almacén no encontrado"];

    // Verificar nombre duplicado en otro almacén
    if (body.nombre && body.nombre !== warehouse.nombre) {
      const existing = await warehouseRepository.findOne({ where: { nombre: body.nombre } });
      if (existing) return [null, "Ya existe un almacén con ese nombre"];
    }

    const allowedFields = ["nombre", "ubicacion", "ciudad", "region", "capacidad", "activo"];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        warehouse[field] = body[field];
      }
    }

    warehouse.updatedAt = new Date();
    const updated = await warehouseRepository.save(warehouse);
    return [updated, null];
  } catch (error) {
    console.error("Error al actualizar almacén:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Eliminar un almacén (solo admin).
 */
export async function deleteWarehouseService(id) {
  try {
    const warehouseRepository = AppDataSource.getRepository(Warehouse);

    const warehouse = await warehouseRepository.findOne({ where: { id } });
    if (!warehouse) return [null, "Almacén no encontrado"];

    await warehouseRepository.remove(warehouse);
    return [{ id }, null];
  } catch (error) {
    console.error("Error al eliminar almacén:", error);
    return [null, "Error interno del servidor"];
  }
}
