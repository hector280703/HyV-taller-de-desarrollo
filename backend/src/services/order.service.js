"use strict";
import Order from "../entity/order.entity.js";
import OrderItem from "../entity/orderItem.entity.js";
import Product from "../entity/product.entity.js";
import User from "../entity/user.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm";
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, sendLowStockAlertEmail } from "./email.service.js";
import { LOW_STOCK_THRESHOLD } from "../config/configEnv.js";

// Configuración de zonas de envío con tarifas por peso
const ZONAS_ENVIO = {
  local: {
    nombre: "Local (Laraquete)",
    costoBase: 1000,
    costoPorKg: 100,
    pesoGratis: 10, // kg incluidos en el costo base
  },
  arauco: {
    nombre: "Provincia de Arauco",
    costoBase: 3000,
    costoPorKg: 200,
    pesoGratis: 5,
  },
  biobio: {
    nombre: "Región del Bío Bío",
    costoBase: 6000,
    costoPorKg: 350,
    pesoGratis: 3,
  },
  regional: {
    nombre: "Otras Regiones Cercanas",
    costoBase: 12000,
    costoPorKg: 500,
    pesoGratis: 2,
  },
  nacional: {
    nombre: "Envío Nacional",
    costoBase: 20000,
    costoPorKg: 700,
    pesoGratis: 0,
  },
};

// Calcular costo de envío basado en zona y peso total
export function calcularCostoEnvio(zona, pesoTotalKg) {
  const zonaConfig = ZONAS_ENVIO[zona];
  if (!zonaConfig) {
    return { costoEnvio: 0, zona: null, error: "Zona de envío no válida" };
  }

  const pesoExcedente = Math.max(0, pesoTotalKg - zonaConfig.pesoGratis);
  const costoEnvio = Math.round(zonaConfig.costoBase + (pesoExcedente * zonaConfig.costoPorKg));

  return {
    costoEnvio,
    zona: zonaConfig.nombre,
    detalle: {
      costoBase: zonaConfig.costoBase,
      pesoTotal: pesoTotalKg,
      pesoGratis: zonaConfig.pesoGratis,
      pesoExcedente,
      costoPorKgExcedente: zonaConfig.costoPorKg,
    },
    error: null,
  };
}

