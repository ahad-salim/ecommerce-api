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

router.use(authenticate);

router.post("/", validate(createOrderSchema), createOrderController);

router.get("/", validateQuery(orderQuerySchema), getMyOrdersController);

router.get("/:id", getOrderController);

router.patch("/:id/cancel", cancelOrderController);

export default router;
