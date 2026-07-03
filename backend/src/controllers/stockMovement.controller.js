"use strict";
import {
  getStockMovementsService,
  getMovementsByProductService,
  createManualMovementService,
} from "../services/stockMovement.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function getStockMovements(req, res) {
  try {
    const userRole = req.user.rol;
    if (userRole !== "administrador" && userRole !== "bodeguero") {
      return handleErrorClient(res, 403, "No tienes permisos para ver los movimientos de stock");
    }
    const [movements, error] = await getStockMovementsService(req.query);
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 200, "Movimientos de stock obtenidos exitosamente", movements);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getMovementsByProduct(req, res) {
  try {
    const userRole = req.user.rol;
    if (userRole !== "administrador" && userRole !== "bodeguero") {
      return handleErrorClient(res, 403, "No tienes permisos para ver el historial de stock");
    }
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) return handleErrorClient(res, 400, "ID de producto inválido");
    const [data, error] = await getMovementsByProductService(productId);
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Historial de stock del producto obtenido exitosamente", data);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function createManualMovement(req, res) {
  try {
    const userRole = req.user.rol;
    const [movement, error] = await createManualMovementService(req.body, userRole);
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 201, "Movimiento de stock registrado exitosamente", movement);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
