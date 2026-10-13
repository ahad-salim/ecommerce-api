import {
  cancelOrder,
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrder,
  updateOrderStatus,
} from "../services/order.service.js";

import { successResponse } from "../utils/responseFormatter.js";

const createOrderController = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;

    const result = await createOrder(req.user.id, { shippingAddress });

    return successResponse(res, "Order created successfully", result.data, 201);
  } catch (error) {
    next(error);
  }
};

const getMyOrdersController = async (req, res, next) => {
  try {
    const result = await getMyOrders(req.user.id, req.validateQuery);

    return successResponse(
      res,
      "Order history retreived successfully",
      result.data,
    );
  } catch (error) {
    next(error);
  }
};

const getOrderController = async (req, res, next) => {
  try {
    const result = await getOrder(req.params.id, req.user);

    return successResponse(res, "Orders retrieved successfully", result.data);
  } catch (error) {
    next(error);
  }
};

const cancelOrderController = async (req, res, next) => {
  try {
    const result = await cancelOrder(req.params.id, req.user.id);

    return successResponse(res, "Order cancelled", result.data);
  } catch (error) {
    next(error);
  }
};

const getAllOrdersController = async (req, res, next) => {
  try {
    const result = await getAllOrders(req.validateQuery);

    return successResponse(res, "Orders retreived successfully", result.data);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatusController = async (req, res, next) => {
  try {
    const result = await updateOrderStatus(req.params.id, req.body.status);

    return successResponse(res, "Order status updated", result.data);
  } catch (error) {
    next(error);
  }
};

export {
  createOrderController,
  getMyOrdersController,
  getOrderController,
  cancelOrderController,
  getAllOrdersController,
  updateOrderStatusController,
};
