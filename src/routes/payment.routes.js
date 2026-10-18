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

router.route("/webhook").post(webhookController).get(webhookController);

router.post("/checkout/:orderId", authenticate, checkoutController);

router.post(
  "/:orderId/refund",
  authenticate,
  authorize("admin"),
  refundController,
);

router.get("/:orderId", authenticate, getPaymentStatusController);

export default router;
