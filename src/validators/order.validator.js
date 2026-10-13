import { z } from "zod";
import { ORDER_STATUSES } from "../utils/orderStatus.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

const text = (label, max) =>
  z.string().trim().min(1, `${label} is required`).max(max);

const createOrderSchema = z.object({
  shippingAddress: z.object({
    street: text("Street", 200),
    city: text("City", 100),
    country: text("Country", 100),
    postalCode: z.string().trim().max(20).optional(),
  }),
  // No items, prices or totals here on purpose: everything comes from the cart + DB
});

const pagination = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
};

const orderQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  ...pagination,
});

const adminOrderQuerySchema = z
  .object({
    status: z.enum(ORDER_STATUSES).optional(),
    user: objectId.optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    ...pagination,
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "from cannot be after to",
    path: ["from"],
  });

// Admins may only drive FULFILMENT. paid/failed come from the payment webhook,
// cancelled from the cancel endpoint, refunded from the refund endpoint.
const updateOrderStatusSchema = z.object({
  status: z.enum(["processing", "shipped", "delivered"]),
});

export {
  createOrderSchema,
  orderQuerySchema,
  adminOrderQuerySchema,
  updateOrderStatusSchema,
};
