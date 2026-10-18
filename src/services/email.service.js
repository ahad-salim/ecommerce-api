import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
};

const appUrl = () =>
  process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${appUrl()}/api/v1/auth/verify-email/${token}`;

  await getTransporter().sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Verify your email</h2>
      <p>Please click the link below to verify your email address.</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 30 minutes.</p>
    `,
  });
};

export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL || appUrl()}/reset-password/${token}`;

  await getTransporter().sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset your password",
    html: `
      <h2>Reset your password</h2>
      <p>Use the link below, or send this token to <code>POST /api/v1/auth/reset-password/:token</code> with your new password.</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>Token: <code>${token}</code></p>
      <p>This link expires in 15 minutes. If you did not ask for this, ignore this email.</p>
    `,
  });
};
