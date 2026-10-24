import { errorResponse } from "../utils/responseFormatter.js";

export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.ststus || 500;

  if (err.type === "entity.parse.failed") {
    return errorResponse(res, "Malformed JSON body", ["INVALID_JSON"], 400);
  }

  if (err.type === "entity.too.large") {
    return errorResponse(res, "Request body is too large", ["PAYLOAD_TOO_LARGE"], 413);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];

    return errorResponse(
      res,
      `${field || "Resource"} already exists`,
      [
        {
          field: field || "resource",
          message: `A resource with this ${field || "value"} already exists`,
        },
      ],
      409,
    );
  }

  if (err.name === "ValidationError" && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return errorResponse(res, "Validation failed", errors, 400);
  }
  if (err.name === "CastError") {
    return errorResponse(res, `Invalid ${err.path}`, [], 400);
  }

  if (statusCode >= 500) {
    console.error(err.stack);
    return errorResponse(res, statusCode === 500 ? "Internal server error" : "Service temporarily unavailable", ["SEVER_ERROR"], statusCode);
  }
  return errorResponse(res, err.message, err.errors || [], statusCode);
}
