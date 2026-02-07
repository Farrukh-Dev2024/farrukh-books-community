// src/features/payroll/employeepayitems/schemas/employeePayItemSchemas.ts
import { z } from "zod";

/**
 * Schemas for assigning pay items to employees
 */

export const assignEmployeePayItemSchema = z.object({
  employeeId: z.number().int().positive(),
  payItemId: z.number().int().positive(),
  // optional: if null, server will fall back to PayItem.defaultAmount
  amount: z
    .union([z.number().nonnegative(), z.string().min(1)])
    .optional()
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .nullable(),
  isPercentage: z.boolean().optional().default(false),
});

export const updateEmployeePayItemSchema = assignEmployeePayItemSchema.extend({
  id: z.number().int().positive(),
});
