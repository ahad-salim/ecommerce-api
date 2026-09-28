import mongoose from "mongoose";

const connectToDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Database connected to ${conn.connection.host}`);
    
  } catch (err) {
    console.log(err.message);
    process.exit(1)
  }
}
export default connectToDB