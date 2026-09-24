import express from "express"
import "dotenv/config"
import authRoutes from "./routes/auth.Routes.js"
import errorHandler from "./middlewares/errorHandler.js";


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRoutes)

app.use(errorHandler)
export default app;