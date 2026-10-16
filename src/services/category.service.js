import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import AppError from "../utils/AppError.js";
import { createSlug } from "../utils/slug.js";

const createCategory = async ({ name }) => {
  const slug = createSlug(name);

  const existingCategory = await Category.findOne({
    $or: [{ name }, { slug }],
  });

  if (existingCategory) {
    throw new AppError(
      "Category already exists",
      409,
      "CATEGORY_ALREADY_EXISTS",
    );
  }

  const category = await Category.create({ name, slug });

  return {
    data: category,
  };
};

const getCategories = async () => {
  const categories = await Category.find().sort({ name: 1 });

  return {
    data: categories,
  };
};

const updateCategory = async (id, { name }) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid category ID", 400, "INVALID_ID");
  }

  const slug = createSlug(name);

  const existingCategory = await Category.findOne({
    $or: [{ name }, { slug }],
    _id: { $ne: id },
  });

  if (existingCategory) {
    throw new AppError(
      "Category already exists",
      409,
      "CATEGORY_ALREADY_EXISTS",
    );
  }

  const category = await Category.findByIdAndUpdate(
    id,
    { name, slug },
    { new: true, runValidators: true },
  );

  if (!category) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  return {
    data: category,
  };
};

const deleteCategory = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid category ID", 400, "INVALID_ID");
  }

  const inUse = await Product.exists({
    category: id,
    isDeleted: false,
  });
  if (inUse) {
    throw new AppError(
      "Category still has products, move or delete them first",
      409,
      "CATEGORY_IN_USE",
    );
  }

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
  }

  return {
    data: category,
  };
};

export { createCategory, getCategories, updateCategory, deleteCategory };
