// src/features/company/purchases/purchaseorders/schemas/purchaseschemas.ts
import { z } from 'zod'

// ─────────────────────────────────────────────
// Zod schema for purchase order validation
// ─────────────────────────────────────────────
export const PurchaseOrderSchema = z.object({
  id: z.string().optional(),

  vendorId: z
    .string()
    .min(1, 'Vendor is required'),

  dueDate: z
    .string()
    .optional()
    .nullable(),

  totalAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount')
    .transform((val) => val || '0'),

  orderStatus: z
    .enum(['DRAFT', 'OPEN', 'INVOICED', 'PAID', 'CANCELED'])
    .default('DRAFT'),

  discountAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid discount')
    .transform((val) => val || '0'),
  orderComments: z.string().optional().nullable(),
  paidAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount')
    .transform((val) => val || '0'),
  // 🧾 Items array (each line of the order)
  items: z.array(
    z.object({
      id: z.number().optional(), // may not exist during creation
      purchaseOrderId: z.number().optional(), // handled internally by backend

      productId: z.coerce.number().min(1, 'Product is required'),

      quantity: z.coerce.number().min(0.0001, 'Quantity is required'),

      unitCost: z.coerce.number().min(0, 'Unit cost is required'),

      totalCost: z.coerce.number().min(0, 'Total cost is required'),

      discountAmount: z.coerce.number().default(0),
    })
  )
    .min(1, 'At least one item is required'),
})
