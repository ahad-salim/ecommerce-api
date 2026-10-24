import express from "express";

import authenticate from "../middlewares/authMiddleware.js";

import {
  checkoutController,
  getPaymentStatusController,
  refundController,
  webhookController,
} from "../controllers/payment.controller.js";
import authorize from "../middlewares/roleMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Campay webhook (called by Campay, not by clients)
 *     description: Parameters can arrive in the body (POST) or the query string (GET). The signature is verified. Not rate limited so provider retries are never blocked.
 *     tags: [Payments]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signature: { type: string }
 *               reference: { type: string }
 *               external_reference: { type: string, description: Our payment ID }
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Malformed webhook
 *       401:
 *         description: Invalid webhook signature
 */
/**
 * @swagger
 * /payments/webhook:
 *   get:
 *     summary: Campay webhook (GET variant)
 *     tags: [Payments]
 *     parameters:
 *       - { in: query, name: signature, schema: { type: string } }
 *       - { in: query, name: reference, schema: { type: string } }
 *       - { in: query, name: external_reference, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Malformed webhook
 *       401:
 *         description: Invalid webhook signature
 */
router.route("/webhook").post(webhookController).get(webhookController);

/**
 * @swagger
 * /payments/checkout/{orderId}:
 *   post:
 *     summary: Start a Campay payment for a pending order
 *     description: Returns a payment session. Calling it again for the same order returns the existing session (200) instead of creating a new one (201).
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment session already exists
 *       201:
 *         description: Payment session created
 *       400:
 *         description: Order is not pending
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.post("/checkout/:orderId", authenticate, checkoutController);

/**
 * @swagger
 * /payments/{orderId}/refund:
 *   post:
 *     summary: Mark an order as refunded (admin only)
 *     description: Only updates our records. The money itself must be sent back from the Campay dashboard.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order marked as refunded
 *       400:
 *         description: Order cannot be refunded
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.post(
  "/:orderId/refund",
  authenticate,
  authorize("admin"),
  refundController,
);

/**
 * @swagger
 * /payments/{orderId}:
 *   get:
 *     summary: Get the payment status of an order
 *     description: Customers can only see payments for their own orders. Admins can see any.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.get("/:orderId", authenticate, getPaymentStatusController);

export default router;
