import "dotenv/config"
import app from './src/app.js'
import connectToDB from "./src/config/db.js"

connectToDB()
const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})

