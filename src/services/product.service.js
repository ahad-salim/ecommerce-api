import mongoose from "mongoose";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import AppError from "../utils/AppError.js";
import { escapeRegex } from "../utils/regex.js";

const createSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9]-/g, "");
};

const SORTABLE_FIELDS = new Set(["price", "name", "createdAt", "stock"]);

const createProduct = async ({ name, price, stock, category }) => {
  if (!mongoose.Types.ObjectId.isValid(category)) {
    throw new AppError("Invalid category ID", 400, "INVALID_ID");
  }

  const categoryExist = await Category.exists({ _id: category });

  if (!categoryExist) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  const slug = createSlug(name);

  const existingProduct = await Product.exists({ slug });

  if (existingProduct) {
    throw new AppError("Product already exists", 409, "PRODUCT_EXIST");
  }

  const product = await Product.create({ name, slug, price, stock, category });

  return {
    data: product,
  };
};

const getProduct = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Product ID", 400, "INVALID_ID");
  }

  const product = await Product.findOne({ _id: id, isDeleted: false }).populate(
    "category",
    "name slug",
  );

  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  return {
    data: product,
  };
};

const getProducts = async (query) => {
  const { search, category, minPrice, maxPrice, sort, page, limit } = query;

  const filter = { isDeleted: false };

  if (search) {
    const pattern = escapeRegex(search);
    filter.$or = [
      {
        name: {
          $regex: pattern,
          $options: "i",
        },
      },
      {
        slug: {
          $regex: pattern,
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

    for (const raw of sort.split(",")) {
      const descending = raw.startsWith("-");
      const field = descending ? raw.slice(1) : raw;

      if (!SORTABLE_FIELDS.has(field)) {
        throw new AppError(`Cannot sort by "${field}"`, 400, "INVALID_SORT");
      }

      sortOption[field] = descending ? -1 : 1;
    }
  }

  sortOption._id = 1;

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
    throw new AppError("Invalid product ID", 400, "INVALID_ID");
  }

  const product = await Product.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!product) {
    throw new AppError("Invalid Product ID", 400, "INVALID_ID");
  }

  if (updates.category) {
    if (!mongoose.Types.ObjectId.isValid(updates.category)) {
      throw new AppError("Invalid category ID", 400, "INVALID_ID");
    }

    const categoryExists = await Category.exists({ _id: updates.category });

    if (!categoryExists) {
      throw new AppError("Category not found", 400, "CATEGORY NOT FOUND");
    }
  }

  if (updates.name) {
    updates.slug = createSlug(updates.name);

    const clash = await Product.exists({ slug, _id: { $ne: id } });

    if (clash) {
      throw new AppError("Product already exists", 409, "PRODUCT_EXISTS");
    }

    updates.slug = slug;
  }

  Object.assign(product, updates);

  await product.save();

  return {
    data: product,
  };
};

const softDeleteProduct = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid Product ID", 400, "INVALID_ID");
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
