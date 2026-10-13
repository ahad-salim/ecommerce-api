import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import OrderItem from "../models/orderItemModel.js";
import Cart from "../models/cartModel.js";
import CartItem from "../models/cartItemModel.js";
import Product from "../models/productModel.js";
import AppError from "../utils/AppError.js";
import { canTransition } from "../utils/orderStatus.js";

const PENDING_TTL_MS = 30 * 60 * 1000; // brief: pending orders die after 30 minutes

async function reserveStock(lines) {
  const reserved = [];

  try {
    for (const line of lines) {
      const result = await Product.updateOne(
        { _id: line.product, isDeleted: false, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } },
      );

      if (result.modifiedCount !== 1) {
        throw new AppError(
          `Not enough stock for "${line.name}"`,
          409,
          "INSUFFICIENT_STOCK",
        );
      }

      reserved.push(line);
    }
  } catch (err) {
    await releaseStock(reserved);
    throw err;
  }
}

async function releaseStock(lines) {
  if (!lines.length) return;

  await Product.bulkWrite(
    lines.map((line) => ({
      updateOne: {
        filter: { _id: line.product },
        update: { $inc: { stock: line.quantity } },
      },
    })),
  );
}

// Load the items of many orders with ONE query, then group them by order.
async function attachItems(orders) {
  const items = await OrderItem.find({
    order: { $in: orders.map((o) => o._id) },
  }).lean();

  const byOrder = new Map();
  for (const item of items) {
    const key = String(item.order);
    if (!byOrder.has(key)) byOrder.set(key, []);
    byOrder.get(key).push(item);
  }

  return orders.map((o) => ({ ...o, items: byOrder.get(String(o._id)) || [] }));
}

// pending -> newStatus, and give the reserved stock back
// The status change is ONE atomic findOneAndUpdate with `status: "pending"` in
// the filter, so when a cancel, the expiry job and (later) a payment webhook
// all race for the same order, exactly one of them wins. Only the winner
// releases stock, so stock is never given back twice.
// Returns the updated order, or null if the order was no longer pending.
async function moveOutOfPending(filter, newStatus) {
  const order = await Order.findOneAndUpdate(
    { ...filter, status: "pending" },
    { status: newStatus },
    { returnDocument: "after" },
  );

  if (!order) return null;

  const items = await OrderItem.find({ order: order._id }).lean();
  await releaseStock(items);

  return order;
}

const createOrder = async (userId, { shippingAddress }) => {
  const cart = await Cart.findOne({ user: userId });
  const cartItems = cart
    ? await CartItem.find({ cart: cart._id }).populate("product")
    : [];

  if (cartItems.length === 0) {
    throw new AppError("Your cart is empty", 400, "CART_EMPTY");
  }

  const lines = cartItems.map((ci) => {
    const product = ci.product;

    if (!product || product.isDeleted) {
      throw new AppError(
        "An item in your cart is no longer available. Remove it and try again",
        409,
        "PRODUCT_UNAVAILABLE",
      );
    }

    return {
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: ci.quantity,
    };
  });

  const totalAmount = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  // 2. Create the order FIRST. The partial unique index on {user} (pending) turns
  //    this insert into a lock: a second simultaneous checkout fails right here,
  //    before any stock has been touched.
  let order;
  try {
    order = await Order.create({
      user: userId,
      totalAmount,
      shippingAddress,
      expiresAt: new Date(Date.now() + PENDING_TTL_MS),
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(
        "You already have a pending order. Pay for it or cancel it first",
        409,
        "PENDING_ORDER_EXISTS",
      );
    }
    throw err;
  }

  // 3. Reserve stock and save the item snapshots. If anything fails, put
  //    everything back so no phantom stock reservation or empty order is left.
  try {
    await reserveStock(lines); // cleans up after itself when it fails

    try {
      await OrderItem.insertMany(
        lines.map((l) => ({ ...l, order: order._id })),
      );
    } catch (err) {
      await releaseStock(lines);
      throw err;
    }
  } catch (err) {
    await Order.deleteOne({ _id: order._id });
    throw err;
  }

  // The cart is NOT cleared here: the brief clears it when payment succeeds.
  const [full] = await attachItems([order.toObject()]);
  return { data: full };
};

const getMyOrders = async (userId, { status, page, limit }) => {
  const filter = { user: userId };
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    data: {
      orders: await attachItems(orders),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  };
};

// Owner or admin. Putting `user` into the FILTER (instead of loading the order
// and comparing afterwards) means someone else's order simply "doesn't exist":
// 404, so the API doesn't even confirm that the id is real.
const getOrder = async (orderId, requester) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order ID", 400, "INVALID_ID");
  }

  const filter = { _id: orderId };
  if (requester.role !== "admin") filter.user = requester.id;

  const order = await Order.findOne(filter).lean();

  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  const [full] = await attachItems([order]);
  return { data: full };
};

const cancelOrder = async (orderId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order ID", 400, "INVALID_ID");
  }

  const order = await moveOutOfPending(
    { _id: orderId, user: userId },
    "cancelled",
  );

  if (!order) {
    // Either it isn't theirs / doesn't exist (404), or it exists but isn't pending (409)
    const exists = await Order.exists({ _id: orderId, user: userId });

    if (!exists) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

    throw new AppError(
      "Only pending orders can be cancelled",
      409,
      "ORDER_NOT_CANCELLABLE",
    );
  }

  const [full] = await attachItems([order.toObject()]);
  return { data: full };
};

/* Admin operations */

const getAllOrders = async ({ status, user, from, to, page, limit }) => {
  const filter = {};
  if (status) filter.status = status;
  if (user) filter.user = user;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  // attachItems only needs _id, which populate() leaves alone
  return {
    data: {
      orders: await attachItems(orders),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  };
};

const updateOrderStatus = async (orderId, newStatus) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError("Invalid order ID", 400, "INVALID_ID");
  }

  const current = await Order.findById(orderId);

  if (!current) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  // Any move not in the lifecycle diagram is rejected
  if (!canTransition(current.status, newStatus)) {
    throw new AppError(
      `Cannot move an order from "${current.status}" to "${newStatus}"`,
      409,
      "INVALID_STATUS_TRANSITION",
    );
  }

  // Compare-and-set: only update if the status is STILL what we just checked.
  // If another request changed it in between, we get null instead of
  // overwriting that change.
  const updated = await Order.findOneAndUpdate(
    { _id: orderId, status: current.status },
    { status: newStatus },
    { returnDocument: "after" },
  );

  if (!updated) {
    throw new AppError(
      "The order was changed by someone else. Reload and try again",
      409,
      "ORDER_CHANGED",
    );
  }

  const [full] = await attachItems([updated.toObject()]);
  return { data: full };
};

/* ------------------------------------------------------------------ *
 *  Used by the scheduled job
 * ------------------------------------------------------------------ */

const expirePendingOrders = async () => {
  const stale = await Order.find({
    status: "pending",
    expiresAt: { $lte: new Date() },
  })
    .select("_id")
    .limit(100)
    .lean();

  let cancelled = 0;

  for (const { _id } of stale) {
    // Same atomic claim as a manual cancel; safe even with several server copies
    if (await moveOutOfPending({ _id }, "cancelled")) cancelled++;
  }

  return cancelled;
};

export {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  expirePendingOrders,
  moveOutOfPending, // the payment webhook will reuse this for pending -> failed
};
