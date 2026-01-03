"use strict";
import Order from "../entity/order.entity.js";
import OrderItem from "../entity/orderItem.entity.js";
import Product from "../entity/product.entity.js";
import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";

export async function createOrderService(userId, orderData) {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);
    const productRepository = AppDataSource.getRepository(Product);
    const userRepository = AppDataSource.getRepository(User);

    // Verificar usuario
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return [null, "Usuario no encontrado"];
    }

    // Validar y calcular items
    const { items, metodoPago, direccionEnvio, telefonoContacto, notas } = orderData;
    
    let subtotal = 0;
    let descuentoTotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await productRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        return [null, `Producto con ID ${item.productId} no encontrado`];
      }

      if (product.stock < item.cantidad) {
        return [null, `Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}`];
      }

      const precioUnitario = product.precio;
      const descuento = product.descuento || 0;
      const precioConDescuento = precioUnitario - (precioUnitario * descuento / 100);
      const subtotalItem = precioConDescuento * item.cantidad;

      subtotal += precioUnitario * item.cantidad;
      descuentoTotal += (precioUnitario * descuento / 100) * item.cantidad;

      orderItemsData.push({
        product,
        nombreProducto: product.nombre,
        cantidad: item.cantidad,
        precioUnitario,
        descuento,
        subtotal: subtotalItem,
      });

      // Reducir stock
      product.stock -= item.cantidad;
      await productRepository.save(product);
    }

    const total = subtotal - descuentoTotal;

    // Generar número de orden único
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const numeroOrden = `ORD-${year}${month}${day}-${random}`;

    // Crear orden
    const newOrder = orderRepository.create({
      user,
      numeroOrden,
      estado: "pendiente",
      subtotal,
      descuentoTotal,
      total,
      metodoPago,
      direccionEnvio,
      telefonoContacto,
      notas: notas || null,
    });

    const savedOrder = await orderRepository.save(newOrder);

    // Crear items de la orden
    for (const itemData of orderItemsData) {
      const orderItem = orderItemRepository.create({
        order: savedOrder,
        product: itemData.product,
        nombreProducto: itemData.nombreProducto,
        cantidad: itemData.cantidad,
        precioUnitario: itemData.precioUnitario,
        descuento: itemData.descuento,
        subtotal: itemData.subtotal,
      });
      await orderItemRepository.save(orderItem);
    }

    // Obtener orden completa con relaciones
    const orderComplete = await orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ["orderItems", "orderItems.product", "user"],
    });

    return [orderComplete, null];
  } catch (error) {
    console.error("Error al crear orden:", error);
    return [null, "Error interno del servidor al crear la orden"];
  }
}

export async function getOrdersService(userId, userRole, filters = {}) {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    
    const whereConditions = {};

    // Si onlyOwn es true, solo mostrar órdenes del usuario actual
    // Si no es admin O si onlyOwn es true, solo puede ver sus propias órdenes
    if (userRole !== "administrador" || filters.onlyOwn === "true" || filters.onlyOwn === true) {
      whereConditions.user = { id: userId };
    }

    // Filtros adicionales
    if (filters.estado) {
      whereConditions.estado = filters.estado;
    }

    if (filters.fechaDesde && filters.fechaHasta) {
      whereConditions.createdAt = Between(
        new Date(filters.fechaDesde),
        new Date(filters.fechaHasta)
      );
    } else if (filters.fechaDesde) {
      whereConditions.createdAt = MoreThanOrEqual(new Date(filters.fechaDesde));
    } else if (filters.fechaHasta) {
      whereConditions.createdAt = LessThanOrEqual(new Date(filters.fechaHasta));
    }

    const orders = await orderRepository.find({
      where: whereConditions,
      relations: ["orderItems", "orderItems.product", "user"],
      order: { createdAt: "DESC" },
    });

    return [orders, null];
  } catch (error) {
    console.error("Error al obtener órdenes:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getOrderByIdService(orderId, userId, userRole) {
  try {
    const orderRepository = AppDataSource.getRepository(Order);

    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: ["orderItems", "orderItems.product", "user"],
    });

    if (!order) {
      return [null, "Orden no encontrada"];
    }

    // Verificar permisos
    if (userRole !== "administrador" && order.user.id !== userId) {
      return [null, "No tienes permisos para ver esta orden"];
    }

    return [order, null];
  } catch (error) {
    console.error("Error al obtener orden:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateOrderStatusService(orderId, newStatus, userId, userRole) {
  try {
    if (userRole !== "administrador") {
      return [null, "Solo los administradores pueden cambiar el estado de las órdenes"];
    }

    const orderRepository = AppDataSource.getRepository(Order);
    const productRepository = AppDataSource.getRepository(Product);

    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: ["orderItems", "orderItems.product"],
    });

    if (!order) {
      return [null, "Orden no encontrada"];
    }

    const oldStatus = order.estado;

    // Si se cancela una orden, restaurar stock
    if (newStatus === "cancelado" && oldStatus !== "cancelado") {
      for (const item of order.orderItems) {
        if (item.product) {
          item.product.stock += item.cantidad;
          await productRepository.save(item.product);
        }
      }
    }

    order.estado = newStatus;
    const updatedOrder = await orderRepository.save(order);

    const orderComplete = await orderRepository.findOne({
      where: { id: updatedOrder.id },
      relations: ["orderItems", "orderItems.product", "user"],
    });

    return [orderComplete, null];
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function cancelOrderService(orderId, userId, userRole) {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const productRepository = AppDataSource.getRepository(Product);

    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: ["orderItems", "orderItems.product", "user"],
    });

    if (!order) {
      return [null, "Orden no encontrada"];
    }

    // Solo el usuario propietario o admin puede cancelar
    if (userRole !== "administrador" && order.user.id !== userId) {
      return [null, "No tienes permisos para cancelar esta orden"];
    }

    // Solo se puede cancelar si está pendiente
    if (order.estado !== "pendiente") {
      return [null, "Solo se pueden cancelar órdenes en estado pendiente"];
    }

    // Restaurar stock
    for (const item of order.orderItems) {
      if (item.product) {
        item.product.stock += item.cantidad;
        await productRepository.save(item.product);
      }
    }

    order.estado = "cancelado";
    const canceledOrder = await orderRepository.save(order);

    return [canceledOrder, null];
  } catch (error) {
    console.error("Error al cancelar orden:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getOrderStatsService() {
  try {
    const orderRepository = AppDataSource.getRepository(Order);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Ventas del día
    const ventasHoy = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.total)", "total")
      .where("order.createdAt >= :today", { today })
      .andWhere("order.createdAt < :tomorrow", { tomorrow })
      .andWhere("order.estado != :cancelado", { cancelado: "cancelado" })
      .getRawOne();

    // Pedidos por estado
    const pedidosPorEstado = await orderRepository
      .createQueryBuilder("order")
      .select("order.estado", "estado")
      .addSelect("COUNT(*)", "cantidad")
      .groupBy("order.estado")
      .getRawMany();

    // Total de pedidos
    const totalPedidos = await orderRepository.count();

    // Pedidos de hoy
    const pedidosHoy = await orderRepository
      .createQueryBuilder("order")
      .where("order.createdAt >= :today", { today })
      .andWhere("order.createdAt < :tomorrow", { tomorrow })
      .getCount();

    const stats = {
      ventasHoy: parseFloat(ventasHoy.total) || 0,
      pedidosPorEstado,
      totalPedidos,
      pedidosHoy,
    };

    return [stats, null];
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return [null, "Error interno del servidor"];
  }
}
