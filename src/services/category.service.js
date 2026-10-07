import Category from "../models/categoryModel.js";
import AppError from "../utils/AppError.js";

const creatSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

const createCategory = async ({ name }) => {
  const slug = createSlug(name);

  const existingCategory = await Category.findOne({
    $or: [{ name }, { slug }],
  });

  if (existingCategory) {
    throw new AppError("Category already exists", 409, CATEGORY_ALREADY_EXISTS);
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
  const slug = creatSlug(name);

  const existingCategory = await Category.findOne({
    $or: [{ name }, { slug }],
    _id: { $ne: id },
  });

  if (existingCategory) {
    throw new AppError("Category already exists", 409, CATEGORY_ALREADY_EXISTS);
  }

  const category = await Category.findByIdAndUpdate(
    id,
    { name, slug },
    { new: true, runValidators: true },
  );

  if (!category) {
    throw new AppError("Category not found", 404, CATEGORY_NOT_FOUND);
  }

  return {
    data: category,
  };
};

const deleteCategory = async (id) => {
  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    throw new AppError("Category not found", 404, CATEGORY_NOT_FOUND);
  }

  return {
    data: category,
  };
};


export { createCategory, getCategories, updateCategory, deleteCategory }