import express from "express";
import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";
import { validate, validateQuery } from "../middlewares/validateMiddleware.js";
import {
  adminOrderQuerySchema,
  updateOrderStatusSchema,
} from "../validators/order.validator.js";
import {
  getAllOrdersController,
  updateOrderStatusController,
} from "../controllers/order.controller.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: List all orders (admin only)
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { $ref: "#/components/schemas/OrderStatus" }
 *       - in: query
 *         name: user
 *         schema: { type: string }
 *         description: Filter by user ID
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - { $ref: "#/components/parameters/Page" }
 *       - { $ref: "#/components/parameters/Limit" }
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 */
router.get("/", validateQuery(adminOrderQuerySchema), getAllOrdersController);

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   patch:
 *     summary: Move an order through fulfilment (admin only)
 *     description: "Allowed transitions: paid -> processing -> shipped -> delivered. paid and failed come from the payment webhook, cancelled from the cancel endpoint and refunded from the refund endpoint."
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { $ref: "#/components/parameters/IdPath" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [processing, shipped, delivered] }
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Validation failed or invalid status transition
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.patch("/:id/status", validate(updateOrderStatusSchema), updateOrderStatusController);

export default router;
