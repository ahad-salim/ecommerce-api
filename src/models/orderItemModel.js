import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger, message: "quantity must be a whole number"
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger, message: "quantity must be a whole number"
    }
  },
});

export default mongoose.model("OrderItem", orderItemSchema);
