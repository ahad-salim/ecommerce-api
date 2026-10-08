import { errorResponse } from "../utils/responseFormatter.js";

export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];

    return (
      errorResponse(res, `${field} already exists`),
      [{ field, message: `A resource with this ${field} already exists` }],
      409
    );
  }

  if (statusCode >= 500) {
    console.error(err.stack);
    return errorResponse(res, "Internal server error", ["SEVER_ERROR"], 500);
  }
  return errorResponse(res, err.message, err.errors || [], statusCode);
}
