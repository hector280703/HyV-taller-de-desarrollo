"use strict";
import { EntitySchema } from "typeorm";

const OrderItemSchema = new EntitySchema({
  name: "OrderItem",
  tableName: "order_items",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    nombreProducto: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    cantidad: {
      type: "int",
      nullable: false,
    },
    precioUnitario: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: false,
    },
    descuento: {
      type: "decimal",
      precision: 5,
      scale: 2,
      default: 0,
    },
    subtotal: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: false,
    },
    createdAt: {
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
    },
    product: {
      type: "many-to-one",
      target: "Product",
      joinColumn: true,
      onDelete: "SET NULL",
      nullable: true,
    },
  },
});

export default OrderItemSchema;
