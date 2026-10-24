import express from "express";
import authenticate from "../middlewares/authMiddleware.js";
import { validate, validateQuery } from "../middlewares/validateMiddleware.js";
import {
  createReviewSchema,
  reviewQuerySchema,
} from "../validators/review.validator.js";
import {
  createReviewController,
  getReviewsController,
} from "../controllers/review.controller.js";

// mounted at /api/v1/products/:id/reviews, so mergeParams gives us :id
const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /products/{id}/reviews:
 *   get:
 *     summary: List reviews for a product
 *     tags: [Reviews]
 *     parameters:
 *       - { $ref: "#/components/parameters/IdPath" }
 *       - { $ref: "#/components/parameters/Page" }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.get("/", validateQuery(reviewQuerySchema), getReviewsController);

/**
 * @swagger
 * /products/{id}/reviews:
 *   post:
 *     summary: Review a product
 *     tags: [Reviews]
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
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5, example: 4 }
 *               comment: { type: string, maxLength: 1000, example: Works great }
 *     responses:
 *       201:
 *         description: Review created
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.post("/", authenticate, validate(createReviewSchema), createReviewController);

export default router;
