import { refreshTokenMaxAgeMs } from "./jwt.js";

const BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/v1/auth",
};

export const refreshCookieOptions = () => ({
  ...BASE,
  secure: process.env.NODE_ENV === "production",
  maxAge: refreshTokenMaxAgeMs(),
});

export const clearCookieOptions = () => ({
  ...BASE,
  secure: process.env.NODE_ENV === "production",
});
