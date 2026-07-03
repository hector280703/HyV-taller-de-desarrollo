"use strict";
import StockMovement from "../entity/stockMovement.entity.js";
import Product from "../entity/product.entity.js";
import Warehouse from "../entity/warehouse.entity.js";
import { AppDataSource } from "../config/configDb.js";

/**
 * Listar todos los movimientos de stock con filtros opcionales (admin/bodeguero).
 */
export async function getStockMovementsService(filters = {}) {
  try {
    const stockMovementRepository = AppDataSource.getRepository(StockMovement);

    const queryBuilder = stockMovementRepository
      .createQueryBuilder("movement")
      .leftJoinAndSelect("movement.product", "product")
      .leftJoinAndSelect("movement.warehouse", "warehouse")
      .orderBy("movement.creadoEn", "DESC");

    if (filters.tipo) {
      queryBuilder.andWhere("movement.tipo = :tipo", { tipo: filters.tipo });
    }

    if (filters.productId) {
      queryBuilder.andWhere("movement.product.id = :productId", {
        productId: parseInt(filters.productId),
      });
    }

    if (filters.warehouseId) {
      queryBuilder.andWhere("movement.warehouse.id = :warehouseId", {
        warehouseId: parseInt(filters.warehouseId),
      });
    }

    if (filters.fechaDesde) {
      queryBuilder.andWhere("movement.creadoEn >= :fechaDesde", {
        fechaDesde: new Date(filters.fechaDesde),
      });
    }

    if (filters.fechaHasta) {
      queryBuilder.andWhere("movement.creadoEn <= :fechaHasta", {
        fechaHasta: new Date(filters.fechaHasta),
      });
    }

    const movements = await queryBuilder.getMany();
    return [movements, null];
  } catch (error) {
    console.error("Error al obtener movimientos de stock:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Obtener el historial de movimientos de un producto específico.
 */
export async function getMovementsByProductService(productId) {
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const product = await productRepository.findOne({ where: { id: productId } });

    if (!product) return [null, "Producto no encontrado"];

    const stockMovementRepository = AppDataSource.getRepository(StockMovement);
    const movements = await stockMovementRepository.find({
      where: { product: { id: productId } },
      relations: ["warehouse"],
      order: { creadoEn: "DESC" },
    });

    return [{ product, movements }, null];
  } catch (error) {
    console.error("Error al obtener movimientos del producto:", error);
    return [null, "Error interno del servidor"];
  }
}

/**
 * Crear un movimiento de stock manual (ajuste o entrada de mercadería) — admin/bodeguero.
 */
export async function createManualMovementService(body, userRole) {
  try {
    if (userRole !== "administrador" && userRole !== "bodeguero") {
      return [null, "No tienes permisos para registrar movimientos de stock"];
    }

    const { productId, warehouseId, tipo, cantidad, motivo } = body;

    if (!productId || !tipo || !cantidad) {
      return [null, "productId, tipo y cantidad son requeridos"];
    }

    const tiposValidos = ["entrada", "salida", "ajuste", "devolucion"];
    if (!tiposValidos.includes(tipo)) {
      return [null, `Tipo inválido. Valores posibles: ${tiposValidos.join(", ")}`];
    }

    const productRepository = AppDataSource.getRepository(Product);
    const product = await productRepository.findOne({ where: { id: productId } });
    if (!product) return [null, "Producto no encontrado"];

    let warehouse = null;
    if (warehouseId) {
      const warehouseRepository = AppDataSource.getRepository(Warehouse);
      warehouse = await warehouseRepository.findOne({ where: { id: warehouseId } });
      if (!warehouse) return [null, "Almacén no encontrado"];
    }

    const cantidadAnterior = product.stock;
    let cantidadNueva = cantidadAnterior;

    if (tipo === "entrada" || tipo === "devolucion") {
      cantidadNueva = cantidadAnterior + cantidad;
    } else if (tipo === "salida") {
      if (product.stock < cantidad) {
        return [null, `Stock insuficiente. Disponible: ${product.stock}`];
      }
      cantidadNueva = cantidadAnterior - cantidad;
    } else if (tipo === "ajuste") {
      // En ajuste, la cantidad es el nuevo valor absoluto
      cantidadNueva = cantidad;
    }

    // Actualizar stock del producto
    product.stock = cantidadNueva;
    await productRepository.save(product);

    // Registrar movimiento
    const stockMovementRepository = AppDataSource.getRepository(StockMovement);
    const movement = await stockMovementRepository.save(
      stockMovementRepository.create({
        product,
        warehouse: warehouse || null,
        tipo,
        cantidad,
        cantidadAnterior,
        cantidadNueva,
        motivo: motivo || "Movimiento manual",
        referencia: null,
      })
    );

    return [movement, null];
  } catch (error) {
    console.error("Error al crear movimiento de stock:", error);
    return [null, "Error interno del servidor"];
  }
}
