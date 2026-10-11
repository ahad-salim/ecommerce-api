import mongoose, { Schema } from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    cart: {
      type: Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

//thesame product should appear only once in a cart
cartItemSchema.index({ cart: 1, product: 1 }, { unique: true });

export default mongoose.model("CartItem", cartItemSchema);
