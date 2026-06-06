import { z } from "zod";

export const createPurchaseOrderSchema = z.object({
  quotation_id: z.string().uuid("Invalid quotation ID"),
  tax_percentage: z.number().min(0, "Tax percentage cannot be negative").max(100, "Tax percentage cannot exceed 100").optional().default(0),
  remarks: z.string().optional(),
});

export const updatePurchaseOrderSchema = z.object({
  tax_percentage: z.number().min(0, "Tax percentage cannot be negative").max(100, "Tax percentage cannot exceed 100").optional(),
  remarks: z.string().optional(),
});
