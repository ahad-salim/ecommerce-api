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


/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new customer account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, description: At least two names, example: Ahad Salim }
 *               email: { type: string, format: email, example: ahad@example.com }
 *               password: { type: string, description: Min 8 chars with upper, lower, number and symbol, example: SecretPassword123! }
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       409:
 *         description: User already exists
 */
router.post("/register", validate(registerSchema), registerUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in
 *     description: Returns an access token in the body and sets the refreshToken httpOnly cookie.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: ahad@example.com }
 *               password: { type: string, example: SecretPassword123! }
 *     responses:
 *       200:
 *         description: Login successful, returns accessToken and user, sets refreshToken cookie
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Get a new access token using the refreshToken cookie
 *     description: No request body. The httpOnly refreshToken cookie is sent automatically by the browser, and a new refresh token cookie is issued (rotation).
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed successfully, returns a new accessToken
 *       401:
 *         description: Refresh token missing, invalid, revoked or expired
 */
router.post("/refresh", refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out and revoke the refresh token
 *     description: No request body. Reads the refreshToken cookie, revokes it and clears the cookie.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", logout);

/**
 * @swagger
 * /auth/register-admin:
 *   post:
 *     summary: Create an admin account (admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Admin User }
 *               email: { type: string, format: email, example: admin2@example.com }
 *               password: { type: string, example: SecretPassword123! }
 *     responses:
 *       201:
 *         description: Admin account created successfully
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       409:
 *         description: User already exists
 */
router.post(
  "/register-admin",
  authenticate,
  authorize("admin"),
  validate(registerSchema),
  registerAdmin,
);

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify an email address (link from the verification email)
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Token invalid or expired
 */

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   post:
 *     summary: Verify an email address (same as GET, for API clients)
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Token invalid or expired
 */
router.post("/verify-email/:token", verifyEmailController);
router.get("/verify-email/:token", verifyEmailController);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend the verification email
 *     description: Always answers the same way so it does not reveal whether the email is registered.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: ahad@example.com }
 *     responses:
 *       200:
 *         description: If the account exists and is not verified, a new email has been sent
 *       400: { $ref: "#/components/responses/ValidationError" }
 */
router.post(
  "/resend-verification",
  validate(forgotPasswordSchema),
  resendVerification,
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     description: Always answers the same way so it does not reveal whether the email is registered.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: ahad@example.com }
 *     responses:
 *       200:
 *         description: If that email is registered, a reset link has been sent
 *       400: { $ref: "#/components/responses/ValidationError" }
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPasswordController,
);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Set a new password using the token from the reset email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, example: NewSecret123! }
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Validation failed, or token invalid or expired
 */
router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  resetPasswordController,
);

export default router;
