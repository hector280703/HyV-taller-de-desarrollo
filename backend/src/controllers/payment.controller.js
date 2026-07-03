"use strict";
import {
  createPaymentPreference,
  processWebhookNotification,
  getPaymentStatus,
} from "../services/payment.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

/**
 * Crear una preferencia de pago de Mercado Pago para una orden existente.
 * POST /api/payments/create-preference
 */
export async function createPreference(req, res) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return handleErrorClient(res, 400, "Se requiere el ID de la orden");
    }

    // Obtener la orden completa
    const { AppDataSource } = await import("../config/configDb.js");
    const Order = (await import("../entity/order.entity.js")).default;

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({
      where: { id: parseInt(orderId) },
      relations: ["orderItems", "orderItems.product", "user"],
    });

    if (!order) {
      return handleErrorClient(res, 404, "Orden no encontrada");
    }

    // Verificar que la orden pertenece al usuario actual
    if (order.user.id !== req.user.id && req.user.rol !== "administrador") {
      return handleErrorClient(res, 403, "No tienes permisos sobre esta orden");
    }

    // Verificar que la orden está pendiente de pago
    if (order.estadoPago === "aprobado") {
      return handleErrorClient(res, 400, "Esta orden ya fue pagada");
    }

    const [preferenceData, error] = await createPaymentPreference(order);

    if (error) {
      return handleErrorClient(res, 400, error);
    }

    handleSuccess(res, 200, "Preferencia de pago creada", preferenceData);
  } catch (error) {
    console.error("Error en createPreference:", error);
    handleErrorServer(res, 500, error.message);
  }
}

/**
 * Webhook de Mercado Pago para recibir notificaciones de pago.
 * POST /api/payments/webhook
 * Esta ruta NO requiere autenticación JWT.
 */
export async function paymentWebhook(req, res) {
  try {
    console.log("[MercadoPago Webhook] Notificación recibida:", JSON.stringify(req.body));

    const [success, error] = await processWebhookNotification(req.body);

    if (!success) {
      console.error("[MercadoPago Webhook] Error:", error);
      // Siempre responder 200 a Mercado Pago para evitar reintentos
      return res.status(200).json({ received: true, error });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[MercadoPago Webhook] Error fatal:", error);
    // Siempre responder 200 a Mercado Pago
    res.status(200).json({ received: true });
  }
}

/**
 * Rebote (Bounce) para entorno de desarrollo local.
 * Recibe la redirección desde Mercado Pago (usando el dominio de ngrok)
 * y redirige al usuario hacia el frontend en localhost.
 * GET /api/payments/bounce
 */
export async function paymentBounce(req, res) {
  const queryParams = new URLSearchParams(req.query).toString();
  const type = req.query.type || 'success';
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  
  res.redirect(`${frontendUrl}/payment/${type}?${queryParams}`);
}

/**
 * Obtener el estado de pago de una orden.
 * GET /api/payments/status/:orderId
 */
export async function getPaymentStatusController(req, res) {
  try {
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      return handleErrorClient(res, 400, "ID de orden inválido");
    }

    const [paymentInfo, error] = await getPaymentStatus(orderId);

    if (error) {
      return handleErrorClient(res, 404, error);
    }

    handleSuccess(res, 200, "Estado de pago obtenido", paymentInfo);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
