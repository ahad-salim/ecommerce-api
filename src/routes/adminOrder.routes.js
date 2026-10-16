import express from "express";
import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";
import { validate, validateQuery } from "../middlewares/validateMiddleware.js";
import {
  adminOrderQuerySchema,
  updateOrderStatusSchema,
} from "../validators/order.validator.js";
import {
  getAllOrdersController,
  updateOrderStatusController,
} from "../controllers/order.controller.js";

const router = express.Router();

router.use(authenticate, authorize("admin"));

router.get("/", validateQuery(adminOrderQuerySchema), getAllOrdersController);

router.patch("/:id/status", validate(updateOrderStatusSchema), updateOrderStatusController);

export default router;
