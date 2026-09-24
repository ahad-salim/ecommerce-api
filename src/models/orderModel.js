import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalAmount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "cancelled", "processing", "delivered", "refunded"],
      default: "pending",
    },
    shippingAddress: {
      street: String,
      city: String,
      country: String,
      postalCode: String,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Order", orderSchema);
