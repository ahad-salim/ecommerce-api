import mongoose from "mongoose";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import AppError from "../utils/AppError.js";

const createSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9]-/g, "");
};

const createProduct = async ({ name, price, stock, category }) => {
  if (!mongoose.Types.ObjectId.isValid(category)) {
    throw new AppError("Invalid category ID", 400);
  }

  const categoryExist = await Category.findById(category);

  if (!categoryExist) {
    throw new AppError("Category not found", 404);
  }

  const slug = createSlug(name);

  const existingProduct = await Product.findOne({ slug, isDeleted: false });

  if (existingProduct) {
    throw new AppError("Product already exists", 409, PRODUCT_EXIST);
  }

  const product = await Product.create({ name, slug, price, stock, category });

  return {
    data: product,
  };
};

const getProduct = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Product ID", 400);
  }

  const product = await Product.findOne({ _id: id, isDeleted: false }).populate(
    "category",
    "name slug",
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return {
    data: product,
  };
};

const getProducts = async (query) => {
  const { search, category, minPrice, maxPrice, sort, page, limit } = query;

  const filter = { isDeleted: false };

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: "i",
        },
      },
      {
        slug: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  // Category filter
  if (category) {
    if (!mongoose.Types.ObjectId.isValid(category)) {
      throw new AppError("Invalid category ID", 400);
    }

    filter.category = category;
  }

  // Price filtering
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined) {
      filter.price.$gte = minPrice;
    }

    if (maxPrice !== undefined) {
      filter.price.$lte = maxPrice;
    }
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Sorting
  let sortOption = { createdAt: -1 };

  if (sort) {
    sortOption = {};

    const sortFields = sort.split(",");

    for (const field of sortFields) {
      if (field.startsWith("-")) {
        sortOption[field.substring(1)] = -1;
      } else {
        sortOption[field] = 1;
      }
    }
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sortOption)
      .skip(skip)
      .limit(limit),

    Product.countDocuments(filter),
  ]);

  return {
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
};

const updateProduct = async (id, updates) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return {
      success: false,
      statusCode: 400,
      message: "Invalid product ID",
    };
  }

  const product = await Product.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!product) {
    throw new AppError("Invalid Product ID", 400);
  }

  if (updates.category) {
    if (!mongoose.Types.ObjectId.isValid(updates.category)) {
      throw new AppError("Invalid category ID", 400);
    }

    const categoryExists = await Category.findById(updates.category);

    if (!categoryExists) {
      throw new AppError("Category not found", 400);
    }
  }

  if (updates.name) {
    updates.slug = createSlug(updates.name);
  }

  Object.assign(product, updates);

  await product.save();

  return {
    data: product,
  };
};

const softDeleteProduct = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Product ID", 400);
  }

  const product = await Product.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
    },
    {
      isDeleted: true,
    },
    {
      returnDocument: "after",
    },
  );

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return {
    data: product,
  };
};

export {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  softDeleteProduct,
};
