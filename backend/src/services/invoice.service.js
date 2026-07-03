"use strict";
import Invoice from "../entity/invoice.entity.js";
import { AppDataSource } from "../config/configDb.js";

/**
 * Obtener la factura de una orden específica.
 * El propietario de la orden y el admin pueden verla.
 */
export async function getInvoiceByOrderService(orderId, userId, userRole) {
  try {
    const invoiceRepository = AppDataSource.getRepository(Invoice);

    const invoice = await invoiceRepository.findOne({
      where: { order: { id: orderId } },
      relations: ["order", "order.user", "customer", "customer.user"],
    });

    if (!invoice) return [null, "Factura no encontrada para esta orden"];

    // Solo el propietario o admin pueden ver la factura
    if (userRole !== "administrador" && invoice.order.user.id !== userId) {
      return [null, "No tienes permisos para ver esta factura"];
    }

    return [invoice, null];
  } catch (error) {
    console.error("Error al obtener factura:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Listar todas las facturas con filtros opcionales (solo admin).
 */
export async function getInvoicesService(filters = {}) {
  try {
    const invoiceRepository = AppDataSource.getRepository(Invoice);

    const queryBuilder = invoiceRepository
      .createQueryBuilder("invoice")
      .leftJoinAndSelect("invoice.order", "order")
      .leftJoinAndSelect("invoice.customer", "customer")
      .leftJoinAndSelect("customer.user", "user")
      .orderBy("invoice.createdAt", "DESC");

    if (filters.estado) {
      queryBuilder.andWhere("invoice.estado = :estado", { estado: filters.estado });
    }

    if (filters.fechaDesde) {
      queryBuilder.andWhere("invoice.fechaEmision >= :fechaDesde", {
        fechaDesde: new Date(filters.fechaDesde),
      });
    }

    if (filters.fechaHasta) {
      queryBuilder.andWhere("invoice.fechaEmision <= :fechaHasta", {
        fechaHasta: new Date(filters.fechaHasta),
      });
    }

    const invoices = await queryBuilder.getMany();
    return [invoices, null];
  } catch (error) {
    console.error("Error al obtener facturas:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Actualizar el estado de una factura (solo admin).
 */
export async function updateInvoiceStatusService(invoiceId, estado) {
  try {
    const invoiceRepository = AppDataSource.getRepository(Invoice);

    const invoice = await invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ["order"],
    });

    if (!invoice) return [null, "Factura no encontrada"];

    const estadosValidos = ["emitida", "pagada", "anulada"];
    if (!estadosValidos.includes(estado)) {
      return [null, `Estado inválido. Valores posibles: ${estadosValidos.join(", ")}`];
    }

    invoice.estado = estado;
    invoice.updatedAt = new Date();
    const updated = await invoiceRepository.save(invoice);

    return [updated, null];
  } catch (error) {
    console.error("Error al actualizar estado de factura:", error);
    return [null, "Error interno del servidor"];
  }
}
