import User from "../models/userModel.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import RefreshToken from "../models/refreshTokenModel.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiryDate,
} from "../utils/jwt.js";
import AppError from "../utils/AppError.js";
import { generateEmailVerificationToken, hashToken } from "../utils/emailVerificationToken.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "./email.service.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const VERIFY_TTL_MS = 30 * 60 * 1000;
const RESET_TTL_MS = 15 * 60 * 1000;

const TOKEN_FORMAT = /^[a-f0-9]{64}$/;

const emailVerificationRequired = () =>
  process.env.REQUIRE_EMAIL_VERIFICATION !== "false";

const invalidCredentials = () =>
  new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

let dummyHash;
const getDummyHash = async () => {
  if (!dummyHash)
    dummyHash = await hashPassword(crypto.randomBytes(16).toString("hex"));
  return dummyHash;
};

async function checkIfUserExist(email) {
  const user = await User.findOne({ email });

  return !!user;
}

async function revokeAllUserTokens(userId) {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { revokedAt: new Date() },
  );
}

async function issueRefreshToken(userId) {
  const refreshToken = generateRefreshToken();

  await RefreshToken.create({
    user: userId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: refreshTokenExpiryDate(),
  });

  return refreshToken;
}

async function registerNewUser({ name, email, password }) {
  const exist = await checkIfUserExist(email);

  if (exist) {
    throw new AppError("User already exists", 409, "USER_ALREADY_EXIST");
  }

  const needsVerification = emailVerificationRequired();
  const { token, hashToken: tokenHash } = generateEmailVerificationToken();

  const newUser = await User.create({
    name,
    email,
    password: await hashPassword(password),
    isVerified: !needsVerification,
    ...(needsVerification && {
      emailVerificationToken: tokenHash,
      emailVerificationExpires: new Date(Date.now() + VERIFY_TTL_MS),
    }),
  });

  if (needsVerification) {
    try {
      await sendVerificationEmail(newUser.email, token);
    } catch (err) {
      console.error
      (
        { userId: String(newUser._id), err: err.message },
        "Verification email failed",
      );
    }
  }

  return {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };
}

async function verifyEmail(token) {
  if (typeof token !== "string" || !TOKEN_FORMAT.test(token)) {
    throw new AppError("Invalid or expired token", 400, "INVALID_TOKEN");
  }

  // One atomic step: find the user AND consume the token, so it works only once
  const user = await User.findOneAndUpdate(
    {
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    },
    {
      isVerified: true,
      $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
    },
    { returnDocument: "after" },
  );

  if (!user) {
    throw new AppError("Invalid or expired token", 400, "INVALID_TOKEN");
  }
}

// Always answers the same way, whether or not the email exists
async function resendVerificationEmail(email) {
  const user = await User.findOne({ email, isVerified: false, isActive: true });

  if (!user) return;

  const { token, hashToken: tokenHash } = generateEmailVerificationToken();

  await User.updateOne(
    { _id: user._id },
    {
      emailVerificationToken: tokenHash,
      emailVerificationExpires: new Date(Date.now() + VERIFY_TTL_MS),
    },
  );

  try {
    await sendVerificationEmail(user.email, token);
  } catch (err) {
    console.error(
      { userId: String(user._id), err: err.message },
      "Verification email failed",
    );
  }
}

async function registerFailedLogin(userId) {
  const updated = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { failedLoginAttempts: 1 } },
    { returnDocument: "after" },
  );

  if (updated && updated.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    await User.updateOne(
      { _id: userId },
      {
        failedLoginAttempts: 0,
        lockUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000),
      },
    );
  }
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    await comparePassword(password, await getDummyHash());
    throw invalidCredentials();
  }

  const locked = Boolean(user.lockUntil && user.lockUntil > new Date());

  const passwordMatch = await comparePassword(password, user.password);

  if (locked || !passwordMatch || !user.isActive) {
    if (!locked && !passwordMatch) await registerFailedLogin(user._id);

    throw invalidCredentials();
  }

  if (user.failedLoginAttempts || user.lockUntil) {
    await User.updateOne(
      { _id: user._id },
      { failedLoginAttempts: 0, lockUntil: null },
    );
  }

  if (emailVerificationRequired() && !user.isVerified) {
    throw new AppError(
      "Please verify your email before logging in",
      403,
      "EMAIL_NOT_VERIFIED",
    );
  }

  const accessToken = generateAccessToken(user);

  const refreshToken = await issueRefreshToken(user._id);

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
    throw new AppError(
      "Refresh token is required",
      401,
      "REFRESH_TOKEN_REQUIRED",
    );
  }

  const tokenHash = hashRefreshToken(refreshToken);

  const storedToken = await RefreshToken.findOne({ tokenHash }).populate(
    "user",
  );

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }

  if (storedToken.revokedAt) {
    if (storedToken.user?._id) {
      await revokeAllUserTokens(storedToken.user._id);
    }
    throw new AppError(
      "This refresh token has been revoked",
      401,
      "REFRESH_TOKEN_REVOKED",
    );
  }

  if (storedToken.expiresAt <= new Date()) {
    throw new AppError("This token has expired", 401, "REFRESH_TOKEN_EXPIRED");
  }

  const user = storedToken.user;

  if (!user || !user.isActive) {
    if (user) await revokeAllUserTokens(user._id);
    throw new AppError("User no longer exist", 401, "USER_NO_LONGER_EXIST");
  }

  const claimed = await RefreshToken.findByIdAndUpdate(
    { _id: storedToken._id, revokedAt: null },
    { revokedAt: new Date() },
  );

  if (!claimed) {
    await revokeAllUserTokens(user._id);

    throw new AppError(
      "This refresh token has been revoked",
      401,
      "REFRESH_TOKEN_REVOKED",
    );
  }

  return {
    accessToken: generateAccessToken(user),
    refreshToken: await issueRefreshToken(user._id),
  };
}

async function logoutUser(refreshToken) {
  if (!refreshToken) return;

  await RefreshToken.updateOne(
    { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    { revokedAt: new Date() },
  );
}

async function forgotPassword(email) {
  const user = await User.findOne({ email, isActive: true });

  if (!user) return;

  const { token, hashToken: tokenHash } = generateEmailVerificationToken();

  await User.updateOne(
    { _id: user._id },
    {
      passwordResetToken: tokenHash,
      passwordResetExpires: new Date(Date.now() + RESET_TTL_MS),
    },
  );

  sendPasswordResetEmail(user.email, token).catch((err) =>
    console.error(
      { userId: String(user._id), err: err.message },
      "Reset email failed",
    ),
  );
}

async function resetPassword(token, newPassword) {
  if (typeof token !== "string" || !TOKEN_FORMAT.test(token)) {
    throw new AppError("Invalid or expired token", 400, "INVALID_TOKEN");
  }

  const user = await User.findOneAndUpdate(
    {
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    },
    { $unset: { passwordResetToken: 1, passwordResetExpires: 1 } },
    { returnDocument: "after" },
  );

  if (!user) {
    throw new AppError("Invalid or expired token", 400, "INVALID_TOKEN");
  }

  await User.updateOne(
    { _id: user._id },
    {
      password: await hashPassword(newPassword),
      failedLoginAttempts: 0,
      lockUntil: null,
    },
  );

  await revokeAllUserTokens(user._id);
}

export {
  checkIfUserExist,
  registerNewUser,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  refreshUserToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  revokeAllUserTokens,
};
