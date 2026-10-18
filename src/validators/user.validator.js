import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

// Only `name` can be edited. email, role, isVerified, password are NOT editable here.
const updateMeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .refine((v) => v.split(/\s+/).length >= 2, {
        message: "Please enter at least two names (e.g. John Doe)",
      }),
  })
  .strict();

const updateRoleSchema = z.object({ role: z.enum(["customer", "admin"]) }).strict();

const userQuerySchema = z.object({
  role: z.enum(["customer", "admin"]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export { objectId, updateMeSchema, updateRoleSchema, userQuerySchema };
