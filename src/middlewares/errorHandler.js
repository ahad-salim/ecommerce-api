import { errorResponse } from "../utils/responseFormatter.js";

export default function errorHandler(err, req, res, next) {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;

  return errorResponse(
    res,
    err.message || "Something went wrong",
    err.errors || [],
    statusCode,
  );
}
