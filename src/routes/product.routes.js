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

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List products with search, filters, sorting and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 100 }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Category ID
 *       - in: query
 *         name: minPrice
 *         schema: { type: integer, minimum: 0 }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: integer, minimum: 0 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, example: "-price,name" }
 *         description: Comma separated. Allowed fields are price, name, createdAt, stock. Prefix a field with - for descending.
 *       - { $ref: "#/components/parameters/Page" }
 *       - { $ref: "#/components/parameters/Limit" }
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       400: { $ref: "#/components/responses/ValidationError" }
 */
router.get("/", validateQuery(productQuerySchema), getProductsController);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get one product
 *     tags: [Products]
 *     parameters:
 *       - { $ref: "#/components/parameters/IdPath" }
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.get("/:id", getProductController);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a product (admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, stock, category]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 150, example: Wireless Mouse }
 *               price: { type: integer, minimum: 0, description: Whole number, example: 5000 }
 *               stock: { type: integer, minimum: 0, example: 25 }
 *               category: { type: string, description: Category ID, example: 665f1c2e9b1d8a0012a4b3c4 }
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404:
 *         description: Category not found
 */
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createProductSchema),
  createProductController,
);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product (admin only)
 *     description: Send only the fields you want to change.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { $ref: "#/components/parameters/IdPath" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 150 }
 *               price: { type: integer, minimum: 0 }
 *               stock: { type: integer, minimum: 0 }
 *               category: { type: string, description: Category ID }
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(updateProductSchema),
  updateProductController,
);

/**
 * @swagger
 * /products/{id}/image:
 *   patch:
 *     summary: Upload a product image (admin only)
 *     description: JPEG, PNG or WebP, maximum 2 MB. The file's real content is checked, not just its type.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { $ref: "#/components/parameters/IdPath" }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Product image uploaded
 *       400:
 *         description: Missing file, wrong type, too large or not a real image
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.patch(
  "/:id/image",
  authenticate,
  authorize("admin"),
  uploadProductImage,
  verifyImageSignature,
  uploadProductImageController,
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product (soft delete, admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { $ref: "#/components/parameters/IdPath" }
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  deleteProductController,
);

export default router;
