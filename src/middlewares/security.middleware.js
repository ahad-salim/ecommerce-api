import rateLimit from "express-rate-limit";
import { errorResponse } from "../utils/responseFormatter.js";

/* ------------------------------------------------------------------ *
 *  NoSQL injection: strip Mongo operators from body and params
 * ------------------------------------------------------------------ */

// Mutates in place (Express 5 does not let you REPLACE req.query, so we only
// touch body and params here and reject bad query keys separately below).
const stripOperators = (value) => {
  if (Array.isArray(value)) {
    value.forEach(stripOperators);
    return;
  }

  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete value[key];
      } else {
        stripOperators(value[key]);
      }
    }
  }
};

export const sanitizeInput = (req, res, next) => {
  stripOperators(req.body);
  stripOperators(req.params);

  for (const key of Object.keys(req.query)) {
    if (key.includes("$")) {
      return errorResponse(res, "Invalid query parameter", ["INVALID_QUERY"], 400);
    }
  }

  next();
};

/* ------------------------------------------------------------------ *
 *  HTTP parameter pollution: ?sort=a&sort=b becomes an array
 * ------------------------------------------------------------------ */

export const rejectParameterPollution = (req, res, next) => {
  for (const value of Object.values(req.query)) {
    if (Array.isArray(value)) {
      return errorResponse(
        res,
        "Repeated query parameters are not allowed",
        ["PARAMETER_POLLUTION"],
        400,
      );
    }
  }

  next();
};

/* ------------------------------------------------------------------ *
 *  HTTPS only in production (needs `app.set("trust proxy", 1)`)
 * ------------------------------------------------------------------ */

export const httpsOnly = (req, res, next) => {
  if (process.env.NODE_ENV !== "production") return next();

  const proto = req.headers["x-forwarded-proto"];

  // health checks from the platform are plain HTTP
  if (req.path === "/health" || req.path === "/api/v1/health") return next();

  if (proto && proto !== "https") {
    // 308 keeps the HTTP method (a 301 would turn a POST into a GET)
    return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  }

  next();
};

/* ------------------------------------------------------------------ *
 *  Rate limiters (off while running tests)
 * ------------------------------------------------------------------ */

const limiter = ({ windowMs, limit, message, skip }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "test" || (skip ? skip(req) : false),
    handler: (req, res) =>
      errorResponse(res, message, ["TOO_MANY_REQUESTS"], 429),
  });

// every endpoint; the payment webhook is excluded so provider retries are never blocked
export const apiLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: "Too many requests, please try again later",
  skip: (req) => req.originalUrl.startsWith("/api/v1/payments/webhook"),
});

// login, register, refresh: slows down password guessing
export const authLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many attempts, please try again in a few minutes",
});

// forgot-password, resend verification, reset: stops email bombing
export const strictLimiter = limiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: "Too many requests, please try again later",
});
