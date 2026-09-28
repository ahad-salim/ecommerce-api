import User from "../models/userModel.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import RefreshToken from "../models/refreshTokenModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../utils/jwt.js";

async function checkIfUserExist(email) {
  const user = await User.findOne({ email });

  return !!user;
}

async function registerNewUser({ name, email, password }) {
  const exist = await checkIfUserExist(email);

  if (exist) {
    return {
      success: false,
      message: "User already exists",
      error: ["USER_ALREADY_EXIST"],
    };
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

async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return {
      success: false,
      statusCode: 401,
      message: "Invalid email or password",
      error: ["INVALID_CREDENTIALS"],
    };
  }

  const passwordMatch = await comparePassword(password, user.password);

  if (!passwordMatch) {
    return {
      success: false,
      statusCode: 401,
      message: "Invalid email or password",
      error: ["INVALID_CREDENTIALS"],
    };
  }

  // if (!user.isVerified) {
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
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    },
  };
}

async function refreshUserToken(refreshToken) {
  if (!refreshToken) {
    return {
      success: false,
      statusCode: 401,
      message: "Refresh token is required",
      error: ["REFRESH_TOKEN_REQUIRED"],
    };
  }

  const tokenHash = hashRefreshToken(refreshToken);

  const storedToken = await RefreshToken.findOne({ tokenHash }).populate(
    "user",
  );

  if (!storedToken) {
    return {
      success: false,
      statusCode: 401,
      message: "Invalid refresh token",
      error: ["INVALID_REFRESH_TOKEN"],
    };
  }

  if (storedToken.revokedAt) {
    return {
      success: false,
      statusCode: 401,
      message: "This refresh token has been revoked",
      error: ["REFRESH_TOKEN_REVOKED"],
    };
  }

  if (storedToken.expiresAt <= new Date()) {
    return {
      success: false,
      statusCode: 401,
      message: "This refresh token has expired",
      error: ["REFRESH_TOKEN_EXPIRED"],
    };
  }

  const user = storedToken.user;

  if (!user) {
    return {
      success: false,
      statusCode: 401,
      message: "User no longer exist",
      error: ["USER_NO_LONGER EXIST"],
    };
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
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  };
}

async function logoutUser(refreshToken) {
  if (!refreshToken) {
    return {
      success: false,
      statusCode: 401,
      message: "Refresh token is required",
      error: ["REFRESH_TOKEN_REQUIRED"],
    };
  }

  const tokenHash = hashRefreshToken(refreshToken);

  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken) {
    return {
      success: true,
      statusCode: 200,
      message: "Logout successful",
    };
  }

  storedToken.revokedAt = new Date();

  await storedToken.save();

  return {
    success: true,
    message: "Logout successful",
  };
}

export {
  checkIfUserExist,
  registerNewUser,
  loginUser,
  refreshUserToken,
  logoutUser,
};
