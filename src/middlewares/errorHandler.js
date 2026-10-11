import { errorResponse } from "../utils/responseFormatter.js";

export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

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
    return errorResponse(res, "Internal server error", ["SEVER_ERROR"], 500);
  }
  return errorResponse(res, err.message, err.errors || [], statusCode);
}
