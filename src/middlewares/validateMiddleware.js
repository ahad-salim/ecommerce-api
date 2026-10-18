import { errorResponse } from "../utils/responseFormatter.js";

const formatIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path[0],
    message: issue.message,
  }));

export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return errorResponse(res, "Validation Failed", formatIssues(result.error.issues), 400);
    }

    req.body = result.data;

    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return errorResponse(res, "Validation Failed", formatIssues(result.error.issues), 400);
    }

    req.validateQuery = result.data

    next();
  };
};
