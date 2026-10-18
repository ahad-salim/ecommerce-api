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

router.get("/", validateQuery(reviewQuerySchema), getReviewsController);

router.post("/", authenticate, validate(createReviewSchema), createReviewController);

export default router;
