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
    type: Number,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
});

export default mongoose.model("Product", productSchema)
