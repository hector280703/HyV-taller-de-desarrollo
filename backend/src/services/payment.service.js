"use strict";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { MP_ACCESS_TOKEN, FRONTEND_URL } from "../config/configEnv.js";
import { AppDataSource } from "../config/configDb.js";
import Order from "../entity/order.entity.js";
import { sendOrderConfirmationEmail } from "./email.service.js";

// Inicializar cliente de Mercado Pago
const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN || "TEST-placeholder",
});

const preferenceClient = new Preference(mpClient);
const paymentClient = new Payment(mpClient);

/**
 * Crea una preferencia de pago en Mercado Pago para una orden existente.
 * @param {Object} order - La orden con sus items y relaciones cargadas.
 * @returns {[Object, string|null]} - [preferenceData, error]
 */
export async function createPaymentPreference(order) {
  try {
    if (!MP_ACCESS_TOKEN) {
      return [null, "Mercado Pago no está configurado. Contacte al administrador."];
    }

    // Construir los items para Mercado Pago
    const items = order.orderItems.map((item) => ({
      id: String(item.id),
      title: item.nombreProducto,
      quantity: item.cantidad,
      unit_price: Number(
        (item.precioUnitario - (item.precioUnitario * (item.descuento || 0)) / 100).toFixed(2)
      ),
      currency_id: "CLP",
    }));

    // Agregar costo de envío como item si existe
    if (order.costoEnvio && parseFloat(order.costoEnvio) > 0) {
      items.push({
        id: "envio",
        title: `Costo de Envío (${order.zonaEnvio || "Estándar"})`,
        quantity: 1,
        unit_price: Number(parseFloat(order.costoEnvio).toFixed(2)),
        currency_id: "CLP",
      });
    }

    let successUrl = `${FRONTEND_URL}/payment/success?order_id=${order.id}`;
    let failureUrl = `${FRONTEND_URL}/payment/failure?order_id=${order.id}`;
    let pendingUrl = `${FRONTEND_URL}/payment/pending?order_id=${order.id}`;

    // Si estamos en localhost, Mercado Pago rechaza las back_urls y bloquea el botón y auto_return.
    // Usamos el dominio ngrok del backend para rebotar hacia el frontend.
    if (FRONTEND_URL.includes("localhost") && process.env.NGROK_URL) {
      const ngrokDomain = process.env.NGROK_URL.replace(/\/$/, ''); // remover slash final si lo hay
      successUrl = `${ngrokDomain}/api/payments/bounce?type=success&order_id=${order.id}`;
      failureUrl = `${ngrokDomain}/api/payments/bounce?type=failure&order_id=${order.id}`;
      pendingUrl = `${ngrokDomain}/api/payments/bounce?type=pending&order_id=${order.id}`;
    }

    const preferenceData = {
      items,
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      // Habilitamos auto_return si tenemos ngrok o estamos en producción
      ...( (FRONTEND_URL.includes("localhost") && !process.env.NGROK_URL) ? {} : { auto_return: "approved" } ),
      external_reference: String(order.id),
      notification_url: process.env.NGROK_URL ? `${process.env.NGROK_URL.replace(/\/$/, '')}/api/payments/webhook` : undefined,
      statement_descriptor: "HyV Construcciones",
      metadata: {
        order_id: order.id,
        numero_orden: order.numeroOrden,
      },
    };

    const preference = await preferenceClient.create({ body: preferenceData });

    // Guardar el ID de la preferencia en la orden
    const orderRepository = AppDataSource.getRepository(Order);
    await orderRepository.update(order.id, {
      mercadoPagoId: preference.id,
    });

    return [
      {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      },
      null,
    ];
  } catch (error) {
    console.error("Error al crear preferencia de Mercado Pago:", error);
    return [null, "Error al crear la preferencia de pago en Mercado Pago"];
  }
}

/**
 * Procesa una notificación de webhook de Mercado Pago.
 * @param {Object} body - El cuerpo de la notificación.
 * @returns {[boolean, string|null]} - [success, error]
 */
export async function processWebhookNotification(body) {
  try {
    // Mercado Pago envía diferentes tipos de notificaciones
    if (body.type !== "payment" && body.action !== "payment.created" && body.action !== "payment.updated") {
      // Ignorar notificaciones que no son de pago
      return [true, null];
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return [false, "ID de pago no proporcionado"];
    }

    // Obtener detalles del pago desde Mercado Pago
    const payment = await paymentClient.get({ id: paymentId });

    if (!payment) {
      return [false, "No se pudo obtener información del pago"];
    }

    const orderId = parseInt(payment.external_reference);
    if (!orderId || isNaN(orderId)) {
      return [false, "Referencia de orden inválida"];
    }

    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: ["orderItems", "orderItems.product", "user"],
    });

    if (!order) {
      return [false, "Orden no encontrada"];
    }

    // Mapear estado de Mercado Pago a estado de pago interno
    let estadoPago = "pendiente";
    switch (payment.status) {
      case "approved":
        estadoPago = "aprobado";
        break;
      case "pending":
      case "in_process":
      case "authorized":
        estadoPago = "pendiente";
        break;
      case "rejected":
      case "cancelled":
        estadoPago = "rechazado";
        break;
      case "refunded":
      case "charged_back":
        estadoPago = "reembolsado";
        break;
      default:
        estadoPago = "pendiente";
    }

    // Actualizar la orden con la información del pago
    await orderRepository.update(order.id, {
      mercadoPagoId: String(paymentId),
      mercadoPagoStatus: payment.status,
      estadoPago,
      // Si el pago fue aprobado, marcar la orden como procesando
      ...(payment.status === "approved" && order.estado === "pendiente"
        ? { estado: "procesando" }
        : {}),
    });

    // Si el pago se aprueba y la orden estaba pendiente de pago, enviar el email
    if (payment.status === "approved" && order.estadoPago !== "aprobado") {
      // Recargar la orden para tener los datos actualizados
      const updatedOrder = await orderRepository.findOne({
        where: { id: orderId },
        relations: ["orderItems", "orderItems.product", "user"],
      });
      sendOrderConfirmationEmail(updatedOrder).catch((err) => {
        console.error("Error al enviar email tras pago MP:", err);
      });
    }

    console.log(
      `[MercadoPago] Pago ${paymentId} para orden ${order.numeroOrden}: ${payment.status} -> ${estadoPago}`
    );

    return [true, null];
  } catch (error) {
    console.error("Error procesando webhook de Mercado Pago:", error);
    return [false, "Error interno al procesar webhook"];
  }
}

/**
 * Verifica el estado de pago de una orden consultando Mercado Pago.
 * @param {number} orderId - ID de la orden.
 * @returns {[Object, string|null]} - [paymentInfo, error]
 */
export async function getPaymentStatus(orderId) {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const order = await orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      return [null, "Orden no encontrada"];
    }

    return [
      {
        orderId: order.id,
        numeroOrden: order.numeroOrden,
        estadoPago: order.estadoPago,
        mercadoPagoId: order.mercadoPagoId,
        mercadoPagoStatus: order.mercadoPagoStatus,
        metodoPago: order.metodoPago,
      },
      null,
    ];
  } catch (error) {
    console.error("Error al obtener estado de pago:", error);
    return [null, "Error interno del servidor"];
  }
}
