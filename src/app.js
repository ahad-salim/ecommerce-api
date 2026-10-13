import express from "express"
import "dotenv/config"
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js"
import errorHandler from "./middlewares/errorHandler.js";
import userRoutes from "./routes/user.routes.js"
import categoryRoutes from "./routes/category.routes.js"
import productRoutes from "./routes/product.routes.js"
import cartRoutes from "./routes/cart.routes.js"
import orderRoutes from "./routes/order.routes.js"


const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use("/api/v1/auth", authRoutes)

app.use("/api/v1/users", userRoutes)

app.use("/api/v1/categories", categoryRoutes)

app.use("/api/v1/products", productRoutes)

app.use("/api/v1/cart", cartRoutes)

app.use("/api/v1/orders", orderRoutes)

app.use(errorHandler)
export default app;