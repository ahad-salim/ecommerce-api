import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: { type: String, default: "campay" },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Amount must be an integer",
      },
    },
    currency: {
      type: String,
      default: "XAF",
    },
    paymentUrl: {
      type: String,
    },
    providerRef: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },
    paidAt: Date,
    failedAt: Date,
    refundedAt: Date,
    failureReason: String,
  },
  {
    timestamps: true,
  },
);

paymentSchema.index(
  { order: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

export default mongoose.model("Payment", paymentSchema);
