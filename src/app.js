import express from "express"
import "dotenv/config"
import authRoutes from "./routes/auth.routes.js"
import errorHandler from "./middlewares/errorHandler.js";
import userRoutes from "./routes/user.routes.js"


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRoutes)

app.use("/api/v1/users", userRoutes)

app.use(errorHandler)
export default app;