"use strict";
import {
  getInvoiceByOrderService,
  getInvoicesService,
  updateInvoiceStatusService,
} from "../services/invoice.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function getInvoices(req, res) {
  try {
    const userRole = req.user.rol;
    if (userRole !== "administrador") {
      return handleErrorClient(res, 403, "No tienes permisos para listar facturas");
    }
    const [invoices, error] = await getInvoicesService(req.query);
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 200, "Facturas obtenidas exitosamente", invoices);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getInvoiceByOrder(req, res) {
  try {
    const orderId = parseInt(req.params.orderId);
    const userId = req.user.id;
    const userRole = req.user.rol;
    if (isNaN(orderId)) return handleErrorClient(res, 400, "ID de orden inválido");
    const [invoice, error] = await getInvoiceByOrderService(orderId, userId, userRole);
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Factura obtenida exitosamente", invoice);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateInvoiceStatus(req, res) {
  try {
    const userRole = req.user.rol;
    if (userRole !== "administrador") {
      return handleErrorClient(res, 403, "No tienes permisos para actualizar facturas");
    }
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) return handleErrorClient(res, 400, "ID de factura inválido");
    const { estado } = req.body;
    if (!estado) return handleErrorClient(res, 400, "El campo 'estado' es requerido");
    const [invoice, error] = await updateInvoiceStatusService(invoiceId, estado);
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 200, "Estado de factura actualizado exitosamente", invoice);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
