import express from "express";
import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";
import { validate, validateQuery } from "../middlewares/validateMiddleware.js";
import { changePasswordSchema } from "../validators/auth.validator.js";
import {
  updateMeSchema,
  updateRoleSchema,
  userQuerySchema,
} from "../validators/user.validator.js";
import {
  changePasswordController,
  deactivateUserController,
  getCurrentUser,
  listUsersController,
  updateMeController,
  updateUserRoleController,
} from "../controllers/user.controller.js";

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get the logged-in user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
router.get("/me", getCurrentUser);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update the logged-in user's name
 *     description: Only name can be changed. Email, role, isVerified and password are not editable here.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Ahad Salim }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
router.patch("/me", validate(updateMeSchema), updateMeController);

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     summary: Change the logged-in user's password
 *     description: The user must log in again afterwards.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, example: SecretPassword123! }
 *               newPassword: { type: string, description: Must differ from the current password, example: NewSecret456! }
 *     responses:
 *       200:
 *         description: Password changed. Please log in again
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
router.patch("/me/password", validate(changePasswordSchema), changePasswordController);


/**
 * @swagger
 * /users:
 *   get:
 *     summary: List users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [customer, admin] }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: ["true", "false"] }
 *       - { $ref: "#/components/parameters/Page" }
 *       - { $ref: "#/components/parameters/Limit" }
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 */
router.get("/", authorize("admin"), validateQuery(userQuerySchema), listUsersController);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     summary: Change a user's role (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { $ref: "#/components/parameters/IdPath" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [customer, admin] }
 *     responses:
 *       200:
 *         description: User role updated
 *       400: { $ref: "#/components/responses/ValidationError" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.patch("/:id/role", authorize("admin"), validate(updateRoleSchema), updateUserRoleController);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Deactivate a user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { $ref: "#/components/parameters/IdPath" }
 *     responses:
 *       200:
 *         description: User deactivated
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.delete("/:id", authorize("admin"), deactivateUserController);

export default router;
