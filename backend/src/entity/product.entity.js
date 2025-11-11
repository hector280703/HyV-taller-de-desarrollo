"use strict";
import { EntitySchema } from "typeorm";

const ProductSchema = new EntitySchema({
  name: "Product",
  tableName: "products",
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
    codigo: {
      type: "varchar",
      length: 50,
      nullable: false,
      unique: true,
    },
    descripcion: {
      type: "text",
      nullable: true,
    },
    precio: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },
    stock: {
      type: "int",
      nullable: false,
      default: 0,
    },
    categoria: {
      type: "varchar",
      length: 50,
      nullable: true,
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
  indices: [
    {
      name: "IDX_PRODUCT",
      columns: ["id"],
      unique: true,
    },
    {
      name: "IDX_PRODUCT_NOMBRE",
      columns: ["nombre"],
      unique: true,
    },
    {
      name: "IDX_PRODUCT_CODIGO",
      columns: ["codigo"],
      unique: true,
    },
  ],
});

export default ProductSchema;
