import express from "express"
import "dotenv/config"
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js"
import errorHandler from "./middlewares/errorHandler.js";
import userRoutes from "./routes/user.routes.js"
import categoryRoutes from "./routes/category.routes.js"


const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use("/api/v1/auth", authRoutes)

app.use("/api/v1/users", userRoutes)

app.use("/api/v1/categories", categoryRoutes)

app.use(errorHandler)
export default app;