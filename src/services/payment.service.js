import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Payment from "../models/paymentModel.js";
import Cart from "../models/cartModel.js";
import CartItem from "../models/cartItemModel.js";
import AppError from "../utils/AppError.js";
import { moveOutOfPending } from "./order.service.js";
import {
  createPaymentLink,
  getTransactionStatus,
  verifyWebhookSignature,
} from "../utils/campay.js";

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

  // Business rule 5: only pending orders can be paid
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
      amount: order.totalAmount, // from OUR database, never from the client
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

  try {
    const { link } = await createPaymentLink({
      amount: payment.amount,
      description: `Order ${order._id}`,
      externalReference: payment._id, // comes back in the webhook
      redirectUrl: process.env.PAYMENT_REDIRECT_URL,
    });

    payment.paymentUrl = link;
    await payment.save();
  } catch (err) {
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

/* ------------------------------------------------------------------ *
 *  POST /payments/webhook
 * ------------------------------------------------------------------ */

// pending -> newStatus, atomically. Returns the updated payment, or null if it
// was no longer pending (already processed). The unique index on providerRef
// also stops one real Campay transaction from being used to "pay" two payments.
async function claimPayment(paymentId, status, fields) {
  try {
    return await Payment.findOneAndUpdate(
      { _id: paymentId, status: "pending" },
      { status, ...fields },
      { returnDocument: "after" },
    );
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(
        "This transaction reference was already used",
        409,
        "REFERENCE_ALREADY_USED",
      );
    }
    throw err;
  }
}

// Order pending -> paid, then clear the cart. Every step is conditional or
// idempotent, so it is safe to run again on a duplicate webhook. That also
// repairs the case where the server died between "payment saved" and "order saved".
async function finalizePaidOrder(payment) {
  const moved = await Order.findOneAndUpdate(
    { _id: payment.order, status: "pending" },
    { status: "paid" },
    { returnDocument: "after" },
  );

  if (!moved) {
    const current = await Order.findById(payment.order).select("status").lean();

    // Money was taken but the order was cancelled/expired/failed in the meantime.
    // Never silently swallow this: it needs a manual refund.
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

const processWebhook = async (params) => {
  const {
    signature,
    reference,
    external_reference: externalReference,
  } = params;

  // 1. Who sent this? (proves the sender, NOT that the other fields are untampered)
  if (!verifyWebhookSignature(signature)) {
    throw new AppError("Invalid webhook signature", 401, "INVALID_SIGNATURE");
  }

  if (typeof reference !== "string" || !isObjectId(externalReference)) {
    throw new AppError("Malformed webhook", 400, "INVALID_WEBHOOK");
  }

  const payment = await Payment.findById(externalReference);

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  // 2. What really happened? Ask Campay directly instead of believing the query string.
  const tx = await getTransactionStatus(reference);
  const txStatus = String(tx?.status ?? "").toUpperCase();

  const mismatch =
    Number(tx?.amount) !== payment.amount ||
    (tx?.currency && tx.currency !== payment.currency) ||
    (tx?.external_reference &&
      String(tx.external_reference) !== String(payment._id)) ||
    (payment.providerRef && payment.providerRef !== reference);

  if (mismatch) {
    // IDs only: never log the signature or the full payload
    console.error("PAYMENT_MISMATCH", {
      payment: String(payment._id),
      reference,
    });
    throw new AppError("Payment details do not match", 400, "PAYMENT_MISMATCH");
  }

  // 3. Apply it. Every transition is claimed atomically => idempotent (rule 6).
  if (txStatus === "SUCCESSFUL") {
    const claimed = await claimPayment(payment._id, "succeeded", {
      providerRef: reference,
      paidAt: new Date(),
    });

    const current = claimed ?? (await Payment.findById(payment._id));

    if (current.status === "succeeded") await finalizePaidOrder(current);

    return { processed: Boolean(claimed) };
  }

  if (txStatus === "FAILED") {
    const claimed = await claimPayment(payment._id, "failed", {
      providerRef: reference,
      failedAt: new Date(),
      failureReason: "PAYMENT_DECLINED",
    });

    const current = claimed ?? (await Payment.findById(payment._id));

    // pending -> failed on the order AND give the reserved stock back.
    // Returns null (does nothing) if the order already left pending.
    if (current.status === "failed") {
      await moveOutOfPending({ _id: payment.order }, "failed");
    }

    return { processed: Boolean(claimed) };
  }

  // PENDING or anything unknown: nothing to do yet
  return { processed: false };
};

/* ------------------------------------------------------------------ *
 *  GET /payments/:orderId
 * ------------------------------------------------------------------ */

const getPaymentStatus = async (orderId, requester) => {
  if (!isObjectId(orderId)) {
    throw new AppError("Invalid order ID", 400, "INVALID_ID");
  }

  const filter = { order: orderId };
  if (requester.role !== "admin") filter.user = requester.id;

  // An order can have several attempts (failed ones stay); show the latest
  const payment = await Payment.findOne(filter)
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  return { data: payment };
};

export { createCheckout, processWebhook, getPaymentStatus };
