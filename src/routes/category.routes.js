import express from "express";
import {
  createCategoryController,
  deleteCategoryController,
  getCategoriesController,
  updateCategoryController,
} from "../controllers/category.controller.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";
import { createCategorySchema, updateCategorySchema } from "../validators/category.validator.js";
import { validate } from "../middlewares/validateMiddleware.js";

const router = express.Router();

router.get("/", getCategoriesController);

router.post("/", authenticate, authorize("admin"), validate(createCategorySchema), createCategoryController);

router.patch("/:id", authenticate, authorize("admin"), validate(updateCategorySchema), updateCategoryController);

router.delete("/:id", authenticate, authorize("admin"), deleteCategoryController);

export default router;
