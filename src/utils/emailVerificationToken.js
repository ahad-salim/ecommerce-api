import crypto from "crypto";

export const generateEmailVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  const hashToken = crypto.createHash("sha256").update(token).digest("hex");

  return {
    token,
    hashToken,
  };
};
