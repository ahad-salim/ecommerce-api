import mongoose from "mongoose";
import Cart from "../models/cartModel.js";
import CartItem from "../models/cartItemModel.js";
import Product from "../models/productModel.js";
import AppError from "../utils/AppError.js";

const getOrCreateCart = (userId) =>
  Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { upsert: true,  returnDocument: "after" },
  );

const findActiveProduct = async (productId) => {
 if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError("Invalid Product ID", 400, "INVALID_ID");
  }

  const product = await Product.findOne({ _id: productId, isDeleted: false });

  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  return product;
};

const getCart = async (userId) => {
  // if (!mongoose.Types.ObjectId(userId)) {
  //   throw new AppError("Invalid user ID", 400);
  // }

  const cart = await getOrCreateCart(userId);

  const items = await CartItem.find({ cart: cart._id }).populate({
    path: "product",
    select: "name slug price stock image category isDeleted",
    populate: { path: "category", select: "name slug" },
  });
  
 const activeItems = items.filter(
    (item) => item.product && !item.product.isDeleted,
  );

  const totalItems = activeItems.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = activeItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  return {
    data: {
      cartId: cart._id,
      items: activeItems,
      totalItems,
      totalAmount,
    },
  };
};

const addCartItem = async (userId, { productId, quantity }) => {
  const product = await findActiveProduct(productId);
  const cart = await getOrCreateCart(userId);

  const existingItem = await CartItem.findOne({
    cart: cart._id,
    product: product._id,
  });

  const newQuantity = (existingItem?.quantity || 0) + quantity;

  if (newQuantity > product.stock) {
    throw new AppError(
      "Requested quantity exceeds available stock",
      409,
      "INSUFFICIENT_STOCK",
    );
  }

  if (existingItem) {
    existingItem.quantity = newQuantity;
    await existingItem.save();
  } else {
    await CartItem.create({
      cart: cart._id,
      product: product._id,
      quantity,
    });
  }

  return getCart(userId);
};

const updateCartItem = async (userId, productId, quantity) => {
  const product = await findActiveProduct(productId);
  const cart = await getOrCreateCart(userId);

  if (quantity > product.stock) {
    throw new AppError(
      "Requested quantity exceeds available stock",
      409,
      "INSUFFICIENT_STOCK",
    );
  }

  // Filtering by cart._id = ownership check (prevents IDOR)
  const cartItem = await CartItem.findOneAndUpdate(
    { cart: cart._id, product: product._id },
    { quantity },
    {  returnDocument: "after" },
  );

  if (!cartItem) {
    throw new AppError("Item not found in cart", 404, "CART_ITEM_NOT_FOUND");
  }

  return getCart(userId);
};

const removeCartItem = async (userId, productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError("Invalid Product ID", 400, "INVALID_ID");
  }

  const cart = await getOrCreateCart(userId);

  const result = await CartItem.deleteOne({
    cart: cart._id,
    product: productId, 
  });

  if (result.deletedCount === 0) {
    throw new AppError("Item not found in cart", 404, "CART_ITEM_NOT_FOUND");
  }

  return getCart(userId);
};

const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId);

  await CartItem.deleteMany({ cart: cart._id });

  return {
    data: { cartId: cart._id, items: [], totalItems: 0, totalAmount: 0 },
  };
};

export { getCart, addCartItem, updateCartItem, removeCartItem, clearCart };
