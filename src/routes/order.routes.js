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

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create an order from the current cart
 *     description: Items, prices and totals come from the cart and database, never from the request. Stock is reserved when the order is created.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shippingAddress]
 *             properties:
 *               shippingAddress: { $ref: "#/components/schemas/ShippingAddress" }
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation failed, empty cart or insufficient stock
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
router.post("/", validate(createOrderSchema), createOrderController);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: List my orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { $ref: "#/components/schemas/OrderStatus" }
 *       - { $ref: "#/components/parameters/Page" }
 *       - { $ref: "#/components/parameters/Limit" }
 *     responses:
 *       200:
 *         description: Order history retrieved successfully
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
router.get("/", validateQuery(orderQuerySchema), getMyOrdersController);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get one order
 *     description: Customers can only see their own orders. Admins can see any order.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { $ref: "#/components/parameters/IdPath" }
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.get("/:id", getOrderController);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancel my order
 *     description: Only allowed while the order is still pending. Reserved stock is released.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { $ref: "#/components/parameters/IdPath" }
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: The order can no longer be cancelled
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.patch("/:id/cancel", cancelOrderController);

export default router;
