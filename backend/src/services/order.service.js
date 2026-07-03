"use strict";
import Order from "../entity/order.entity.js";
import OrderItem from "../entity/orderItem.entity.js";
import OrderHistory from "../entity/orderHistory.entity.js";
import Product from "../entity/product.entity.js";
import User from "../entity/user.entity.js";
import Invoice from "../entity/invoice.entity.js";
import Customer from "../entity/customer.entity.js";
import StockMovement from "../entity/stockMovement.entity.js";
import Warehouse from "../entity/warehouse.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { Between, MoreThanOrEqual, LessThanOrEqual, Not } from "typeorm";
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail, sendLowStockAlertEmail, sendStockIncidentEmail } from "./email.service.js";
import { LOW_STOCK_THRESHOLD, MAX_DELIVERIES_PER_DAY } from "../config/configEnv.js";

// Obtener el primer almacén activo (para vincular movimientos de stock)
async function getDefaultWarehouse() {
  try {
    const warehouseRepository = AppDataSource.getRepository(Warehouse);
    return await warehouseRepository.findOne({ where: { activo: true } });
  } catch {
    return null;
  }
}

// Registrar un movimiento de stock
async function registrarMovimientoStock({ product, tipo, cantidad, cantidadAnterior, cantidadNueva, motivo, referencia }) {
  try {
    const stockMovementRepository = AppDataSource.getRepository(StockMovement);
    const warehouse = await getDefaultWarehouse();
    await stockMovementRepository.save(
      stockMovementRepository.create({
        product,
        warehouse: warehouse || null,
        tipo,
        cantidad,
        cantidadAnterior,
        cantidadNueva,
        motivo,
        referencia,
      })
    );
  } catch (err) {
    console.error("Error al registrar movimiento de stock:", err);
  }
}

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
    const { items, metodoPago, direccionEnvio, telefonoContacto, notas, zonaEnvio, tipoEntrega, fechaEntrega } = orderData;
    const selectedTipoEntrega = tipoEntrega || "envio";

    if (!fechaEntrega) {
      return [null, "La fecha de entrega/retiro es requerida"];
    }

    const deliveryDate = new Date(fechaEntrega);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mínimo 2 días de anticipación
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 2);

    if (deliveryDate < minDate) {
      return [null, "La fecha de entrega debe tener al menos 2 días de anticipación"];
    }

    // No domingos (0 = domingo en getUTCDay / getDay, pero considerando huso horario es mejor getUTCDay() si ISO es YYYY-MM-DD)
    // Para asegurar precisión con el input "YYYY-MM-DD" que a las 00:00 UTC es igual al día local
    if (deliveryDate.getUTCDay() === 0) {
      return [null, "No realizamos entregas ni retiros los días domingo"];
    }

    // Validar límite diario de 10 pedidos
    try {
      const formattedDate = new Date(fechaEntrega).toISOString().split('T')[0];
      const dailyOrdersCount = await orderRepository.count({
        where: {
          fechaEntrega: formattedDate,
          estado: Not("cancelado")
        }
      });
      
      if (dailyOrdersCount >= MAX_DELIVERIES_PER_DAY) {
        return [null, `El cupo de entregas para la fecha ${formattedDate} está completo (Límite: ${MAX_DELIVERIES_PER_DAY} pedidos)`];
      }
    } catch (countError) {
      console.error("Error al validar límite de entregas diarias:", countError);
    }

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

      // Reducir stock y registrar movimiento
      const stockAnterior = product.stock;
      product.stock -= item.cantidad;
      await productRepository.save(product);

      // Guardar datos del movimiento para registrar después de tener el número de orden
      orderItemsData[orderItemsData.length - 1].stockAnterior = stockAnterior;
      orderItemsData[orderItemsData.length - 1].stockNuevo = product.stock;

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
      fechaEntrega: deliveryDate,
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

    // Registrar historial inicial
    const orderHistoryRepository = AppDataSource.getRepository(OrderHistory);
    await orderHistoryRepository.save(
      orderHistoryRepository.create({
        order: savedOrder,
        estadoAnterior: null,
        estadoNuevo: "pendiente",
        nota: "Pedido creado",
      })
    );

    // Registrar movimientos de stock (salida por venta)
    for (const itemData of orderItemsData) {
      await registrarMovimientoStock({
        product: itemData.product,
        tipo: "salida",
        cantidad: itemData.cantidad,
        cantidadAnterior: itemData.stockAnterior,
        cantidadNueva: itemData.stockNuevo,
        motivo: "Venta por orden",
        referencia: numeroOrden,
      });
    }

    // Generar factura automáticamente
    try {
      const invoiceRepository = AppDataSource.getRepository(Invoice);
      const customerRepository = AppDataSource.getRepository(Customer);
      const fecha = new Date();
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, "0");
      const day = String(fecha.getDate()).padStart(2, "0");
      const randomFac = Math.floor(Math.random() * 9000 + 1000);
      const numeroFactura = `FAC-${year}${month}${day}-${randomFac}`;
      const ivaRate = 0.19;
      const subtotalFac = parseFloat(subtotal - descuentoTotal);
      const ivaFac = parseFloat((subtotalFac * ivaRate).toFixed(2));
      const totalFac = parseFloat((subtotalFac + ivaFac + costoEnvio).toFixed(2));

      const customerFound = await customerRepository.findOne({ where: { user: { id: userId } } });

      await invoiceRepository.save(
        invoiceRepository.create({
          order: savedOrder,
          customer: customerFound || null,
          numeroFactura,
          fechaEmision: new Date(),
          subtotal: subtotalFac,
          iva: ivaFac,
          total: totalFac,
          estado: "emitida",
        })
      );
    } catch (invoiceError) {
      console.error("Error al generar factura:", invoiceError);
    }

    // Obtener orden completa con relaciones
    const orderComplete = await orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ["orderItems", "orderItems.product", "user"],
    });

    // Enviar email de confirmación al cliente solo si no es Mercado Pago (se enviará al confirmar pago)
    if (orderComplete.metodoPago !== "mercadopago") {
      sendOrderConfirmationEmail(orderComplete).catch((err) => {
        console.error("Error al enviar email de confirmación:", err);
      });
    }
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
    // Admin, repartidor y bodeguero pueden ver todas las órdenes, usuarios normales solo las propias
    if ((userRole !== "administrador" && userRole !== "repartidor" && userRole !== "bodeguero") || filters.onlyOwn === "true" || filters.onlyOwn === true) {
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
    if (userRole !== "administrador" && userRole !== "repartidor" && userRole !== "bodeguero") {
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

    // Registrar cambio en el historial
    const orderHistoryRepository = AppDataSource.getRepository(OrderHistory);
    const notasEstado = {
      procesando: "El pedido está siendo preparado",
      listo_para_envio: "El pedido está listo para ser despachado",
      en_camino: "El pedido está en camino a la dirección de entrega",
      entregado: "El pedido fue entregado al cliente",
      cancelado: "El pedido fue cancelado",
      incidencia_stock: "Se registró una incidencia de stock en el pedido",
    };
    await orderHistoryRepository.save(
      orderHistoryRepository.create({
        order: { id: updatedOrder.id },
        estadoAnterior: oldStatus,
        estadoNuevo: newStatus,
        nota: notasEstado[newStatus] || `Estado cambiado a ${newStatus}`,
      })
    );

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

    // Restaurar stock y registrar movimientos de entrada
    for (const item of order.orderItems) {
      if (item.product) {
        const stockAnterior = item.product.stock;
        item.product.stock += item.cantidad;
        await productRepository.save(item.product);
        await registrarMovimientoStock({
          product: item.product,
          tipo: "entrada",
          cantidad: item.cantidad,
          cantidadAnterior: stockAnterior,
          cantidadNueva: item.product.stock,
          motivo: "Cancelación de orden",
          referencia: order.numeroOrden,
        });
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

export async function getOrderHistoryService(orderId, userId, userRole) {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const orderHistoryRepository = AppDataSource.getRepository(OrderHistory);

    // Verificar que la orden existe y que el usuario tiene permisos
    const order = await orderRepository.findOne({
      where: { id: orderId },
      relations: ["user"],
    });

    if (!order) {
      return [null, "Orden no encontrada"];
    }

    // Solo el dueño o roles con permisos pueden ver el historial
    if (
      userRole !== "administrador" &&
      userRole !== "repartidor" &&
      userRole !== "bodeguero" &&
      order.user.id !== userId
    ) {
      return [null, "No tienes permisos para ver el historial de esta orden"];
    }

    const history = await orderHistoryRepository.find({
      where: { order: { id: orderId } },
      order: { creadoEn: "ASC" },
    });

    return [history, null];
  } catch (error) {
    console.error("Error al obtener historial de orden:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getOrderStatsService(mes, anio) {
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const targetMonth = mes ? parseInt(mes) - 1 : today.getMonth();
    const targetYear = anio ? parseInt(anio) : today.getFullYear();
    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Ventas del día
    const ventasHoy = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.total)", "total")
      .where("order.createdAt >= :today", { today })
      .andWhere("order.createdAt < :tomorrow", { tomorrow })
      .andWhere("order.estado != :cancelado", { cancelado: "cancelado" })
      .getRawOne();

    // Ventas del mes
    const ventasMes = await orderRepository
      .createQueryBuilder("order")
      .select("SUM(order.total)", "total")
      .where("order.createdAt >= :startOfMonth", { startOfMonth })
      .andWhere("order.createdAt <= :endOfMonth", { endOfMonth })
      .andWhere("order.estado != :cancelado", { cancelado: "cancelado" })
      .getRawOne();

    // Pedidos del mes
    const pedidosMes = await orderRepository
      .createQueryBuilder("order")
      .where("order.createdAt >= :startOfMonth", { startOfMonth })
      .andWhere("order.createdAt <= :endOfMonth", { endOfMonth })
      .getCount();

    // Pedidos por estado (del mes)
    const pedidosPorEstado = await orderRepository
      .createQueryBuilder("order")
      .select("order.estado", "estado")
      .addSelect("COUNT(*)", "cantidad")
      .where("order.createdAt >= :startOfMonth", { startOfMonth })
      .andWhere("order.createdAt <= :endOfMonth", { endOfMonth })
      .groupBy("order.estado")
      .getRawMany();

    // Total de pedidos (historico)
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

    // Ventas Mensuales del Año Seleccionado
    const ventasMensualesAnio = [];
    const mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    for (let i = 0; i < 12; i++) {
      const startOfM = new Date(targetYear, i, 1);
      const endOfM = new Date(targetYear, i + 1, 0, 23, 59, 59, 999);
      
      const ventaMes = await orderRepository
        .createQueryBuilder("order")
        .select("SUM(order.total)", "total")
        .addSelect("COUNT(*)", "cantidad")
        .where("order.createdAt >= :startOfM", { startOfM })
        .andWhere("order.createdAt <= :endOfM", { endOfM })
        .andWhere("order.estado != :cancelado", { cancelado: "cancelado" })
        .getRawOne();

      ventasMensualesAnio.push({
        mes: mesesNombres[i],
        total: parseFloat(ventaMes.total) || 0,
        cantidad: parseInt(ventaMes.cantidad) || 0,
      });
    }

    // Ventas Diarias del Mes Seleccionado
    const ventasDiariasMes = [];
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStart = new Date(targetYear, targetMonth, i);
      const dayEnd = new Date(targetYear, targetMonth, i, 23, 59, 59, 999);

      const ventaDia = await orderRepository
        .createQueryBuilder("order")
        .select("SUM(order.total)", "total")
        .addSelect("COUNT(*)", "cantidad")
        .where("order.createdAt >= :dayStart", { dayStart })
        .andWhere("order.createdAt <= :dayEnd", { dayEnd })
        .andWhere("order.estado != :cancelado", { cancelado: "cancelado" })
        .getRawOne();

      ventasDiariasMes.push({
        dia: i.toString(),
        total: parseFloat(ventaDia.total) || 0,
        cantidad: parseInt(ventaDia.cantidad) || 0,
      });
    }

    // Top 5 productos más vendidos (del mes)
    const topProductos = await orderItemRepository
      .createQueryBuilder("item")
      .leftJoin("item.order", "order")
      .select("item.nombreProducto", "nombre")
      .addSelect("SUM(item.cantidad)", "totalVendido")
      .addSelect("SUM(item.subtotal)", "totalIngresos")
      .where("order.createdAt >= :startOfMonth", { startOfMonth })
      .andWhere("order.createdAt <= :endOfMonth", { endOfMonth })
      .andWhere("order.estado != :cancelado", { cancelado: "cancelado" })
      .groupBy("item.nombreProducto")
      .orderBy("SUM(item.cantidad)", "DESC")
      .limit(5)
      .getRawMany();

    const stats = {
      ventasHoy: parseFloat(ventasHoy.total) || 0,
      ventasMes: parseFloat(ventasMes.total) || 0,
      pedidosMes,
      mesSeleccionado: `${String(targetMonth + 1).padStart(2, '0')}/${targetYear}`,
      anioSeleccionado: targetYear,
      ventasTotales: parseFloat(ventasTotales.total) || 0,
      pedidosPorEstado,
      totalPedidos,
      pedidosHoy,
      ventasMensualesAnio,
      ventasDiariasMes,
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

export async function reportStockIssueService(orderId, issues, userId, userRole) {
  try {
    if (userRole !== "administrador" && userRole !== "bodeguero") {
      return [null, "No tienes permisos para reportar problemas de stock"];
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

    if (order.estado !== "pendiente" && order.estado !== "procesando") {
      return [null, "Solo se pueden reportar problemas en órdenes pendientes o procesando"];
    }

    let notesAddition = "\n[INCIDENCIA STOCK - BODEGA]:\n";
    const incidentDetails = [];

    for (const issue of issues) {
      const orderItem = order.orderItems.find(item => item.product.id === issue.productId);
      if (orderItem && issue.foundQuantity < orderItem.cantidad) {
        const product = orderItem.product;
        const faltante = orderItem.cantidad - issue.foundQuantity;
        
        notesAddition += `- Falta ${product.nombre}: pedido ${orderItem.cantidad}, encontrado ${issue.foundQuantity}.\n`;

        incidentDetails.push({
           product: product,
           cantidad: orderItem.cantidad,
           foundQuantity: issue.foundQuantity
        });

        // Ajustar el inventario real restando lo que se perdió/no se encontró
        const stockAnterioAjuste = product.stock;
        product.stock = Math.max(0, product.stock - faltante);
        await productRepository.save(product);
        await registrarMovimientoStock({
          product,
          tipo: "ajuste",
          cantidad: faltante,
          cantidadAnterior: stockAnterioAjuste,
          cantidadNueva: product.stock,
          motivo: "Incidencia de stock reportada por bodega",
          referencia: order.numeroOrden,
        });
      }
    }

    order.estado = "incidencia_stock";
    order.notas = (order.notas ? order.notas + "\n" : "") + notesAddition;

    await orderRepository.save(order);

    // Send email to admin about the missing stock
    if (incidentDetails.length > 0) {
      sendStockIncidentEmail(order, incidentDetails).catch((err) => {
        console.error("Error al enviar email de incidencia:", err);
      });
    }

    return [order, null];
  } catch (error) {
    console.error("Error al reportar problema de stock:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Obtener las fechas completamente copadas (límite de 10 pedidos diarios).
 */
export async function getDeliveryAvailabilityService(year, month) {
  try {
    const orderRepository = AppDataSource.getRepository(Order);

    let startDate;
    let endDate;

    if (year && month) {
      const y = parseInt(year);
      const m = parseInt(month);
      startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      endDate = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    } else {
      const today = new Date();
      const y = today.getFullYear();
      const m = today.getMonth() + 1;
      startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      
      const future = new Date();
      future.setMonth(future.getMonth() + 3);
      const fy = future.getFullYear();
      const fm = future.getMonth() + 1;
      const lastDay = new Date(fy, fm, 0).getDate();
      endDate = `${fy}-${String(fm).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    }

    const query = orderRepository
      .createQueryBuilder("order")
      .select("order.fechaEntrega", "fechaEntrega")
      .addSelect("COUNT(order.id)", "count")
      .where("order.estado != :estado", { estado: "cancelado" })
      .andWhere("order.fechaEntrega >= :startDate", { startDate })
      .andWhere("order.fechaEntrega <= :endDate", { endDate })
      .groupBy("order.fechaEntrega");

    const results = await query.getRawMany();

    const unavailableDates = results
      .filter((r) => parseInt(r.count) >= MAX_DELIVERIES_PER_DAY)
      .map((r) => {
        // En algunas bases de datos, fechaEntrega se retorna como string "YYYY-MM-DD" o como objeto Date
        const dateVal = r.fechaEntrega;
        if (dateVal instanceof Date) {
          return dateVal.toISOString().split("T")[0];
        }
        if (typeof dateVal === "string") {
          // Remover zona horaria si la hay
          return dateVal.split(" ")[0].split("T")[0];
        }
        return dateVal;
      });

    return [unavailableDates, null];
  } catch (error) {
    console.error("Error al obtener disponibilidad de entregas:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Actualizar el orden de secuencia planificado de reparto (reordenar entregas).
 */
export async function updateDeliverySequenceService(orderSequences) {
  try {
    const orderRepository = AppDataSource.getRepository(Order);

    for (const item of orderSequences) {
      if (item.id !== undefined && item.secuenciaEntrega !== undefined) {
        await orderRepository.update(item.id, {
          secuenciaEntrega: item.secuenciaEntrega !== null ? parseInt(item.secuenciaEntrega) : null,
        });
      }
    }

    return [true, null];
  } catch (error) {
    console.error("Error al actualizar secuencia de entregas:", error);
    return [null, "Error interno del servidor"];
  }
}

