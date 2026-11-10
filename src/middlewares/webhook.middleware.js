import crypto from "crypto";
import { errorResponse } from "../utils/responseFormatter.js";

const digest = (value) =>
  crypto.createHash("sha256").update(String(value)).digest();

export default function verifyWebhookToken(req, res, next) {
  const expected = process.env.WEBHOOK_TOKEN;

  if (!expected) {
    console.error("WEBHOOK_TOKEN_NOT_CONFIGURED");
    return errorResponse(
      res,
      "Webhook is not configured",
      ["WEBHOOK_NOT_CONFIGURED"],
      503,
    );
  }

  const provided = req.query.token;

  if (
    typeof provided !== "string" ||
    !crypto.timingSafeEqual(digest(provided), digest(expected))
  ) {
    return errorResponse(
      res,
      "Invalid webhook token",
      ["INVALID_WEBHOOK_TOKEN"],
      401,
    );
  }

  next();
}