import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

const addCartItemSchema = z.object({
  productId: objectId,
  quantity: z.coerce.number().int().min(1).max(100),
});

const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(100),
});

export { addCartItemSchema, updateCartItemSchema };
