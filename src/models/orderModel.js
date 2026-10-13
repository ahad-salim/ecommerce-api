import mongoose from "mongoose";
import { ORDER_STATUSES } from "../utils/orderStatus.js";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "totalAmount must be a whole number",
      },
    },
    status: {
      type: String,
      // enum: [
      //   "pending",
      //   "paid",
      //   "processing",
      //   "shipped",
      //   "delivered",
      //   "cancelled",
      //   "failed",
      //   "refunded",
      // ],
      enum: ORDER_STATUSES,
      default: "pending",
    },
    shippingAddress: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        default: "",
      },
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

//Ranking newest first
orderSchema.index({ user: 1, createdAt: -1 });

orderSchema.index({ status: 1, expiresAt: 1 });

orderSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

export default mongoose.model("Order", orderSchema);