// Obtener configuración de zonas (para el frontend)
export function getZonasEnvio() {
  return Object.entries(ZONAS_ENVIO).map(([key, config]) => ({
    id: key,
    nombre: config.nombre,
    costoBase: config.costoBase,
    costoPorKg: config.costoPorKg,
    pesoGratis: config.pesoGratis,
  }));
}

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
    const { items, metodoPago, direccionEnvio, telefonoContacto, notas, zonaEnvio, tipoEntrega } = orderData;
    const selectedTipoEntrega = tipoEntrega || "envio";
    
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

      // Verificar stock bajo
      if (product.stock <= LOW_STOCK_THRESHOLD) {
        orderItemsData[orderItemsData.length - 1].lowStock = true;
        orderItemsData[orderItemsData.length - 1].currentStock = product.stock;
        orderItemsData[orderItemsData.length - 1].productCode = product.codigo;
        orderItemsData[orderItemsData.length - 1].productCategory = product.categoria;
      }
    }

    // Calcular costo de envío
    let costoEnvio = 0;
    let zonaEnvioNombre = null;
    if (selectedTipoEntrega === "envio" && zonaEnvio) {
      const pesoTotal = orderItemsData.reduce((acc, item) => {
        const peso = item.product.peso ? parseFloat(item.product.peso) : 1;
        return acc + (peso * item.cantidad);
      }, 0);

      const resultadoEnvio = calcularCostoEnvio(zonaEnvio, pesoTotal);
      if (!resultadoEnvio.error) {
        costoEnvio = resultadoEnvio.costoEnvio;
        zonaEnvioNombre = resultadoEnvio.zona;
      }
    }

    const total = subtotal - descuentoTotal + costoEnvio;

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
      costoEnvio,
      zonaEnvio: zonaEnvioNombre,
      tipoEntrega: selectedTipoEntrega,
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

    // Enviar email de confirmación al cliente (no bloquea la respuesta)
    sendOrderConfirmationEmail(orderComplete).catch((err) => {
      console.error("Error al enviar email de confirmación:", err);
    });

    // Verificar y alertar productos con stock bajo
    const lowStockProducts = orderItemsData
      .filter((item) => item.lowStock)
      .map((item) => ({
        nombre: item.nombreProducto,
        codigo: item.productCode,
        stock: item.currentStock,
        categoria: item.productCategory,
      }));

    if (lowStockProducts.length > 0) {
      sendLowStockAlertEmail(lowStockProducts).catch((err) => {
        console.error("Error al enviar alerta de stock bajo:", err);
      });
    }

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
    // Admin y repartidor pueden ver todas las órdenes, usuarios normales solo las propias
    if ((userRole !== "administrador" && userRole !== "repartidor") || filters.onlyOwn === "true" || filters.onlyOwn === true) {
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
    if (userRole !== "administrador" && userRole !== "repartidor") {
      return [null, "No tienes permisos para cambiar el estado de las órdenes"];
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

    // Enviar email de actualización de estado al cliente (no bloquea la respuesta)
    sendOrderStatusUpdateEmail(orderComplete, oldStatus).catch((err) => {
      console.error("Error al enviar email de actualización de estado:", err);
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

    // Obtener orden completa con relaciones para el email
    const orderComplete = await orderRepository.findOne({
      where: { id: canceledOrder.id },
      relations: ["orderItems", "orderItems.product", "user"],
    });

    // Enviar email de cancelación al cliente (no bloquea la respuesta)
    sendOrderStatusUpdateEmail(orderComplete, "pendiente").catch((err) => {
      console.error("Error al enviar email de cancelación:", err);
    });

    return [orderComplete, null];
  } catch (error) {
    console.error("Error al cancelar orden:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getOrderStatsService() {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);

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

    // Ventas totales (todas las órdenes no canceladas)
    const ventasTotales = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.total)", "total")
      .where("order.estado != :cancelado", { cancelado: "cancelado" })
      .getRawOne();

    // Ventas de los últimos 7 días (para gráfico)
    const ventasSemana = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(today);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const ventaDia = await orderRepository
        .createQueryBuilder("order")
        .select("SUM(order.total)", "total")
        .addSelect("COUNT(*)", "cantidad")
        .where("order.createdAt >= :dayStart", { dayStart })
        .andWhere("order.createdAt < :dayEnd", { dayEnd })
        .andWhere("order.estado != :cancelado", { cancelado: "cancelado" })
        .getRawOne();

      ventasSemana.push({
        fecha: dayStart.toISOString().split("T")[0],
        dia: dayStart.toLocaleDateString("es-CL", { weekday: "short" }),
        total: parseFloat(ventaDia.total) || 0,
        cantidad: parseInt(ventaDia.cantidad) || 0,
      });
    }

    // Top 5 productos más vendidos
    const topProductos = await orderItemRepository
      .createQueryBuilder("item")
      .select("item.nombreProducto", "nombre")
      .addSelect("SUM(item.cantidad)", "totalVendido")
      .addSelect("SUM(item.subtotal)", "totalIngresos")
      .groupBy("item.nombreProducto")
      .orderBy("SUM(item.cantidad)", "DESC")
      .limit(5)
      .getRawMany();

    const stats = {
      ventasHoy: parseFloat(ventasHoy.total) || 0,
      ventasTotales: parseFloat(ventasTotales.total) || 0,
      pedidosPorEstado,
      totalPedidos,
      pedidosHoy,
      ventasSemana,
      topProductos: topProductos.map((p) => ({
        nombre: p.nombre,
        totalVendido: parseInt(p.totalVendido) || 0,
        totalIngresos: parseFloat(p.totalIngresos) || 0,
      })),
    };

    return [stats, null];
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return [null, "Error interno del servidor"];
  }
}
