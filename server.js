import "dotenv/config"
import app from './src/app.js'
import connectToDB from "./src/config/db.js"
import { startExpiryJob } from "./src/jobs/expirePendingOrders.js"

const PORT = process.env.PORT || 8080

await connectToDB()
startExpiryJob()

app.listen(PORT, () => {
    console.log(`Server is running on ${process.env.APP_URL} and http://localhost:${PORT}`)
})

