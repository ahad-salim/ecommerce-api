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

async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return {
      success: false,
      statusCode: 401,
      message: "Invalid email or password",
    };
  }

  const passwordMatch = await comparePassword(password, user.password);

  if (!passwordMatch) {
    return {
      success: false,
      statusCode: 401,
      message: "Invalid email or password",
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
    };
  }

  if (storedToken.revokedAt) {
    return {
      success: false,
      statusCode: 401,
      message: "Refresh token has been revoked",
    };
  }

  if (storedToken.expiresAt <= new Date()) {
    return {
      success: false,
      statusCode: 401,
      message: "refresh token has expired",
    };
  }

  const user = storedToken.user;

  if (!user) {
    return {
      success: false,
      statusCode: 401,
      message: "User no longer exist",
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

export { checkIfUserExist, registerNewUser, loginUser, refreshUserToken };
