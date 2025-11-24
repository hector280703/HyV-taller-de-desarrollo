"use strict";
import { EntitySchema } from "typeorm";

const ReviewSchema = new EntitySchema({
  name: "Review",
  tableName: "reviews",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    userId: {
      type: "int",
      nullable: false,
    },
    productId: {
      type: "int",
      nullable: false,
    },
    calificacion: {
      type: "int",
      nullable: false,
    },
    comentario: {
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
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "userId",
      },
      nullable: false,
      onDelete: "CASCADE",
    },
    product: {
      type: "many-to-one",
      target: "Product",
      joinColumn: {
        name: "productId",
      },
      nullable: false,
      onDelete: "CASCADE",
    },
  },
  indices: [
    {
      name: "IDX_REVIEW",
      columns: ["id"],
      unique: true,
    },
    {
      name: "IDX_REVIEW_USER_PRODUCT",
      columns: ["userId", "productId"],
      unique: true,
    },
  ],
});

export default ReviewSchema;
