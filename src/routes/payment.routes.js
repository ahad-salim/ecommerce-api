import express from "express";

import authenticate from "../middlewares/authMiddleware.js";

import {
  checkoutController,
  getPaymentStatusController,
  refundController,
  webhookController,
} from "../controllers/payment.controller.js";
import authorize from "../middlewares/roleMiddleware.js";
import verifyWebhookToken from "../middlewares/webhook.middleware.js";
import { webhookLimiter } from "../middlewares/security.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Fapshi webhook
 *     description: >
 *       Protected by a secret token in the query string (the URL registered in the Fapshi dashboard). The body is only used to find the payment by transId; the real status is fetched from Fapshi. Safe to receive more than once. Has its own rate limit.
 *     tags: [Payments]
 *     parameters:
 *       - { in: query, name: token, required: true, schema: { type: string } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transId: { type: string, description: Fapshi transaction id }
 *               status: { type: string, description: Ignored, we ask Fapshi }
 *               externalId: { type: string, description: Our payment ID }
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Malformed webhook or payment details do not match
 *       401:
 *         description: Invalid webhook token
 *       429:
 *         description: Too many request
 */
router.post("/webhook", webhookLimiter, verifyWebhookToken, webhookController);

/**
 * @swagger
 * /payments/checkout/{orderId}:
 *   post:
 *     summary: Start a Fapshi payment for a pending order
 *     description: Returns a payment session with the Fapshi payment link. Calling it again for the same order returns the existing session instead of creating a new one. Minimum order amount is 100 XAF. 
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
 *         description: Invalid order ID or amount below the minimum
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       404: { $ref: "#/components/responses/NotFound" }
 *       409:
 *         description: Order is not pending, has expired, or a payment is being created
 */
router.post("/checkout/:orderId", authenticate, checkoutController);

/**
 * @swagger
 * /payments/{orderId}/refund:
 *   post:
 *     summary: Mark an order as refunded (admin only)
 *     description: Only updates our records. The money itself must be sent back from the fapshi dashboard.
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
