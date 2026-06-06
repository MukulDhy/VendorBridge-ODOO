import { z } from "zod";

export const createRFQSchema = z.object({
  rfq_title: z.string().min(3, "RFQ title must be at least 3 characters").max(255),
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1, "Item name is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unit: z.string().optional(),
      })
    )
    .min(1, "At least one item is required"),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format for deadline",
  }),
  attachments: z.array(z.string().url("Attachment must be a valid URL")).optional(),
  assigned_vendors: z.array(z.string()).optional(),
});
