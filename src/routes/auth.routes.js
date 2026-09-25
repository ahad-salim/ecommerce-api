import express from "express"
import { registerUser } from "../controllers/auth.controller.js"
import { validate } from "../middlewares/validateMiddleware.js"
import { registerSchema } from "../validators/auth.validator.js"


const router = express.Router()

router.post('/register', validate(registerSchema), registerUser)


export default router