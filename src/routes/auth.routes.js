import express from "express";
import {
  registerUser,
  login,
  refreshToken,
  logout,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);

router.post("/login", validate(loginSchema), login);

router.post("/refresh", refreshToken);

router.post("/logout", logout)

export default router;
