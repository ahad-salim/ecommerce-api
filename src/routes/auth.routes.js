import express from "express"
import { registerUser } from "../controllers/register.Controller.js"


const router = express.Router()

router.post('/register',registerUser)


export default router