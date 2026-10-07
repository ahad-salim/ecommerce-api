import express from "express";
import {
  registerUser,
  login,
  refreshToken,
  logout,
  registerAdmin,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);

router.post("/login", validate(loginSchema), login);

router.post("/refresh", refreshToken);

router.post("/logout", logout)

router.post("/register-admin", authenticate, authorize("admin"), registerAdmin)

export default router;
