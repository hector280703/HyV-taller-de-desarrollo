"use strict";
import {
  createWarehouseService,
  getWarehousesService,
  getWarehouseByIdService,
  updateWarehouseService,
  deleteWarehouseService,
} from "../services/warehouse.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function createWarehouse(req, res) {
  try {
    const userRole = req.user.rol;
    if (userRole !== "administrador") {
      return handleErrorClient(res, 403, "No tienes permisos para crear almacenes");
    }
    const [warehouse, error] = await createWarehouseService(req.body);
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 201, "Almacén creado exitosamente", warehouse);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getWarehouses(req, res) {
  try {
    const userRole = req.user.rol;
    if (userRole !== "administrador" && userRole !== "bodeguero") {
      return handleErrorClient(res, 403, "No tienes permisos para ver los almacenes");
    }
    const [warehouses, error] = await getWarehousesService();
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 200, "Almacenes obtenidos exitosamente", warehouses);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getWarehouseById(req, res) {
  try {
    const userRole = req.user.rol;
    if (userRole !== "administrador" && userRole !== "bodeguero") {
      return handleErrorClient(res, 403, "No tienes permisos para ver este almacén");
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) return handleErrorClient(res, 400, "ID de almacén inválido");
    const [warehouse, error] = await getWarehouseByIdService(id);
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Almacén obtenido exitosamente", warehouse);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateWarehouse(req, res) {
  try {
    const userRole = req.user.rol;
    if (userRole !== "administrador") {
      return handleErrorClient(res, 403, "No tienes permisos para editar almacenes");
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) return handleErrorClient(res, 400, "ID de almacén inválido");
    const [warehouse, error] = await updateWarehouseService(id, req.body);
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 200, "Almacén actualizado exitosamente", warehouse);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteWarehouse(req, res) {
  try {
    const userRole = req.user.rol;
    if (userRole !== "administrador") {
      return handleErrorClient(res, 403, "No tienes permisos para eliminar almacenes");
    }
    const id = parseInt(req.params.id);
    if (isNaN(id)) return handleErrorClient(res, 400, "ID de almacén inválido");
    const [result, error] = await deleteWarehouseService(id);
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Almacén eliminado exitosamente", result);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
