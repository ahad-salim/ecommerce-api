import { regex } from "zod";
import {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  softDeleteProduct,
} from "../services/product.service.js";
import { successResponse } from "../utils/responseFormatter.js";

const createProductController = async (req, res, next) => {
  try {
    const result = await createProduct(req.body);

    console.log(result);

    return successResponse(
      res,
      "Product created sucessfully",
      result.data,
      201,
    );
  } catch (error) {
    console.error("Create product error:", error);
    next(error);
  }
};

const getProductController = async (req, res, next) => {
  try {
    const result = await getProduct(req.params.id);

    console.log(result);
    return successResponse(
      res,
      "Product retrieved sucessfully",
      result.data,
    );
  } catch (error) {
    console.error("get product error:", error);
    next(error);
  }
};

const getProductsController = async (req, res, next) => {
  try {
    const result = await getProducts(req.query);

    console.log(result);
    return successResponse(
      res,
      "Product retrieved sucessfully",
      result.data,
    );
  } catch (error) {
    console.error("get products error:", error);
    next(error);
  }
};

const updateProductController = async (req, res, next) => {
  try {
    const result = await updateProduct(req.params.id, req.body);

    return successResponse(
      res,
      "Product updated sucessfully",
      result.data,
      200,
    );
  } catch (error) {
    console.error("update product error:", error);
    next(error);
  }
};

const deleteProductController = async (req, res, next) => {
  try {
    const result = await softDeleteProduct(req.params.id);

    return successResponse(res, "Product deleted successfully", result.data);
  } catch (error) {
    next(error);
  }
};

export {
  createProductController,
  getProductController,
  getProductsController,
  updateProductController,
  deleteProductController,
};
