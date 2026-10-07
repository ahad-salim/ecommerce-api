import { errorResponse } from "../utils/responseFormatter.js";

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        "Not authenticated, Please login",
        ["AUTHENTICATION_REQUIRED"],
        401,
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, "Access forbidden", ["ACCESS_DENIED"], 403);
    }

    next();
  };
};

export default authorize;
