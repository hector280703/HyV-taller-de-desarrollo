"use strict";
import { EntitySchema } from "typeorm";

/**
 * Entidad que registra los movimientos de stock de cada producto.
 * Permite rastrear entradas, salidas, ajustes y devoluciones de inventario,
 * con trazabilidad completa de cantidades anteriores y nuevas, y el almacén involucrado.
 */
const StockMovementSchema = new EntitySchema({
  name: "StockMovement",
  tableName: "stock_movements",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    tipo: {
      type: "enum",
      enum: ["entrada", "salida", "ajuste", "devolucion"],
      nullable: false,
      comment: "Tipo de movimiento: entrada (compra), salida (venta), ajuste (corrección), devolucion",
    },
    cantidad: {
      type: "int",
      nullable: false,
      comment: "Cantidad de unidades del movimiento",
    },
    cantidadAnterior: {
      type: "int",
      nullable: false,
      comment: "Stock antes del movimiento",
    },
    cantidadNueva: {
      type: "int",
      nullable: false,
      comment: "Stock resultante después del movimiento",
    },
    motivo: {
      type: "varchar",
      length: 255,
      nullable: true,
      comment: "Descripción del motivo del movimiento",
    },
    referencia: {
      type: "varchar",
      length: 100,
      nullable: true,
      comment: "Número de orden o documento relacionado al movimiento",
    },
    creadoEn: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
  relations: {
    product: {
      type: "many-to-one",
      target: "Product",
      joinColumn: true,
      onDelete: "CASCADE",
      nullable: false,
    },
    warehouse: {
      type: "many-to-one",
      target: "Warehouse",
      joinColumn: true,
      onDelete: "SET NULL",
      nullable: true,
    },
  },
  indices: [
    {
      name: "IDX_STOCK_MOVEMENT",
      columns: ["id"],
      unique: true,
    },
  ],
});

export default StockMovementSchema;
