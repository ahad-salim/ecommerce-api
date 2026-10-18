import {
  createCheckout,
  getPaymentStatus,
  processWebhook,
} from "../services/payment.service.js";
import { refundOrder } from "../services/refund.service.js";

import { successResponse } from "../utils/responseFormatter.js";

const checkoutController = async (req, res, next) => {
  try {
    const result = await createCheckout(req.params.orderId, req.user.id);

    return successResponse(
      res,
      result.created ? "Payment session created" : "Payment session already exists",
      result.data,
      result.created ? 201 : 200,
    );
  } catch (error) {
    next(error);
  }
};

const webhookController = async (req, res, next) => {
  try {
    const params = { ...req.body, ...req.query };

    const result = await processWebhook(params);

    return successResponse(res, "Webhook received", result);
  } catch (error) {
    next(error);
  }
};

const getPaymentStatusController = async (req, res, next) => {
  try {
    const result = await getPaymentStatus(req.params.orderId, req.user);

    return successResponse(res, "Payment retrieved successfully", result.data);
  } catch (error) {
    next(error);
  }
};

const refundController = async (req, res, next) => {
  try {
    const result = await refundOrder(req.params.orderId);

    return successResponse(
      res,
      "Order marked as refunded. Send the money back from your Campay dashboard",
      result.data,
    );
  } catch (error) {
    next(error);
  }
};

export { checkoutController, webhookController, getPaymentStatusController, refundController };