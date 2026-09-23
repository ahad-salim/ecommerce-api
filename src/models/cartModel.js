import mongoose, { Schema } from "mongoose";

const cartSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    unique: true,
  },
});

export default mongoose.model("Cart", cartSchema)