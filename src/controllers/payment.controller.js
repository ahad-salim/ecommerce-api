import {
  createCheckout,
  getPaymentStatus,
  processWebhook,
} from "../services/payment.service.js";

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
    // Campay's callback fields may arrive in the query string or the body:
    // read both until a demo payment shows which one it really uses.
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

export { checkoutController, webhookController, getPaymentStatusController };