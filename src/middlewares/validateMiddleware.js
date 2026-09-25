import { errorResponse } from "../utils/responseFormatter.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path[0],
        message: issue.message,
      }));
      return errorResponse(res, "Validation Failed", errors, 400);
    }

    req.body = result.data;

    next();
  };
};
