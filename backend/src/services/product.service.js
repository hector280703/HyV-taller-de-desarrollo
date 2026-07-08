"use strict";
import Product from "../entity/product.entity.js";
import { AppDataSource } from "../config/configDb.js";
import { LOW_STOCK_THRESHOLD } from "../config/configEnv.js";
import StockMovement from "../entity/stockMovement.entity.js";
import Warehouse from "../entity/warehouse.entity.js";

const CATEGORY_ZONE_MAP = {
  "Cemento y Morteros": "Zona Exterior (Patio)",
  "Ladrillos y Bloques": "Zona Exterior (Patio)",
  "Arena y Ripio": "Zona Exterior (Patio)",
  "Fierro y Acero": "Zona A (Estructuras)",
  "Madera": "Zona A (Estructuras)",
  "Pintura": "Zona B (Terminaciones)",
  "Cerámica y Porcelanato": "Zona B (Terminaciones)",
  "Fontanería": "Zona C (Instalaciones)",
  "Electricidad": "Zona C (Instalaciones)",
  "Herramientas": "Zona D (Herramientas)",
  "Otros": "Zona General"
};

function getZonaForCategoria(categoria) {
  if (!categoria) return "Zona General";
  return CATEGORY_ZONE_MAP[categoria] || "Zona General";
}

