"use strict";
import { EntitySchema } from "typeorm";

/**
 * Entidad para almacenar el historial de cambios de estado de una orden.
 * Cada vez que una orden cambia de estado, se registra una entrada aquí
 * con el estado anterior, el nuevo estado y la fecha exacta del cambio.
 */
const OrderHistorySchema = new EntitySchema({
  name: "OrderHistory",
  tableName: "order_history",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    estadoAnterior: {
      type: "varchar",
      length: 50,
      nullable: true, // null cuando es el estado inicial (creación)
    },
    estadoNuevo: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    nota: {
      type: "text",
      nullable: true, // descripción opcional del cambio
    },
    creadoEn: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },
  relations: {
    order: {
      type: "many-to-one",
      target: "Order",
      joinColumn: true,
      onDelete: "CASCADE",
      nullable: false,
    },
  },
});

export default OrderHistorySchema;
