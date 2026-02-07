// src/features/company/payroll/payitem/schemas/payitem.ts
import { z } from "zod";

export const PayItemSchema = z.object({
  title: z.string().min(2, "Title is required"),
  type: z.string(),   // was z.enum(["ALLOWANCE", "DEDUCTION"])
  mode: z.string(),   // was z.enum(["FIXED", "PERCENTAGE"])
  defaultAmount: z.coerce.number().min(0, "Amount must be non-negative"),
});

export type PayItemInput = z.infer<typeof PayItemSchema>;
