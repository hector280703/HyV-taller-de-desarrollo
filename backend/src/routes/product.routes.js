"use strict";
import { Router } from "express";
import { isAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controller.js";

const router = Router();

router
  .use(authenticateJwt)
  .use(isAdmin);

router
  .post("/", createProduct)
  .get("/", getProducts)
  .get("/detail/", getProduct)
  .patch("/detail/", updateProduct)
  .delete("/detail/", deleteProduct);

export default router;
