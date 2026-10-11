import { z } from "zod";

const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name cannot exceed 150 characters"),

  price: z
    .number()
    .int("Price must be a whole number")
    .nonnegative("Price cannot be negative"),

  stock: z
    .number()
    .int("Stock must be a whole number")
    .nonnegative("Stock cannot be negative"),

  category: z.string().regex(/^[a-f\d]{24}$/i, "Invalid category ID"),
});

const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(150, "Product name cannot exceed 150 characters")
    .optional(),

  price: z
    .number()
    .int("Price must be a whole number")
    .nonnegative("Price cannot be negative")
    .optional(),

  stock: z
    .number()
    .int("Stock must be a whole number")
    .nonnegative("Stock cannot be negative")
    .optional(),

  category: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid category ID")
    .optional(),
});

const productQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),

    category: z.string().optional(),

    minPrice: z.coerce.number().int().nonnegative().optional(),

    maxPrice: z.coerce.number().int().nonnegative().optional(),

    sort: z.string().max(100).optional(),

    page: z.coerce.number().int().positive().default(1),

    limit: z.coerce.number().int().positive().max(100).default(10),
  })
  .refine(
    (q) =>
      q.minPrice === undefined ||
      q.maxPrice === undefined ||
      q.minPrice <= q.maxPrice,
    { message: "minPrice cannot be greater than maxPrice", path: ["minPrice"] },
  );

const productIdSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
});

export {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdSchema,
};
