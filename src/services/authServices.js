import User from "../models/userModel.js";
import bcrypt from 'bcrypt'

async function checkIfUserExist(email) {
  const user = await User.findOne({ email });

  return !!user;
}

async function registerNewUser({ name, email, password }) {
  const exist = await checkIfUserExist(email);

  if (exist) {
    return { success: false, message: "User already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  return {
    success: true,
    data: { name, email, password: hashedPassword, role },
  };
}


export { checkIfUserExist, registerNewUser }