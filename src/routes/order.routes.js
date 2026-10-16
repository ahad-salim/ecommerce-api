import express from "express";

import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";

import { validate, validateQuery } from "../middlewares/validateMiddleware.js";

import {
  createOrderSchema,
  orderQuerySchema,
} from "../validators/order.validator.js";

import {
  cancelOrderController,
  createOrderController,
  getMyOrdersController,
  getOrderController,
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

export default router;
