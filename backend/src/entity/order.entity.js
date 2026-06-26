"use strict";
import { EntitySchema } from "typeorm";

const OrderSchema = new EntitySchema({
  name: "Order",
  tableName: "orders",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    numeroOrden: {
      type: "varchar",
      length: 50,
      unique: true,
      nullable: false,
    },
    estado: {
      type: "enum",
      enum: ["pendiente", "procesando", "listo_para_envio", "en_camino", "entregado", "cancelado", "incidencia_stock"],
      default: "pendiente",
    },
    subtotal: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: false,
    },
    descuentoTotal: {
      type: "decimal",
      precision: 12,
      scale: 2,
      default: 0,
    },
    total: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: false,
    },
    metodoPago: {
      type: "varchar",
      length: 50,
      nullable: false,
    },
    direccionEnvio: {
      type: "text",
      nullable: false,
    },
    telefonoContacto: {
      type: "varchar",
      length: 20,
      nullable: false,
    },
    notas: {
      type: "text",
      nullable: true,
    },
    costoEnvio: {
      type: "decimal",
      precision: 12,
      scale: 2,
      default: 0,
      nullable: false,
    },
    zonaEnvio: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    tipoEntrega: {
      type: "varchar",
      length: 20,
      default: "envio",
      nullable: false,
    },
    mercadoPagoId: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    mercadoPagoStatus: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    estadoPago: {
      type: "varchar",
      length: 30,
      default: "pendiente",
      nullable: false,
    },
    fechaEntrega: {
      type: "date",
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
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: true,
      onDelete: "CASCADE",
    },
    orderItems: {
      type: "one-to-many",
      target: "OrderItem",
      inverseSide: "order",
      cascade: true,
    },
  },
});

export default OrderSchema;
