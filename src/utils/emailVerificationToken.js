import crypto from "crypto";

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const generateEmailVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  return {
    token,
    hashToken: hashToken(token),
  };
};
