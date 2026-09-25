import User from "../models/userModel.js";
import { hashPassword } from "../utils/password.js";
// import bcrypt from 'bcrypt'

async function checkIfUserExist(email) {
  const user = await User.findOne({ email });

  return !!user;
}

async function registerNewUser({ name, email, password }) {

  // if (password.length < 8) {
  //   return {
  //     success: false,
  //     message: "Password must be at least 8 characters",
  //   };
  // }
  const exist = await checkIfUserExist(email);

  if (exist) {
    return { success: false, message: "User already exists" };
  }


  // const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await User.create({
    name,
    email,
    password: await hashPassword(password),
  });

  return {
    success: true,
    data: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  };
}

export { checkIfUserExist, registerNewUser };
