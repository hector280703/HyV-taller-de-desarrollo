"use strict";
import nodemailer from "nodemailer";
import { EMAIL_USER, EMAIL_PASS, ADMIN_EMAIL } from "../config/configEnv.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Envía un email de confirmación de orden al cliente.
 * @param {object} order - La orden completa con relaciones (user, orderItems).
 */
export async function sendOrderConfirmationEmail(order) {
  try {
    const { user, orderItems, numeroOrden, subtotal, descuentoTotal, total, metodoPago, direccionEnvio, telefonoContacto, notas, createdAt } = order;

    const fechaFormateada = new Date(createdAt).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Generar filas de la tabla de productos
    const itemsRows = orderItems
      .map((item) => {
        return `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #ecf0f1; color: #2c3e50;">${item.nombreProducto}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #ecf0f1; color: #2c3e50; text-align: center;">${item.cantidad}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #ecf0f1; color: #2c3e50; text-align: right;">$${parseFloat(item.precioUnitario).toLocaleString("es-CL")}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #ecf0f1; color: #2c3e50; text-align: center;">${parseFloat(item.descuento)}%</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #ecf0f1; color: #ff6b35; text-align: right; font-weight: 700;">$${parseFloat(item.subtotal).toLocaleString("es-CL")}</td>
          </tr>`;
      })
      .join("");

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 640px; margin: 0 auto; padding: 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%); border-radius: 20px 20px 0 0; padding: 40px 32px; text-align: center;">
          <div style="font-size: 44px; margin-bottom: 12px;">🛒</div>
          <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 8px 0; font-weight: 800; letter-spacing: -0.5px;">¡Compra Confirmada!</h1>
          <p style="margin: 0;">
            <span style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 6px 18px; border-radius: 20px; font-size: 14px; font-weight: 700; display: inline-block;">Orden ${numeroOrden}</span>
          </p>
        </div>

        <!-- Body -->
        <div style="background: #ffffff; padding: 32px; border-left: 1px solid #ecf0f1; border-right: 1px solid #ecf0f1;">

          <!-- Greeting -->
          <p style="color: #2c3e50; font-size: 16px; margin: 0 0 24px 0; line-height: 1.6;">
            Hola <strong style="color: #ff6b35;">${user.nombreCompleto}</strong>, tu pedido ha sido registrado exitosamente. Aquí tienes el resumen:
          </p>

          <!-- Order Info Card -->
          <div style="background: #f8f9fa; border-left: 4px solid #ff6b35; border-radius: 0 12px 12px 0; padding: 16px 20px; margin-bottom: 24px;">
            <p style="color: #7f8c8d; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 6px 0; font-weight: 600;">Fecha del pedido</p>
            <p style="color: #2c3e50; font-size: 15px; margin: 0; font-weight: 700;">${fechaFormateada}</p>
          </div>

          <!-- Products Table -->
          <div style="margin-bottom: 24px;">
            <h2 style="color: #2c3e50; font-size: 16px; margin: 0 0 12px 0; padding-bottom: 10px; border-bottom: 3px solid #ff6b35; display: inline-block;">📦 Productos</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
              <thead>
                <tr style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);">
                  <th style="padding: 12px 16px; text-align: left; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Producto</th>
                  <th style="padding: 12px 16px; text-align: center; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Cant.</th>
                  <th style="padding: 12px 16px; text-align: right; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Precio</th>
                  <th style="padding: 12px 16px; text-align: center; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Desc.</th>
                  <th style="padding: 12px 16px; text-align: right; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #ecf0f1;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #7f8c8d; font-size: 14px; padding: 4px 0;">Subtotal</td>
                <td style="color: #2c3e50; font-size: 14px; padding: 4px 0; text-align: right; font-weight: 600;">$${parseFloat(subtotal).toLocaleString("es-CL")}</td>
              </tr>
              <tr>
                <td style="color: #7f8c8d; font-size: 14px; padding: 4px 0;">Descuento</td>
                <td style="color: #27ae60; font-size: 14px; padding: 4px 0; text-align: right; font-weight: 600;">-$${parseFloat(descuentoTotal).toLocaleString("es-CL")}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 8px 0 0 0;"><div style="border-top: 2px solid #ecf0f1;"></div></td>
              </tr>
              <tr>
                <td style="color: #2c3e50; font-size: 20px; font-weight: 800; padding: 8px 0 0 0;">Total</td>
                <td style="color: #ff6b35; font-size: 20px; font-weight: 800; padding: 8px 0 0 0; text-align: right;">$${parseFloat(total).toLocaleString("es-CL")}</td>
              </tr>
            </table>
          </div>

          <!-- Shipping & Payment Details -->
          <div style="background: #ffffff; border: 2px solid #ecf0f1; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h3 style="color: #2c3e50; font-size: 15px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 2px solid #f7931e; display: inline-block;">🚚 Detalles de Envío y Pago</h3>
            <table style="width: 100%;">
              <tr>
                <td style="color: #7f8c8d; font-size: 13px; padding: 6px 0; width: 140px; vertical-align: top;">Método de pago:</td>
                <td style="color: #2c3e50; font-size: 13px; padding: 6px 0; font-weight: 600;">${metodoPago}</td>
              </tr>
              <tr>
                <td style="color: #7f8c8d; font-size: 13px; padding: 6px 0; vertical-align: top;">Dirección:</td>
                <td style="color: #2c3e50; font-size: 13px; padding: 6px 0;">${direccionEnvio}</td>
              </tr>
              <tr>
                <td style="color: #7f8c8d; font-size: 13px; padding: 6px 0; vertical-align: top;">Teléfono:</td>
                <td style="color: #2c3e50; font-size: 13px; padding: 6px 0;">${telefonoContacto}</td>
              </tr>
              ${notas ? `
              <tr>
                <td style="color: #7f8c8d; font-size: 13px; padding: 6px 0; vertical-align: top;">Notas:</td>
                <td style="color: #2c3e50; font-size: 13px; padding: 6px 0; font-style: italic;">${notas}</td>
              </tr>` : ""}
            </table>
          </div>

          <!-- Status Badge -->
          <div style="text-align: center; margin-bottom: 8px;">
            <span style="display: inline-block; background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: #ffffff; padding: 10px 28px; border-radius: 25px; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);">
              ⏳ Estado: Pendiente
            </span>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); border-radius: 0 0 20px 20px; padding: 24px 32px; text-align: center;">
          <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; margin: 0 0 8px 0;">
            Este correo fue enviado automáticamente. No respondas a este mensaje.
          </p>
          <p style="color: rgba(255, 255, 255, 0.35); font-size: 11px; margin: 0;">
            © ${new Date().getFullYear()} HyV Taller de Desarrollo. Todos los derechos reservados.
          </p>
        </div>

      </div>
    </body>
    </html>`;

    const mailOptions = {
      from: `"HyV Tienda" <${EMAIL_USER}>`,
      to: user.email,
      subject: `✅ Confirmación de Compra - Orden ${numeroOrden}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email de confirmación enviado a ${user.email} - MessageId: ${info.messageId}`);
    return [info, null];
  } catch (error) {
    console.error("Error al enviar email de confirmación:", error);
    return [null, error.message];
  }
}

/**
 * Envía un email al cliente cuando el estado de su orden cambia.
 * @param {object} order - La orden completa con relaciones (user, orderItems).
 * @param {string} oldStatus - El estado anterior de la orden.
 */
export async function sendOrderStatusUpdateEmail(order, oldStatus) {
  try {
    const { user, numeroOrden, total, estado: newStatus } = order;

    // Configuración visual por estado
    const statusConfig = {
      procesando: {
        icon: "⚙️",
        label: "Procesando",
        color: "#3498db",
        gradient: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
        message: "Tu pedido está siendo preparado. Te notificaremos cuando sea enviado.",
        subject: "🔄 Tu pedido está siendo procesado",
      },
      enviado: {
        icon: "🚚",
        label: "Enviado",
        color: "#f39c12",
        gradient: "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
        message: "¡Tu pedido va en camino! Pronto lo recibirás en tu dirección.",
        subject: "📦 ¡Tu pedido ha sido enviado!",
      },
      entregado: {
        icon: "✅",
        label: "Entregado",
        color: "#27ae60",
        gradient: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
        message: "Tu pedido ha sido entregado exitosamente. ¡Gracias por tu compra!",
        subject: "🎉 ¡Tu pedido fue entregado!",
      },
      cancelado: {
        icon: "❌",
        label: "Cancelado",
        color: "#e74c3c",
        gradient: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
        message: "Tu pedido ha sido cancelado. Si tienes dudas, no dudes en contactarnos.",
        subject: "🚫 Tu pedido ha sido cancelado",
      },
    };

    const config = statusConfig[newStatus] || {
      icon: "📋",
      label: newStatus,
      color: "#7f8c8d",
      gradient: "linear-gradient(135deg, #7f8c8d 0%, #95a5a6 100%)",
      message: "El estado de tu pedido ha sido actualizado.",
      subject: `📋 Actualización de tu pedido`,
    };

    // Generar pasos del timeline
    const steps = ["pendiente", "procesando", "enviado", "entregado"];
    const isCanceled = newStatus === "cancelado";
    const currentStepIndex = steps.indexOf(newStatus);

    const timelineSteps = steps.map((step, index) => {
      const stepLabels = { pendiente: "Pendiente", procesando: "Procesando", enviado: "Enviado", entregado: "Entregado" };
      const stepIcons = { pendiente: "📋", procesando: "⚙️", enviado: "🚚", entregado: "✅" };
      let bgColor = "#ecf0f1";
      let textColor = "#bdc3c7";

      if (isCanceled) {
        bgColor = "#ecf0f1";
        textColor = "#bdc3c7";
      } else if (index <= currentStepIndex) {
        bgColor = config.color;
        textColor = "#ffffff";
      }

      return `
        <td style="text-align: center; padding: 0 4px; width: 25%;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: ${bgColor}; color: ${textColor}; display: inline-flex; align-items: center; justify-content: center; font-size: 18px; margin-bottom: 6px;">${stepIcons[step]}</div>
          <p style="color: ${index <= currentStepIndex && !isCanceled ? '#2c3e50' : '#bdc3c7'}; font-size: 11px; margin: 0; font-weight: ${index <= currentStepIndex && !isCanceled ? '700' : '400'};">${stepLabels[step]}</p>
        </td>`;
    }).join("");

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 640px; margin: 0 auto; padding: 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%); border-radius: 20px 20px 0 0; padding: 40px 32px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 12px;">${config.icon}</div>
          <h1 style="color: #ffffff; font-size: 26px; margin: 0 0 8px 0; font-weight: 800;">Actualización de Pedido</h1>
          <p style="margin: 0;">
            <span style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 6px 18px; border-radius: 20px; font-size: 14px; font-weight: 700; display: inline-block;">Orden ${numeroOrden}</span>
          </p>
        </div>

        <!-- Body -->
        <div style="background: #ffffff; padding: 32px; border-left: 1px solid #ecf0f1; border-right: 1px solid #ecf0f1;">

          <!-- Greeting -->
          <p style="color: #2c3e50; font-size: 16px; margin: 0 0 24px 0; line-height: 1.6;">
            Hola <strong style="color: #ff6b35;">${user.nombreCompleto}</strong>, el estado de tu pedido ha sido actualizado.
          </p>

          <!-- Status Change Card -->
          <div style="background: #f8f9fa; border-radius: 16px; padding: 24px; margin-bottom: 24px; text-align: center; border: 1px solid #ecf0f1;">
            <p style="color: #7f8c8d; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 16px 0; font-weight: 600;">Nuevo estado</p>
            <div style="display: inline-block; ${config.gradient}; background: ${config.color}; color: #ffffff; padding: 14px 36px; border-radius: 30px; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
              ${config.icon} ${config.label}
            </div>
            <p style="color: #2c3e50; font-size: 14px; margin: 20px 0 0 0; line-height: 1.6;">${config.message}</p>
          </div>

          <!-- Timeline -->
          ${!isCanceled ? `
          <div style="margin-bottom: 24px;">
            <h3 style="color: #2c3e50; font-size: 14px; margin: 0 0 16px 0; text-align: center; font-weight: 700;">Progreso del pedido</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>${timelineSteps}</tr>
            </table>
          </div>` : ""}

          <!-- Order Summary -->
          <div style="background: #f8f9fa; border-left: 4px solid #ff6b35; border-radius: 0 12px 12px 0; padding: 16px 20px; margin-bottom: 8px;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #7f8c8d; font-size: 13px; padding: 3px 0;">Nº de Orden:</td>
                <td style="color: #2c3e50; font-size: 13px; padding: 3px 0; text-align: right; font-weight: 700;">${numeroOrden}</td>
              </tr>
              <tr>
                <td style="color: #7f8c8d; font-size: 13px; padding: 3px 0;">Total:</td>
                <td style="color: #ff6b35; font-size: 13px; padding: 3px 0; text-align: right; font-weight: 700;">$${parseFloat(total).toLocaleString("es-CL")}</td>
              </tr>
            </table>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); border-radius: 0 0 20px 20px; padding: 24px 32px; text-align: center;">
          <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; margin: 0 0 8px 0;">
            Este correo fue enviado automáticamente. No respondas a este mensaje.
          </p>
          <p style="color: rgba(255, 255, 255, 0.35); font-size: 11px; margin: 0;">
            © ${new Date().getFullYear()} HyV Taller de Desarrollo. Todos los derechos reservados.
          </p>
        </div>

      </div>
    </body>
    </html>`;

    const mailOptions = {
      from: `"HyV Tienda" <${EMAIL_USER}>`,
      to: user.email,
      subject: `${config.subject} - Orden ${numeroOrden}`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email de actualización (${newStatus}) enviado a ${user.email} - MessageId: ${info.messageId}`);
    return [info, null];
  } catch (error) {
    console.error("Error al enviar email de actualización de estado:", error);
    return [null, error.message];
  }
}

/**
 * Envía un email de alerta de stock bajo al administrador.
 * @param {Array} products - Lista de productos con stock bajo [{nombre, codigo, stock, categoria}].
 */
export async function sendLowStockAlertEmail(products) {
  try {
    if (!ADMIN_EMAIL) {
      console.warn("⚠️ ADMIN_EMAIL no configurado, no se enviará alerta de stock bajo.");
      return [null, "ADMIN_EMAIL no configurado"];
    }

    const productRows = products
      .map((p) => {
        const stockColor = p.stock === 0 ? "#e74c3c" : "#f39c12";
        const stockLabel = p.stock === 0 ? "SIN STOCK" : `${p.stock} unidades`;
        return `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #ecf0f1; color: #2c3e50; font-weight: 600;">${p.nombre}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #ecf0f1; color: #7f8c8d;">${p.codigo}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #ecf0f1; color: #7f8c8d;">${p.categoria || "—"}</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #ecf0f1; text-align: center;">
              <span style="background: ${stockColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;">${stockLabel}</span>
            </td>
          </tr>`;
      })
      .join("");

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 640px; margin: 0 auto; padding: 20px;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); border-radius: 20px 20px 0 0; padding: 40px 32px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
          <h1 style="color: #ffffff; font-size: 26px; margin: 0 0 8px 0; font-weight: 800;">Alerta de Stock Bajo</h1>
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">${products.length} producto${products.length > 1 ? "s" : ""} con stock bajo</p>
        </div>

        <!-- Body -->
        <div style="background: #ffffff; padding: 32px; border-left: 1px solid #ecf0f1; border-right: 1px solid #ecf0f1;">

          <p style="color: #2c3e50; font-size: 15px; margin: 0 0 24px 0; line-height: 1.6;">
            Los siguientes productos necesitan reposición de inventario:
          </p>

          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);">
                <th style="padding: 12px 16px; text-align: left; color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Producto</th>
                <th style="padding: 12px 16px; text-align: left; color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Código</th>
                <th style="padding: 12px 16px; text-align: left; color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Categoría</th>
                <th style="padding: 12px 16px; text-align: center; color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Stock</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>

        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); border-radius: 0 0 20px 20px; padding: 24px 32px; text-align: center;">
          <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; margin: 0 0 8px 0;">
            Este correo fue enviado automáticamente. Repón el inventario lo antes posible.
          </p>
          <p style="color: rgba(255, 255, 255, 0.35); font-size: 11px; margin: 0;">
            © ${new Date().getFullYear()} HyV Taller de Desarrollo.
          </p>
        </div>

      </div>
    </body>
    </html>`;

    const mailOptions = {
      from: `"HyV Tienda - Alerta" <${EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `🚨 Alerta: ${products.length} producto${products.length > 1 ? "s" : ""} con stock bajo`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`🚨 Email de alerta de stock bajo enviado a ${ADMIN_EMAIL} - MessageId: ${info.messageId}`);
    return [info, null];
  } catch (error) {
    console.error("Error al enviar email de alerta de stock bajo:", error);
    return [null, error.message];
  }
}
