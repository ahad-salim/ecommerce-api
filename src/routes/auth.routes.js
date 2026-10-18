import express from "express";
import {
  registerUser,
  login,
  refreshToken,
  logout,
  registerAdmin,
  verifyEmailController,
  resendVerification,
  forgotPasswordController,
  resetPasswordController,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validateMiddleware.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);

router.post("/login", validate(loginSchema), login);

router.post("/refresh", refreshToken);

router.post("/logout", logout);

router.post(
  "/register-admin",
  authenticate,
  authorize("admin"),
  validate(registerSchema),
  registerAdmin,
);

router.post("/verify-email/:token", verifyEmailController);
router.get("/verify-email/:token", verifyEmailController);

router.post(
  "/resend-verification",
  validate(forgotPasswordSchema),
  resendVerification,
);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPasswordController,
);

router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  resetPasswordController,
);

export default router;
