"use strict";
import { EntitySchema } from "typeorm";

/**
 * Entidad que representa las facturas generadas a partir de una orden.
 * Vincula cada venta con su documento tributario formal, incluyendo
 * el desglose de subtotal, IVA y total, y el estado de la factura.
 * Relación 1:1 con Order.
 */
const InvoiceSchema = new EntitySchema({
  name: "Invoice",
  tableName: "invoices",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    numeroFactura: {
      type: "varchar",
      length: 50,
      nullable: false,
      unique: true,
      comment: "Número de folio único de la factura",
    },
    fechaEmision: {
      type: "date",
      nullable: false,
    },
    subtotal: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: false,
    },
    iva: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: false,
      default: 0,
      comment: "Monto de IVA aplicado",
    },
    total: {
      type: "decimal",
      precision: 12,
      scale: 2,
      nullable: false,
    },
    estado: {
      type: "enum",
      enum: ["emitida", "pagada", "anulada"],
      default: "emitida",
      nullable: false,
    },
    notas: {
      type: "text",
      nullable: true,
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
    order: {
      type: "one-to-one",
      target: "Order",
      joinColumn: true,
      onDelete: "CASCADE",
      nullable: false,
    },
    customer: {
      type: "many-to-one",
      target: "Customer",
      joinColumn: true,
      onDelete: "SET NULL",
      nullable: true,
    },
  },
  indices: [
    {
      name: "IDX_INVOICE",
      columns: ["id"],
      unique: true,
    },
    {
      name: "IDX_INVOICE_NUMERO",
      columns: ["numeroFactura"],
      unique: true,
    },
  ],
});

export default InvoiceSchema;
