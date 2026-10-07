import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import AppError from "../utils/AppError.js";
import { hashPassword } from "../utils/password.js";

const { DB_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

async function seedAdmin() {
  if (!DB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new AppError("Set DB_URL, ADMIN_EMAIL, ADMIN_PASSWORD in .env");
  }

  await mongoose.connect(DB_URI);

  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    console.log("an admin already exist nothing to do");

    return;
  }

  await User.create({
    name: ADMIN_NAME || "Admin",
    email: ADMIN_EMAIL,
    password: await hashPassword(ADMIN_PASSWORD),
    role: "admin",
    isVerified: true,
  });

  console.log(`Admin created`);
}

seedAdmin()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
