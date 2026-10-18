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

router.get("/me", getCurrentUser);
router.patch("/me", validate(updateMeSchema), updateMeController);
router.patch("/me/password", validate(changePasswordSchema), changePasswordController);

router.get("/", authorize("admin"), validateQuery(userQuerySchema), listUsersController);
router.patch("/:id/role", authorize("admin"), validate(updateRoleSchema), updateUserRoleController);
router.delete("/:id", authorize("admin"), deactivateUserController);

export default router;
