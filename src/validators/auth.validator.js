import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    // .min(8, "Password must be atleast 8 charaters")
    // .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    // .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    // .regex(/[0-9]/, "Password must contain at least one number")
    // .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
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
    ),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),

  password: z.string().min(8, "Password must be at least 8 characters"),
});

export { registerSchema, loginSchema };
