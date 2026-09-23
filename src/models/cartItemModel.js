import mongoose, { Schema } from "mongoose";

const cartItemSchema = new mongoose.Schema({
  cart: {
    type: Schema.Types.ObjectId,
    ref: "Cart",
  }, 
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },
  quantity: Number,
});

export default mongoose.model("CartItem", cartItemSchema);
