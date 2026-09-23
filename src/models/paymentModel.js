import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  provider: String,
  providerRef: String,
  status: {
    type: String,
    enum: ["initiated", "succeeded", "failed"],
    default: "initiated",
  },
  amount: Number,
});

export default mongoose.model("Payment", paymentSchema);
