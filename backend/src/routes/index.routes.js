"use strict";
import { Router } from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";
import reviewRoutes from "./review.routes.js";
import orderRoutes from "./order.routes.js";
import uploadRoutes from "./upload.routes.js";
import paymentRoutes from "./payment.routes.js";
import customerRoutes from "./customer.routes.js";
import warehouseRoutes from "./warehouse.routes.js";
import invoiceRoutes from "./invoice.routes.js";
import stockMovementRoutes from "./stockMovement.routes.js";

const router = Router();

router
    .use("/auth", authRoutes)
    .use("/user", userRoutes)
    .use("/product", productRoutes)
    .use("/review", reviewRoutes)
    .use("/orders", orderRoutes)
    .use("/upload", uploadRoutes)
    .use("/payments", paymentRoutes)
    .use("/customer", customerRoutes)
    .use("/warehouse", warehouseRoutes)
    .use("/invoice", invoiceRoutes)
    .use("/stock-movements", stockMovementRoutes);

export default router;