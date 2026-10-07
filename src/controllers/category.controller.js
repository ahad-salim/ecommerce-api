import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../services/category.service.js";
import { successResponse } from "../utils/responseFormatter.js";

const createCategoryController = async (req, res, next) => {
  try {
    const result = await createCategory(req.body);

    console.log(result);
    return successResponse(res, "Category created", result.data, 201);
  } catch (error) {
    console.error("create category error:", error);
    next(error);
  }
};

const getCategoriesController = async (req, res, next) => {
  try {
    const result = await getCategories();

    return successResponse(res, "Category retrieved", result.data, 200);
  } catch (error) {
    console.error("get category error:", error);
    next(error);
  }
};

const updateCategoryController = async (req, res, next) => {
  try {
    const result = await updateCategory(req.params.id, req.body);

    return successResponse(res, "Category updated", result.data);
  } catch (error) {
    console.error("update category error:", error);
    next(error);
  }
};

const deleteCategoryController = async (req, res, next) => {
  try {
    const result = await deleteCategory(req.params.id);

    return successResponse(res, "Category deleted", result.data);
  } catch (error) {
    console.error("delete category error:", error);
    next(error);
  }
};


export { createCategoryController, getCategoriesController, updateCategoryController, deleteCategoryController }