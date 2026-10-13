import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../services/cart.service.js";
import { successResponse } from "../utils/responseFormatter.js";

const getCartController = async (req, res, next) => {
  try {
    const result = await getCart(req.user.id);

    console.log(result);
    return successResponse(res, "Cart retrieved successfully", result.data);
  } catch (error) {
    console.error("getting cart error:", error);
    next(error);
  }
};

const addCartItemController = async (req, res, next) => {
  try {
    // const { productId, quantity } = req.body;
    const result = await addCartItem(req.user.id, req.body);

    return successResponse(res, "Item added to cart", result.data, 201);
  } catch (error) {
    console.error("adding item error:", error);
    next(error);
  }
};

const updateCartItemController = async (req, res, next) => {
  try {
    const result = await updateCartItem(
      req.user.id,
      req.params.itemId,
      req.body.quantity,
    );

    return successResponse(res, "Cart quantity updated", result.data, 200);
  } catch (error) {
    console.error("changing quantity error:", error);
    next(error);
  }
};

const removeCartItemController = async (req, res, next) => {
  try {
    const result = await removeCartItem(req.user.id, req.params.productId);

    return successResponse(res, "Item removed from cart", result.data);
  } catch (error) {
    console.error("removing item error:", error);
    next(error);
  }
};

const clearCartController = async (req, res, next) => {
  try {
    const result = await clearCart(req.user.id);

    return successResponse(res, "Cart cleared succesfully", result.data);
  } catch (error) {
    console.error("clearing cart error:", error);
    next(error);
  }
};

export {
  getCartController,
  addCartItemController,
  updateCartItemController,
  removeCartItemController,
  clearCartController,
};
