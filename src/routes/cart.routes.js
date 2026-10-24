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

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get the logged-in user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
router.get("/", authenticate, getCartController);

/**
 * @swagger
 * /cart/items:
 *   post:
 *     summary: Add a product to the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string, example: 665f1c2e9b1d8a0012a4b3c4 }
 *               quantity: { type: integer, minimum: 1, maximum: 100, example: 2 }
 *     responses:
 *       201:
 *         description: Item added to cart
 *       400:
 *         description: Validation failed or not enough stock
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       404:
 *         description: Product not found
 */
router.post(
  "/items",
  authenticate,
  validate(addCartItemSchema),
  addCartItemController,
);

/**
 * @swagger
 * /cart/items/{productId}:
 *   patch:
 *     summary: Change the quantity of a cart item
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer, minimum: 1, maximum: 100, example: 3 }
 *     responses:
 *       200:
 *         description: Cart quantity updated
 *       400:
 *         description: Validation failed or not enough stock
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       404:
 *         description: Item not in cart
 */
router.patch(
  "/items/:productId",
  authenticate,
  validate(updateCartItemSchema),
  updateCartItemController,
);

/**
 * @swagger
 * /cart/items/{productId}:
 *   delete:
 *     summary: Remove one product from the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       404:
 *         description: Item not in cart
 */
router.delete("/items/:productId", authenticate, removeCartItemController);

/**
 * @swagger
 * /cart:
 *   delete:
 *     summary: Remove everything from the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
router.delete("/", authenticate, clearCartController);

export default router;