export async function createProductService(body) {
  try {
    const productRepository = AppDataSource.getRepository(Product);

    // Verificar si ya existe un producto con el mismo nombre
    const existingProductByName = await productRepository.findOne({
      where: { nombre: body.nombre },
    });

    if (existingProductByName) {
      return [null, "Ya existe un producto con ese nombre"];
    }

    // Generar código automático si no se proporciona o si está vacío
    let codigo = body.codigo && body.codigo.trim() !== "" ? body.codigo.trim() : null;
    if (!codigo) {
      // Generar código basado en el nombre y timestamp
      const nombreSinEspacios = body.nombre.replace(/\s+/g, '').substring(0, 5).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      codigo = `${nombreSinEspacios}-${timestamp}`;
      
      // Verificar que el código generado sea único
      let codigoUnico = false;
      let intento = 0;
      while (!codigoUnico && intento < 10) {
        const existingProduct = await productRepository.findOne({
          where: { codigo },
        });
        if (!existingProduct) {
          codigoUnico = true;
        } else {
          // Generar nuevo código con un número adicional
          intento++;
          codigo = `${nombreSinEspacios}-${timestamp}${intento}`;
        }
      }
    } else {
      // Verificar si ya existe un producto con el código proporcionado
      const existingProductByCode = await productRepository.findOne({
        where: { codigo: body.codigo },
      });

      if (existingProductByCode) {
        return [null, "Ya existe un producto con ese código"];
      }
    }

    let zonaUbicacion = body.zonaUbicacion;
    if (!zonaUbicacion || zonaUbicacion.trim() === "") {
      zonaUbicacion = getZonaForCategoria(body.categoria);
    }

    const newProduct = productRepository.create({
      nombre: body.nombre,
      codigo: codigo,
      descripcion: body.descripcion || "",
      precio: body.precio,
      stock: body.stock || 0,
      categoria: body.categoria || "",
      unidadMedida: body.unidadMedida || "unidad",
      marca: body.marca || null,
      imagenUrl: body.imagenUrl || null,
      descuento: body.descuento || 0,
      peso: body.peso || null,
      dimensiones: body.dimensiones || null,
      zonaUbicacion: zonaUbicacion,
      activo: body.activo !== undefined ? body.activo : true,
    });

    const productSaved = await productRepository.save(newProduct);

    // Registrar movimiento de stock inicial si es mayor a 0
    if (productSaved.stock > 0) {
      const warehouseRepository = AppDataSource.getRepository(Warehouse);
      const defaultWarehouse = await warehouseRepository.findOne({ where: { activo: true } });

      const stockMovementRepository = AppDataSource.getRepository(StockMovement);
      await stockMovementRepository.save(
        stockMovementRepository.create({
          product: productSaved,
          warehouse: defaultWarehouse || null,
          tipo: "entrada",
          cantidad: productSaved.stock,
          cantidadAnterior: 0,
          cantidadNueva: productSaved.stock,
          motivo: "Inventario inicial al crear el producto",
          referencia: null,
        })
      );
    }

    return [productSaved, null];
  } catch (error) {
    console.error("Error al crear el producto:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getProductService(query) {
  try {
    const { id, codigo, nombre } = query;

    const productRepository = AppDataSource.getRepository(Product);

    const productFound = await productRepository.findOne({
      where: [{ id: id }, { codigo: codigo }, { nombre: nombre }],
    });

    if (!productFound) return [null, "Producto no encontrado"];

    return [productFound, null];
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getProductsService(filters = {}) {
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const { search, categoria, page = 1, limit = 12 } = filters;

    const queryBuilder = productRepository.createQueryBuilder("product");

    // Búsqueda por nombre o código (ILIKE para case-insensitive)
    if (search && search.trim() !== "") {
      queryBuilder.andWhere(
        "(product.nombre ILIKE :search OR product.codigo ILIKE :search)",
        { search: `%${search.trim()}%` }
      );
    }

    // Filtro por categoría
    if (categoria && categoria.trim() !== "") {
      queryBuilder.andWhere("product.categoria = :categoria", { categoria: categoria.trim() });
    }

    // Ordenar por fecha de creación descendente
    queryBuilder.orderBy("product.createdAt", "DESC");

    // Contar total antes de paginar
    const total = await queryBuilder.getCount();

    // Aplicar paginación
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const totalPages = Math.ceil(total / limitNum);

    queryBuilder.skip((pageNum - 1) * limitNum).take(limitNum);

    const products = await queryBuilder.getMany();

    return [{
      products,
      total,
      page: pageNum,
      totalPages,
      limit: limitNum,
    }, null];
  } catch (error) {
    console.error("Error al obtener los productos:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function updateProductService(query, body) {
  try {
    const { id, codigo, nombre } = query;

    const productRepository = AppDataSource.getRepository(Product);

    const productFound = await productRepository.findOne({
      where: [{ id: id }, { codigo: codigo }, { nombre: nombre }],
    });

    if (!productFound) return [null, "Producto no encontrado"];

    // Verificar si el nuevo nombre ya existe en otro producto
    if (body.nombre && body.nombre !== productFound.nombre) {
      const existingProductByName = await productRepository.findOne({
        where: { nombre: body.nombre },
      });

      if (existingProductByName && existingProductByName.id !== productFound.id) {
        return [null, "Ya existe un producto con ese nombre"];
      }
    }

    // Verificar si el nuevo código ya existe en otro producto
    if (body.codigo && body.codigo !== productFound.codigo) {
      const existingProductByCode = await productRepository.findOne({
        where: { codigo: body.codigo },
      });

      if (existingProductByCode && existingProductByCode.id !== productFound.id) {
        return [null, "Ya existe un producto con ese código"];
      }
    }

    let zonaUbicacion = body.zonaUbicacion !== undefined ? body.zonaUbicacion : productFound.zonaUbicacion;
    const categoriaNueva = body.categoria !== undefined ? body.categoria : productFound.categoria;
    
    // Si envían la zona vacía intencionalmente (ej. borraron el input en el formulario), recalculamos
    if (body.zonaUbicacion !== undefined && body.zonaUbicacion.trim() === "") {
      zonaUbicacion = getZonaForCategoria(categoriaNueva);
    }

    const dataProductUpdate = {
      nombre: body.nombre || productFound.nombre,
      codigo: body.codigo || productFound.codigo,
      descripcion: body.descripcion !== undefined ? body.descripcion : productFound.descripcion,
      precio: body.precio !== undefined ? body.precio : productFound.precio,
      stock: body.stock !== undefined ? body.stock : productFound.stock,
      categoria: categoriaNueva,
      unidadMedida: body.unidadMedida !== undefined ? body.unidadMedida : productFound.unidadMedida,
      marca: body.marca !== undefined ? body.marca : productFound.marca,
      imagenUrl: body.imagenUrl !== undefined ? body.imagenUrl : productFound.imagenUrl,
      descuento: body.descuento !== undefined ? body.descuento : productFound.descuento,
      peso: body.peso !== undefined ? body.peso : productFound.peso,
      dimensiones: body.dimensiones !== undefined ? body.dimensiones : productFound.dimensiones,
      zonaUbicacion: zonaUbicacion,
      activo: body.activo !== undefined ? body.activo : productFound.activo,
      updatedAt: new Date(),
    };

    await productRepository.update({ id: productFound.id }, dataProductUpdate);

    const productUpdated = await productRepository.findOne({
      where: { id: productFound.id },
    });

    if (!productUpdated) {
      return [null, "Producto no encontrado después de actualizar"];
    }

    // Registrar movimiento de stock si el stock fue modificado manualmente
    if (dataProductUpdate.stock !== undefined && dataProductUpdate.stock !== productFound.stock) {
      const warehouseRepository = AppDataSource.getRepository(Warehouse);
      const defaultWarehouse = await warehouseRepository.findOne({ where: { activo: true } });

      const stockMovementRepository = AppDataSource.getRepository(StockMovement);
      const tipo = dataProductUpdate.stock > productFound.stock ? "entrada" : "salida";
      const cantidadDif = Math.abs(dataProductUpdate.stock - productFound.stock);
      
      await stockMovementRepository.save(
        stockMovementRepository.create({
          product: productUpdated,
          warehouse: defaultWarehouse || null,
          tipo: tipo,
          cantidad: cantidadDif,
          cantidadAnterior: productFound.stock,
          cantidadNueva: dataProductUpdate.stock,
          motivo: "Ajuste manual al editar producto",
          referencia: null,
        })
      );
    }

    return [productUpdated, null];
  } catch (error) {
    console.error("Error al modificar el producto:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getLowStockProductsService() {
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const threshold = LOW_STOCK_THRESHOLD || 5;

    const products = await productRepository
      .createQueryBuilder("product")
      .where("product.stock <= :threshold", { threshold })
      .andWhere("product.activo = :activo", { activo: true })
      .orderBy("product.stock", "ASC")
      .getMany();

    const result = products.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      categoria: p.categoria,
      stock: p.stock,
      umbral: threshold,
      sinStock: p.stock === 0,
    }));

    return [result, null];
  } catch (error) {
    console.error("Error al obtener productos con stock bajo:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function deleteProductService(query) {
  try {
    const { id, codigo, nombre } = query;

    const productRepository = AppDataSource.getRepository(Product);

    const productFound = await productRepository.findOne({
      where: [{ id: id }, { codigo: codigo }, { nombre: nombre }],
    });

    if (!productFound) return [null, "Producto no encontrado"];

    const productDeleted = await productRepository.remove(productFound);

    return [productDeleted, null];
  } catch (error) {
    console.error("Error al eliminar el producto:", error);
    return [null, "Error interno del servidor"];
  }
}
