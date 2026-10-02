import User from "../models/userModel.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import RefreshToken from "../models/refreshTokenModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../utils/jwt.js";
import AppError from "../utils/AppError.js";

async function checkIfUserExist(email) {
  const user = await User.findOne({ email });

  return !!user;
}

async function registerNewUser({ name, email, password }) {
  const exist = await checkIfUserExist(email);

  if (exist) {
    throw new AppError("User already exists", 409, "USER_ALREADY_EXIST")
    // return {
    //   success: false,
    //   message: "User already exists",
    //   error: ["USER_ALREADY_EXIST"],
    // };
  }

  // const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await User.create({
    name,
    email,
    password: await hashPassword(password),
  });

  return {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
  };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS")
    // return {
    //   success: false,
    //   statusCode: 401,
    //   message: "Invalid email or password",
    //   error: ["INVALID_CREDENTIALS"],
    // };
  }

  const passwordMatch = await comparePassword(password, user.password);

  if (!passwordMatch) {
   throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS")
    // return {
    //   success: false,
    //   statusCode: 401,
    //   message: "Invalid email or password",
    //   error: ["INVALID_CREDENTIALS"],
    // }
  }

  // if (!user.isVerified) {
  //throw new AppError("Please verify your email before logging in", 403, "INVALID_EMAIL")
  //   return {
  //     success: false,
  //     statusCode: 403,
  //     message: "Please verify your email before logging in",
  //   };
  // }

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken();

  const tokenHash = hashRefreshToken(refreshToken);

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7),
  );

  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
  });

  return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
  };
}

async function refreshUserToken(refreshToken) {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401, "REFRESH_TOKEN_REQUIRED")
    // return {
    //   success: false,
    //   statusCode: 401,
    //   message: "Refresh token is required",
    //   error: ["REFRESH_TOKEN_REQUIRED"],
    // };
  }

  const tokenHash = hashRefreshToken(refreshToken);

  const storedToken = await RefreshToken.findOne({ tokenHash }).populate(
    "user",
  );

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN")
    // return {
    //   success: false,
    //   statusCode: 401,
    //   message: "Invalid refresh token",
    //   error: ["INVALID_REFRESH_TOKEN"],
    // };
  }

  if (storedToken.revokedAt) {
    const userId = storedToken.user?._id;
    if (userId) {
      await RefreshToken.updateMany(
        { user: userId, revokedAt: null },
        { revokedAt: new Date() },
      );
    }
    throw new AppError("This refresh token has been revoked", 401, "REFRESH_TOKEN_REVOKED")
    // return {
      // success: false,
      // statusCode: 401,
      // message: "This refresh token has been revoked",
      // error: ["REFRESH_TOKEN_REVOKED"],
    // };
  }

  if (storedToken.expiresAt <= new Date()) {
    throw new AppError("This token has expired", 401, "REFRESH_TOKEN_EXPIRED")
    // return {
    //   success: false,
    //   statusCode: 401,
    //   message: "This refresh token has expired",
    //   error: ["REFRESH_TOKEN_EXPIRED"],
    // };
  }

  const user = storedToken.user;

  if (!user) {
    throw new AppError("User no longer exist", 401, "USER_NO_LONGER_EXIST")
    // return {
    //   success: false,
    //   statusCode: 401,
    //   message: "User no longer exist",
    //   error: ["USER_NO_LONGER_EXIST"],
    // };
  }

  storedToken.revokedAt = new Date();
  await storedToken.save();

  const newAccessToken = generateAccessToken(user);

  const newRefreshToken = generateRefreshToken();

  const newTokenHash = hashRefreshToken(newRefreshToken);

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7),
  );

  await RefreshToken.create({
    user: user._id,
    tokenHash: newTokenHash,
    expiresAt,
  });

  return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
  };
}

async function logoutUser(refreshToken) {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401, "REFRESH_TOKEN_REQUIRED")
    // return {
    //   success: false,
    //   statusCode: 401,
    //   message: "Refresh token is required",
    //   error: ["REFRESH_TOKEN_REQUIRED"],
    // };
  }

  const tokenHash = hashRefreshToken(refreshToken);

  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken)
    return;

  storedToken.revokedAt = new Date();

  await storedToken.save();

  // return {
  //   success: true,
  //   message: "Logout successful",
  // };
}

export {
  checkIfUserExist,
  registerNewUser,
  loginUser,
  refreshUserToken,
  logoutUser,
};
