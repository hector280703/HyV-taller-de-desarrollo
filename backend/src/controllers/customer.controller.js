"use strict";
import {
  getMyCustomerProfileService,
  updateMyCustomerProfileService,
  getCustomersService,
  getCustomerByIdService,
} from "../services/customer.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function getMyCustomerProfile(req, res) {
  try {
    const userId = req.user.id;
    const [customer, error] = await getMyCustomerProfileService(userId);
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Perfil de cliente obtenido exitosamente", customer);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateMyCustomerProfile(req, res) {
  try {
    const userId = req.user.id;
    const body = req.body;
    const [customer, error] = await updateMyCustomerProfileService(userId, body);
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 200, "Perfil de cliente actualizado exitosamente", customer);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getCustomers(req, res) {
  try {
    const userRole = req.user.rol;
    if (userRole !== "administrador") {
      return handleErrorClient(res, 403, "No tienes permisos para listar clientes");
    }
    const [customers, error] = await getCustomersService();
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 200, "Clientes obtenidos exitosamente", customers);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getCustomerById(req, res) {
  try {
    const userRole = req.user.rol;
    if (userRole !== "administrador") {
      return handleErrorClient(res, 403, "No tienes permisos para ver este cliente");
    }
    const customerId = parseInt(req.params.id);
    if (isNaN(customerId)) return handleErrorClient(res, 400, "ID de cliente inválido");
    const [customer, error] = await getCustomerByIdService(customerId);
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Cliente obtenido exitosamente", customer);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
