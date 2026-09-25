import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your email",
    html: `
        <h2>Verify your email</h2>
        
        <p> Please click the button below to verify your email address. </p>
        
        <a href="${verificationUrl}">Verify Email</a>
        
        <p> This link would expire in 30 minutes.</p>
        `,
  });
};
