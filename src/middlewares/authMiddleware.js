import { verifyAccessToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/responseFormatter.js";

export default function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return errorResponse(res, "Authentication required", [], 401);
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return errorResponse(res, "Invalid authorization header", [], 401);
    }

    const token = parts[1];

    const decoded = verifyAccessToken(token);

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return errorResponse(res, "Invalid or expired access token", [], 401);
  }
}
