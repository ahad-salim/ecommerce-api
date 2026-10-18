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
import paymentRoutes from "./routes/payment.routes.js"
import adminOrderRoutes from "./routes/adminOrder.routes.js"
import reviewRoutes from "./routes/review.routes.js"

const app = express();

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use("/api/v1/auth", authRoutes)

app.use("/api/v1/users", userRoutes)

app.use("/api/v1/categories", categoryRoutes)

app.use("/api/v1/products/:id/reviews", reviewRoutes)

app.use("/api/v1/products", productRoutes)

app.use("/api/v1/cart", cartRoutes)

app.use("/api/v1/orders", orderRoutes)

app.use("/api/v1/admin/orders", adminOrderRoutes)

app.get("/api/v1/payments/result", (req, res) => {
    res.send("Payment recieved, you can close the page")
})
app.use("/api/v1/payments", paymentRoutes)



app.use(errorHandler)
export default app;