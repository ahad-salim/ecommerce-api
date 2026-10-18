import Order from "../models/orderModel.js";
import OrderItem from "../models/orderItemModel.js";
import Payment from "../models/paymentModel.js";
import Product from "../models/productModel.js";
import AppError from "../utils/AppError.js";
import { canTransition } from "../utils/orderStatus.js";

const OBJECT_ID = /^[a-f\d]{24}$/i;


export const refundOrder = async (orderId) => {
  if (!OBJECT_ID.test(orderId)) {
    throw new AppError("Invalid order ID", 400, "INVALID_ID");
  }

  const order = await Order.findById(orderId);

  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  if (!canTransition(order.status, "refunded")) {
    throw new AppError(
      `An order that is "${order.status}" cannot be refunded`,
      409,
      "ORDER_NOT_REFUNDABLE",
    );
  }

  const payment = await Payment.findOneAndUpdate(
    { order: order._id, status: "succeeded" },
    { status: "refunded", refundedAt: new Date() },
    { returnDocument: "after" },
  );

  if (!payment) {
    throw new AppError(
      "There is no successful payment to refund for this order",
      409,
      "NO_REFUNDABLE_PAYMENT",
    );
  }

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: "paid" },
    { status: "refunded" },
    { returnDocument: "after" },
  );

  if (!updated) {
    await Payment.updateOne(
      { _id: payment._id, status: "refunded" },
      { status: "succeeded", $unset: { refundedAt: 1 } },
    );

    throw new AppError(
      "The order changed while refunding. Reload and try again",
      409,
      "ORDER_CHANGED",
    );
  }

  const items = await OrderItem.find({ order: order._id }).lean();

  if (items.length) {
    await Product.bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: item.quantity } },
        },
      })),
    );
  }

  return {
    data: {
      orderId: updated._id,
      orderStatus: updated.status,
      paymentId: payment._id,
      paymentStatus: payment.status,
      amount: payment.amount,
      currency: payment.currency,
    },
  };
};
