import { errorResponse } from "../utils/responceFomater.js";

export default function errorHandler(err, req, res, next) {
  console.error(err.stack);
  const statusCode = err.statuscode || 500;

  return errorResponse(
    res,
    err.message || "Something went wrong",
    err.errors || [],
    statusCode,
  );
}
