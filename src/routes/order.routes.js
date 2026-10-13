import express from "express";

import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";

import { validate, validateQuery } from "../middlewares/validateMiddleware.js";

import {
  adminOrderQuerySchema,
  createOrderSchema,
  orderQuerySchema,
  updateOrderStatusSchema,
} from "../validators/order.validator.js";

import {
  cancelOrderController,
  createOrderController,
  getAllOrdersController,
  getMyOrdersController,
  getOrderController,
  updateOrderStatusController,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  validate(createOrderSchema),
  createOrderController,
);

router.get(
  "/",
  authenticate,
  validateQuery(orderQuerySchema),
  getMyOrdersController,
);

router.get(
  "/:id",
  authenticate,
  authorize("customer", "admin"),
  getOrderController,
);

router.patch(
  "/:id/cancel",
  authenticate,
  cancelOrderController,
);

router.get(
  "/",
  authenticate,
  authorize("admin"),
  validateQuery(adminOrderQuerySchema),
  getAllOrdersController,
);

router.get(
  "/:id/status",
  authenticate,
  authorize("admin"),
  validate(updateOrderStatusSchema),
  updateOrderStatusController,
);

export default router;
