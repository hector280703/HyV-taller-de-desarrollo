"use strict";
import {
  createOrderService,
  getOrdersService,
  getOrderByIdService,
  updateOrderStatusService,
  cancelOrderService,
  getOrderStatsService,
} from "../services/order.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import {
  orderCreateValidation,
  orderStatusValidation,
  orderQueryValidation,
} from "../validations/order.validation.js";

export async function createOrder(req, res) {
  try {
    const userId = req.user.id;
    const orderData = req.body;

    const { error } = orderCreateValidation.validate(orderData);
    if (error) {
      return handleErrorClient(res, 400, error.message);
    }

    const [order, errorOrder] = await createOrderService(userId, orderData);
    if (errorOrder) {
      return handleErrorClient(res, 400, errorOrder);
    }

    handleSuccess(res, 201, "Orden creada exitosamente", order);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getOrders(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.rol;
    const filters = req.query;

    const { error } = orderQueryValidation.validate(filters);
    if (error) {
      return handleErrorClient(res, 400, error.message);
    }

    const [orders, errorOrders] = await getOrdersService(userId, userRole, filters);
    if (errorOrders) {
      return handleErrorClient(res, 400, errorOrders);
    }

    handleSuccess(res, 200, "Órdenes obtenidas exitosamente", orders);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getOrderById(req, res) {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.rol;

    if (isNaN(orderId)) {
      return handleErrorClient(res, 400, "ID de orden inválido");
    }

    const [order, errorOrder] = await getOrderByIdService(orderId, userId, userRole);
    if (errorOrder) {
      return handleErrorClient(res, 404, errorOrder);
    }

    handleSuccess(res, 200, "Orden obtenida exitosamente", order);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.rol;
    const { estado } = req.body;

    if (isNaN(orderId)) {
      return handleErrorClient(res, 400, "ID de orden inválido");
    }

    // Validar que sea admin o repartidor
    if (userRole !== "administrador" && userRole !== "repartidor") {
      return handleErrorClient(res, 403, "No tienes permisos para actualizar estados de órdenes");
    }

    const { error } = orderStatusValidation.validate({ estado });
    if (error) {
      return handleErrorClient(res, 400, error.message);
    }

    const [order, errorOrder] = await updateOrderStatusService(
      orderId,
      estado,
      userId,
      userRole
    );
    if (errorOrder) {
      return handleErrorClient(res, 400, errorOrder);
    }

    handleSuccess(res, 200, "Estado de orden actualizado exitosamente", order);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function cancelOrder(req, res) {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.rol;

    if (isNaN(orderId)) {
      return handleErrorClient(res, 400, "ID de orden inválido");
    }

    const [order, errorOrder] = await cancelOrderService(orderId, userId, userRole);
    if (errorOrder) {
      return handleErrorClient(res, 400, errorOrder);
    }

    handleSuccess(res, 200, "Orden cancelada exitosamente", order);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getOrderStats(req, res) {
  try {
    const userRole = req.user.rol;

    if (userRole !== "administrador") {
      return handleErrorClient(
        res,
        403,
        "No tienes permisos para ver las estadísticas"
      );
    }

    const [stats, errorStats] = await getOrderStatsService();
    if (errorStats) {
      return handleErrorClient(res, 400, errorStats);
    }

    handleSuccess(res, 200, "Estadísticas obtenidas exitosamente", stats);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
