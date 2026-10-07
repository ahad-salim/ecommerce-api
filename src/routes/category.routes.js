import express from "express";
import {
  createCategoryController,
  deleteCategoryController,
  getCategoriesController,
  updateCategoryController,
} from "../controllers/category.controller.js";
import authenticate from "../middlewares/authMiddleware.js";
import authorize from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.get("/", getCategoriesController);

router.post("/", authenticate, authorize("admin"), createCategoryController);

router.patch("/", authenticate, authorize("admin"), updateCategoryController);

router.delete("/", authenticate, authorize("admin"), deleteCategoryController);

export default router;
