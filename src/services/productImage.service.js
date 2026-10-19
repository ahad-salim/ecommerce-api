import fs from "fs";
import path from "path";
import Product from "../models/productModel.js";
import AppError from "../utils/AppError.js";
import { PRODUCT_IMAGE_DIR } from "../middlewares/upload.middleware.js";

const OBJECT_ID = /^[a-f\d]{24}$/i;

const removeFile = (filePath) => fs.promises.unlink(filePath).catch(() => {});

export const setProductImage = async (productId, file) => {
  if (!OBJECT_ID.test(productId)) {
    await removeFile(file.path);
    throw new AppError("Invalid Product ID", 400, "INVALID_ID");
  }

  const product = await Product.findOne({ _id: productId, isDeleted: false });

  if (!product) {
    await removeFile(file.path);
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  const oldImage = product.image;

  product.image = `/uploads/products/${file.filename}`;
  await product.save();

  if (oldImage) {
    await removeFile(path.join(PRODUCT_IMAGE_DIR, path.basename(oldImage)));
  }

  return { data: product };
};
