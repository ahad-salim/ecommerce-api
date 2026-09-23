import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  slug: {
    type: String,
    unique: true,
  },
  price: {
    type: Number,
  },
  stock: {
    type: String,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
});

export default mongoose.model("Product", productSchema)
