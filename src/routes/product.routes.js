import express from "express";

import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";

import { validate, validateQuery } from "../middlewares/validateMiddleware.js";

import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from "../validators/product.validator.js";

import {
  createProductController,
  getProductController,
  getProductsController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller.js";
import {
  uploadProductImage,
  verifyImageSignature,
} from "../middlewares/upload.middleware.js";
import { uploadProductImageController } from "../controllers/productImage.controller.js";

const router = express.Router();

router.get("/", validateQuery(productQuerySchema), getProductsController);

router.get("/:id", getProductController);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createProductSchema),
  createProductController,
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(updateProductSchema),
  updateProductController,
);

router.patch(
  "/:id/image",
  authenticate,
  authorize(admin),
  uploadProductImage,
  verifyImageSignature,
  uploadProductImageController,
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  deleteProductController,
);

export default router;
