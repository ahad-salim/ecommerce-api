import mongoose from "mongoose";

const connectToDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URI);
    console.log(`Database connected to ${conn.connection.host}`);
    
  } catch (err) {
    console.log("Dtabase connection failed",err.message);
    process.exit(1)
  }
}
export default connectToDB