import express from "express";

import authenticate from "../middlewares/authMiddleware.js";

import {
  checkoutController,
  getPaymentStatusController,
  webhookController,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.route("/webhook").post(webhookController).get(webhookController);

router.post("/checkout/:orderId", authenticate, checkoutController);

router.get("/:orderId", authenticate, getPaymentStatusController);

export default router;