import express from "express";
import {
  createCategoryController,
  deleteCategoryController,
  getCategoriesController,
  updateCategoryController,
} from "../controllers/category.controller.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";
import { createCategorySchema, updateCategorySchema } from "../validators/category.validator.js";
import { validate } from "../middlewares/validateMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Category retrieved
 */
router.get("/", getCategoriesController);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 50, example: Electronics }
 *     responses:
 *       201:
 *         description: Category created
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       409:
 *         description: Category already exists
 */
router.post("/", authenticate, authorize("admin"), validate(createCategorySchema), createCategoryController);

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: Rename a category (admin only)
 *     tags: [Categories]
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
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 50, example: Home Appliances }
 *     responses:
 *       200:
 *         description: Category updated
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.patch("/:id", authenticate, authorize("admin"), validate(updateCategorySchema), updateCategoryController);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { $ref: "#/components/parameters/IdPath" }
 *     responses:
 *       200:
 *         description: Category deleted
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.delete("/:id", authenticate, authorize("admin"), deleteCategoryController);

export default router;
