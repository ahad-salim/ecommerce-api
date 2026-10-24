import { errorResponse } from "../utils/responseFormatter.js";

export default function notFound(req, res) {
  return errorResponse(res, "Route not found", ["ROUTE_NOT_FOUND"], 404);
}
