"use strict";
import { EntitySchema } from "typeorm";

/**
 * Entidad que representa los almacenes físicos del negocio.
 * Permite gestionar múltiples bodegas o puntos de almacenamiento,
 * cada uno con su ubicación y capacidad.
 */
const WarehouseSchema = new EntitySchema({
  name: "Warehouse",
  tableName: "warehouses",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    nombre: {
      type: "varchar",
      length: 100,
      nullable: false,
      unique: true,
    },
    ubicacion: {
      type: "text",
      nullable: true,
    },
    ciudad: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    region: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    capacidad: {
      type: "int",
      nullable: true,
      comment: "Capacidad máxima de unidades almacenables",
    },
    activo: {
      type: "boolean",
      default: true,
      nullable: false,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    updatedAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
  relations: {
    stockMovements: {
      type: "one-to-many",
      target: "StockMovement",
      inverseSide: "warehouse",
    },
  },
  indices: [
    {
      name: "IDX_WAREHOUSE",
      columns: ["id"],
      unique: true,
    },
    {
      name: "IDX_WAREHOUSE_NOMBRE",
      columns: ["nombre"],
      unique: true,
    },
  ],
});

export default WarehouseSchema;
