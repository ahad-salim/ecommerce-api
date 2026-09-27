import express from "express"
import authenticate from "../middlewares/authMiddleware.js"
import { getCurrentUser } from "../controllers/user.controller.js"


const router = express.Router()

router.use("/me", authenticate, getCurrentUser)

export default router