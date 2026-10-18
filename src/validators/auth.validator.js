import { z } from "zod";

const email = z.string().email("Invalid email address").trim().toLowerCase();

// at least 8 characters with upper case, lower case, a number and a symbol
const strongPassword = z
  .string()
  .max(128, "Password is too long")
  .refine(
    (password) =>
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password),
    {
      message:
        "Please choose a stronger password. try a mix of letters, numbers and symbols",
    },
  );

// same rule as the User model: at least two names
const fullName = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .refine((v) => v.split(/\s+/).length >= 2, {
    message: "Please enter at least two names (e.g. John Doe)",
  });

const registerSchema = z.object({
  name: fullName,
  email,
  password: strongPassword,
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
});

const forgotPasswordSchema = z.object({ email });

const resetPasswordSchema = z.object({ password: strongPassword });

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: strongPassword,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "The new password must be different from the current one",
    path: ["newPassword"],
  });

export {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  strongPassword,
};
