"use strict";
import { EntitySchema } from "typeorm";

/**
 * Entidad que almacena la información detallada de los clientes.
 * Extiende la información del usuario (users) con datos específicos
 * del cliente como dirección, teléfono y ubicación geográfica.
 * Relación 1:1 con User.
 */
const CustomerSchema = new EntitySchema({
  name: "Customer",
  tableName: "customers",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    telefono: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    direccion: {
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
    codigoPostal: {
      type: "varchar",
      length: 10,
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
    user: {
      type: "one-to-one",
      target: "User",
      joinColumn: true,
      onDelete: "CASCADE",
      nullable: false,
    },
    invoices: {
      type: "one-to-many",
      target: "Invoice",
      inverseSide: "customer",
    },
  },
});

export default CustomerSchema;
