import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Payment from "../models/paymentModel.js";
import Cart from "../models/cartModel.js";
import CartItem from "../models/cartItemModel.js";
import AppError from "../utils/AppError.js";
import { moveOutOfPending } from "./order.service.js";
import {
  MIN_AMOUNT,
  createPaymentLink,
  expirePay,
  getTransactionStatus,
  isValidTransId,
} from "../utils/fapshi.js";

const isObjectId = (value) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const toSession = (payment) => ({
  paymentId: payment._id,
  paymentUrl: payment.paymentUrl,
  amount: payment.amount,
  currency: payment.currency,
  status: payment.status,
});

const createCheckout = async (orderId, userId) => {
  if (!isObjectId(orderId)) {
    throw new AppError("Invalid order ID", 400, "INVALID_ID");
  }

  const order = await Order.findOne({ _id: orderId, user: userId });

  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  if (order.status !== "pending") {
    throw new AppError(
      "Only pending orders can be paid",
      409,
      "ORDER_NOT_PAYABLE",
    );
  }

  if (order.expiresAt <= new Date()) {
    throw new AppError("This order has expired", 409, "ORDER_EXPIRED");
  }

  if (order.totalAmount < MIN_AMOUNT) {
    throw new AppError(
      `Orders below ${MIN_AMOUNT} XAF cannot be paid online`,
      400,
      "AMOUNT_TOO_LOW",
    );
  }

  // Same order, second click: hand back the live session instead of a new one
  const existing = await Payment.findOne({
    order: order._id,
    status: "pending",
  });

  if (existing) {
    if (existing.paymentUrl)
      return { data: toSession(existing), created: false };

    throw new AppError(
      "A payment for this order is being created. Try again in a moment",
      409,
      "PAYMENT_IN_PROGRESS",
    );
  }

  // The partial unique index (one pending payment per order) is the real lock:
  // two simultaneous requests can both pass the check above, only one insert wins.
  let payment;

  try {
    payment = await Payment.create({
      order: order._id,
      user: userId,
      provider: "fapshi",
      amount: order.totalAmount, 
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(
        "A payment for this order is being created. Try again in a moment",
        409,
        "PAYMENT_IN_PROGRESS",
      );
    }
    throw err;
  }

  let transId;

  try {
    const created = await createPaymentLink({
      amount: payment.amount,
      message: `Order of ${order._id}`,
      externalId: payment._id,
      userId,
      redirectUrl: process.env.PAYMENT_REDIRECT_URL,
    });

    transId = created.transId;

    
    payment.paymentUrl = created.link;
    payment.providerRef = created.transId;
    await payment.save();
  } catch (err) {
    // If the link was created but we could not save it, kill the link so nobody can pay for something we have no record of.
    if (transId) {
      await expirePay(transId).catch((expireErr) =>
        console.error("EXPIRE_PAY_FAILED", {
          payment: String(payment._id),
          message: expireErr.message,
        }),
      );
    }

    // Free the "one pending payment per order" slot so the customer can retry
    await Payment.updateOne(
      { _id: payment._id, status: "pending" },
      {
        status: "failed",
        failedAt: new Date(),
        failureReason: "PROVIDER_ERROR",
      },
    );

    throw err;
  }

  return { data: toSession(payment), created: true };
};


async function claimPayment(paymentId, status, fields) {
  return Payment.findOneAndUpdate(
    { _id: paymentId, status: "pending" },
    { status, ...fields },
    { returnDocument: "after" },
  );
}

async function finalizePaidOrder(payment) {
  const moved = await Order.findOneAndUpdate(
    { _id: payment.order, status: "pending" },
    { status: "paid" },
    { returnDocument: "after" },
  );

  if (!moved) {
    const current = await Order.findById(payment.order).select("status").lean();

    if (!current || ["cancelled", "failed"].includes(current.status)) {
      console.error("PAYMENT_ORPHANED", {
        payment: String(payment._id),
        order: String(payment.order),
        orderStatus: current?.status ?? "missing",
      });
      return;
    }
  }

  const cart = await Cart.findOne({ user: payment.user }).select("_id").lean();
  if (cart) await CartItem.deleteMany({ cart: cart._id });
}

async function settlePayment(payment) {
  const tx = await getTransactionStatus(payment.providerRef);
  const txStatus = String(tx?.status ?? "").toUpperCase();

  const mismatch =
    Number(tx?.amount) !== payment.amount ||
    (tx?.transId && tx.transId !== payment.providerRef) ||
    (tx?.externalId && String(tx.externalId) !== String(payment._id));

  if (mismatch) {
    console.error("PAYMENT_MISMATCH", {
      payment: String(payment._id),
      transId: payment.providerRef,
    });
    throw new AppError("Payment details do not match", 400, "PAYMENT_MISMATCH");
  }

  if (txStatus === "SUCCESSFUL") {
    const claimed = await claimPayment(payment._id, "successful", {
      paidAt: new Date(),
    });

    const current = claimed ?? (await Payment.findById(payment._id));

    if (current?.status === "successful") {
      await finalizePaidOrder(current);
    } else {
      console.error("PAYMENT_ORPHANED", {
        payment: String(payment._id),
        order: String(payment.order),
        localStatus: current?.status ?? "missing",
      });
    }

    return { processed: Boolean(claimed) };
  }

  if (txStatus === "FAILED") {
    const claimed = await claimPayment(payment._id, "failed", {
      failedAt: new Date(),
      failureReason: "PAYMENT_DECLINED", 
    });

    const current = claimed ?? (await Payment.findById(payment._id));

    if (current?.status === "failed") {
      await moveOutOfPending({ _id: payment.order }, "failed");
    }

    return { processed: Boolean(claimed) };
  }

  if (txStatus === "EXPIRED") {
    const claimed = await claimPayment(payment._id, "expired", {
      failedAt: new Date(),
      failureReason: "PAYMENT_EXPIRED",
    });

    const current = claimed ?? (await Payment.findById(payment._id));

    if (current?.status === "expired") {
      await moveOutOfPending({ _id: payment.order }, "cancelled");
    }

    return { processed: Boolean(claimed) };
  }

  return { processed: false };
}

const processWebhook = async (body) => {
  const transId = body?.transId;

  if (!isValidTransId(transId)) {
    throw new AppError("Malformed webhook", 400, "INVALID_WEBHOOK");
  }

  const payment = await Payment.findOne({ providerRef: transId });

  if (!payment) return { processed: false };

  return settlePayment(payment);
};

const getPaymentStatus = async (orderId, requester) => {
  if (!isObjectId(orderId)) {
    throw new AppError("Invalid order ID", 400, "INVALID_ID");
  }

  const filter = { order: orderId };
  if (requester.role !== "admin") filter.user = requester.id;

  let payment = await Payment.findOne(filter).sort({ createdAt: -1 });

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  if (payment.status === "pending" && payment.providerRef) {
    try {
      await settlePayment(payment);
      payment = await Payment.findById(payment._id);
    } catch (err) {
      console.error("PAYMENT_SYNC_FAILED", {
        payment: String(payment._id),
        message: err.message,
      });
    }
  }

  return { data: payment.toObject({ versionKey: false }) };
};

export { createCheckout, processWebhook, getPaymentStatus };
