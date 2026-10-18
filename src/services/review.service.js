import Order from "../models/orderModel.js";
import OrderItem from "../models/orderItemModel.js";
import Product from "../models/productModel.js";
import Review from "../models/reviewModel.js";
import AppError from "../utils/AppError.js";

const OBJECT_ID = /^[a-f\d]{24}$/i;

const PAID_STATUSES = ["paid", "processing", "shipped", "delivered"];

const assertProduct = async (productId) => {
  if (!OBJECT_ID.test(productId)) {
    throw new AppError("Invalid Product ID", 400, "INVALID_ID");
  }

  const product = await Product.exists({ _id: productId, isDeleted: false });

  if (!product) throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
};

const createReview = async (userId, productId, { rating, comment }) => {
  await assertProduct(productId);

  const orders = await Order.find({ user: userId, status: { $in: PAID_STATUSES } })
    .select("_id")
    .lean();

  const bought =
    orders.length > 0 &&
    (await OrderItem.exists({
      order: { $in: orders.map((o) => o._id) },
      product: productId,
    }));

  if (!bought) {
    throw new AppError(
      "You can only review products you have bought",
      403,
      "PURCHASE_REQUIRED",
    );
  }

  try {
    const review = await Review.create({ user: userId, product: productId, rating, comment });
    return { data: review };
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError("You already reviewed this product", 409, "ALREADY_REVIEWED");
    }
    throw err;
  }
};

const getReviews = async (productId, { page, limit }) => {
  await assertProduct(productId);

  const [reviews, total] = await Promise.all([
    Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: productId }),
  ]);

  return {
    data: {
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    },
  };
};


export { createReview, getReviews }