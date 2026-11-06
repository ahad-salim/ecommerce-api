import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.routes.js";
import errorHandler from "./middlewares/errorHandler.js";
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import orderRoutes from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminOrderRoutes from "./routes/adminOrder.routes.js";
import reviewRoutes from "./routes/review.routes.js";

import { UPLOAD_ROOT } from "./middlewares/upload.middleware.js";
import requestId from "./middlewares/requestId.js";
import {
  apiLimiter,
  httpsOnly,
  rejectParameterPollution,
  sanitizeInput,
} from "./middlewares/security.middleware.js";
import notFound from "./middlewares/notFound.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();

app.disable("x-powered-by");

app.use(requestId);
app.use(httpsOnly);
app.use(helmet());

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.CLIENT_URL ||
  ""
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) =>
      callback(null, !origin || allowedOrigins.includes(origin)),
    credentials: true,
  }),
);

morgan.token("safe-url", (req) => req.originalUrl.split("?")[0]);
app.use(
  morgan(":method :safe-url :status :res[content-length] - :response-time ms", {
    stream: { write: (message) => console.log(message.trim()) },
    skip: () => process.env.NODE_ENV === "test",
  }),
);

app.use(express.json({ limit: "10kb" }));
// app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeInput);
app.use(rejectParameterPollution);

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(UPLOAD_ROOT, { index: false, dotfiles: "deny" }),
);

setupSwagger(app);

app.get(["/health", "/api/v1/health"], (req, res) => {
  res.status(200).json({
    success: true,
    message: "OK",
    data: {
      status: "up",
      database: mongoose.connection.readyState === 1 ? "up" : "down",
    },
  });
});

app.use("/api/v1", apiLimiter);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products/:id/reviews", reviewRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/admin/orders", adminOrderRoutes);

app.get("/api/v1/payments/result", (req, res) => {
  res.send(`
      <h2>Payment Processing</h2>
      <p>You can return to the store and check your payment status</p>`);
});
app.use("/api/v1/payments", paymentRoutes);

app.use(notFound);
app.use(errorHandler);
export default app;
