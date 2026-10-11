import express from "express";
import authenticate from "../middlewares/authMiddleware.js";
import {
  addCartItemController,
  clearCartController,
  getCartController,
  removeCartItemController,
  updateCartItemController,
} from "../controllers/cart.controller.js";
import { validate } from "../middlewares/validateMiddleware.js";
import {
  addCartItemSchema,
  updateCartItemSchema,
} from "../validators/cart.validator.js";

const router = express.Router();

router.get("/", authenticate, getCartController);

router.post(
  "/items",
  authenticate,
  validate(addCartItemSchema),
  addCartItemController,
);

router.patch(
  "/items/:itemId",
  authenticate,
  validate(updateCartItemSchema),
  updateCartItemController,
);

router.delete("/items/:itemId", authenticate, removeCartItemController);

router.delete("/", authenticate, clearCartController);

export default router;
