import { createReview, getReviews } from "../services/review.service.js";
import { successResponse } from "../utils/responseFormatter.js";

export const createReviewController = async (req, res, next) => {
  try {
    const result = await createReview(req.user.id, req.params.id, req.body);
    return successResponse(res, "Review created", result.data, 201);
  } catch (error) {
    next(error);
  }
};

export const getReviewsController = async (req, res, next) => {
  try {
    const result = await getReviews(req.params.id, req.validateQuery);
    return successResponse(res, "Reviews retrieved successfully", result.data);
  } catch (error) {
    next(error);
  }
};
