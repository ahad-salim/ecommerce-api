import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_ALGORITHM = "HS256";

const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 7);
const refreshTokenMaxAgeMs = () => REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;
const refreshTokenExpiryDate = () => new Date(Date.now() + refreshTokenMaxAgeMs());

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      algorithm: ACCESS_ALGORITHM,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    },
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    algorithms: [ACCESS_ALGORITHM],
  });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenMaxAgeMs,
  refreshTokenExpiryDate,
};
