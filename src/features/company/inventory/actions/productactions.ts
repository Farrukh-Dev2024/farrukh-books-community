'use server'

import { prisma } from '../../../../lib/prisma'
import { z } from 'zod'
import { Product } from '@/types/prisma-types'
import { PrevState } from '@/types/project-types'
import { canManageProducts } from '@/lib/permissions/permissions'
import { createJournalEntry } from '@/features/company/accounts/journal/actions/journalactions'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'

// ✅ Zod Schema
const ProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  sellingPrice: z.coerce.number().nonnegative({ message: 'Selling price must be non-negative' }),
  costPrice: z.coerce.number().nonnegative({ message: 'Cost price must be non-negative' }),
  reorderLevel: z.coerce.number().optional(),
  stockQuantity: z.coerce.number().optional(),
  defaultLocation: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  isActive: z.preprocess((val) => String(val).toLowerCase() === 'true', z.boolean()).default(false),  //different from ui because string needs to be converted
})

/**
 * ✅ Create Product
 * If initial stock > 0, automatically posts:
 *  Inventory (Dr) / Owner’s Capital (Cr)
 */
export async function createProduct(prevState: PrevState, formData: FormData) {
  'use server'
  try {
    // // Step 1: Auth check
    // const session = await auth()
    // if (!session?.user)
    //   return { success: false, message: 'User not logged in', errors: {} }

    // // Step 2: Fetch DB user
    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb) return { success: false, message: 'Database user not found', errors: {} }
    if (!userdb.companyId){
      return { success: false, message: 'User does not belong to any company', errors: {} }
    }


    // Step 3: Permission check
    if (!canManageProducts(userdb, 'create'))
      return { success: false, message: 'Permission denied', errors: {} }

    // Step 4: Validation
    const parsed = ProductSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const { title, costPrice, stockQuantity = 0 } = parsed.data

    const result = await prisma.$transaction(async (tx) => {
        // Step 5: Create product
        if (!userdb.companyId){
        return { success: false, message: 'User does not belong to any company', errors: {} }
        }

        const product = await tx.product.create({
        data: {
            ...parsed.data,
            companyId: userdb.companyId,
        },
        })
        const today = new Date().toISOString().split('T')[0]

        const maxId = await tx.journal.aggregate({
        _max: { transactionId: true },
        })
        const nextTransactionId = (maxId._max.transactionId ?? 0) + 1


        // Step 6: Create initial stock journal (if applicable)
        if (stockQuantity > 0 && costPrice > 0) {
        const totalValue = costPrice * stockQuantity

        const inventoryAccount = await tx.account.findFirst({
            where: { companyId: userdb.companyId, title: 'Stock' },
        })
        const capitalAccount = await tx.account.findFirst({
            where: { companyId: userdb.companyId, title: "Owner’s Capital" },
        })

        if (!inventoryAccount || !capitalAccount) {
            console.error('Missing accounts for initial stock entry')
        } else {
            await createJournalEntry(
            [
                { accountId: inventoryAccount.id, side: true, amount: totalValue },
                { accountId: capitalAccount.id, side: false, amount: totalValue },
            ],
            today,
            `Initial stock entry ${product.title} x ${stockQuantity}`,
            {
                movementType: 'stock_initialization',
                createdById: userdb.id,
                transactionId: nextTransactionId,
            },
            tx          
            )
        }
        return { success: true, message: 'Product created successfully', errors: {} }
      }

      return { success: false, message: 'Product create failed', errors: {} }  

    })
    return result;

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return { success: false, message: 'Validation error', errors: error.flatten().fieldErrors }
    } else if (error instanceof Error) {
      console.error('Error creating product:', error.message)
      return { success: false, message: 'Error creating product', errors: { general: error.message } }
    }
  }
}

/**
 * ✅ Fetch all products for current user's company
 */
export async function getProducts() {
  'use server'
  // const session = await auth()
  // if (!session?.user) return []

  // const tmpform = new FormData()
  // tmpform.append('email', session.user.email || '')
  // const userdb = await getuser({}, tmpform)
  try {
    const userdb = await getAuthUserCompanyOrThrow();  
    if (!userdb?.companyId) return []

    if (!canManageProducts(userdb, 'read')) return []

    const products = await prisma.product.findMany({
      where: { companyId: userdb.companyId, isDeleted: false },
      include: { category: true },
      orderBy: { id: 'desc' },
    })

    const safeproducts: Product[] = products.map((p) => ({
      ...p,
      sellingPrice: Number(p.sellingPrice),
      costPrice: Number(p.costPrice),
      reorderLevel: Number(p.reorderLevel),
      stockQuantity: Number(p.stockQuantity),
    }))

    return safeproducts    
  } catch (error) {
    console.log("Error getProducts %O",error)
    return []
  }

}

/**
 * ✅ Update Product
 * If stockQuantity changes, posts corresponding journal entry:
 *  - Increased → Dr Stock / Cr Owner’s Capital
 *  - Decreased → Dr Owner’s Capital / Cr Stock
 */
export async function updateProduct(productId: number, formData: FormData) {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user)
    //   return { success: false, message: 'User not logged in', errors: {} }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId)
      return { success: false, message: 'Invalid user/company', errors: {} }

    if (!canManageProducts(userdb, 'update'))
      return { success: false, message: 'Permission denied', errors: {} }

    const data = ProductSchema.parse(Object.fromEntries(formData.entries()))
    const companyId = userdb.companyId

    await prisma.$transaction(async (tx) => {
      // Step 1: Fetch existing product
      const existing = await tx.product.findFirst({
        where: { id: productId, companyId },
      })
      if (!existing)
        throw new Error('Product not found')

      const oldQty = Number(existing.stockQuantity || 0)
      const newQty = Number(data.stockQuantity || 0)
      const diff = newQty - oldQty

      // Step 2: Update product itself
      await tx.product.update({
        where: { id: productId },
        data: { ...data, companyId },
      })

      // Step 3: If stock changed, post adjustment entry
      if (diff !== 0 && Number(existing.costPrice) > 0) {
        const today = new Date().toISOString().split('T')[0]
        const value = Math.abs(diff * Number(existing.costPrice))

        const maxId = await tx.journal.aggregate({
          _max: { transactionId: true },
        })
        const nextTransactionId = (maxId._max.transactionId ?? 0) + 1

        const inventoryAccount = await tx.account.findFirst({
          where: { companyId, title: 'Stock' },
        })
        const capitalAccount = await tx.account.findFirst({
          where: { companyId, title: "Owner’s Capital" },
        })

        if (!inventoryAccount || !capitalAccount)
          throw new Error('Required accounts not found: Stock or Owner’s Capital')

        if (diff > 0) {
          // Stock increased → Dr Stock / Cr Capital
          await createJournalEntry(
            [
              { accountId: inventoryAccount.id, side: true, amount: value },
              { accountId: capitalAccount.id, side: false, amount: value },
            ],
            today,
            `Stock increased for ${existing.title} (+${diff})`,
            {
              movementType: 'stock_adjustment_increase',
              createdById: userdb.id,
              transactionId: nextTransactionId,
            },
            tx
          )
        } else {
          // Stock decreased → Dr Capital / Cr Stock
          await createJournalEntry(
            [
              { accountId: capitalAccount.id, side: true, amount: value },
              { accountId: inventoryAccount.id, side: false, amount: value },
            ],
            today,
            `Stock decreased for ${existing.title} (${diff})`,
            {
              movementType: 'stock_adjustment_decrease',
              createdById: userdb.id,
              transactionId: nextTransactionId,
            },
            tx
          )
        }
      }
    })

    return { success: true, message: 'Product updated successfully', errors: {} }
  } catch (error) {
    console.error('Error updating product:', error)
    return {
      success: false,
      message: 'Error updating product',
      errors: { general: (error as Error).message },
    }
  }
}


/* ===========================================================
   Delete Product (soft delete) — if stock exists, reverse it:
   Dr Owner's Capital, Cr Stock (i.e. remove asset value)
   =========================================================== */
export async function deleteProduct(productId: number) {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'User not logged in', errors: {} }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb || !userdb.companyId) return { success: false, message: 'Invalid user/company', errors: {} }

    if (!canManageProducts(userdb, 'delete')) return { success: false, message: 'Permission denied', errors: {} }

    const companyId = userdb.companyId

    // fetch product to know stock quantity and title
    const product = await prisma.product.findFirst({ where: { id: productId, companyId } })
    if (!product) return { success: false, message: 'Product not found', errors: {} }

    // If no stock, just soft delete
    const stockQty = Number(product.stockQuantity || 0)
    if (stockQty <= 0) {
      await prisma.product.update({
        where: { id: productId, companyId },
        data: { isDeleted: true },
      })
      return { success: true, message: 'Product deleted (no stock)', errors: {} }
    }

    // Otherwise, create reversal journal and soft-delete inside a transaction
    await prisma.$transaction(async (tx) => {
      const today = new Date().toISOString().split('T')[0]
      // generate next transaction id using tx
      const maxId = await tx.journal.aggregate({ _max: { transactionId: true } })
      const nextTransactionId = (maxId._max.transactionId ?? 0) + 1

      // lookup accounts via tx
      const inventoryAccount = await tx.account.findFirst({ where: { companyId, title: 'Stock' } })
      const capitalAccount = await tx.account.findFirst({ where: { companyId, title: "Owner’s Capital" } })

      if (!inventoryAccount || !capitalAccount) {
        throw new Error('Required accounts not found for deletion reversal')
      }

      const totalValue = Number(product.costPrice || 0) * stockQty

      // Post reversal: Dr Owner's Capital, Cr Stock
      await createJournalEntry(
        [
          { accountId: capitalAccount.id, side: true, amount: totalValue }, // Debit Owner's Capital
          { accountId: inventoryAccount.id, side: false, amount: totalValue }, // Credit Stock
        ],
        today,
        `Product deletion - remove remaining stock for ${product.title} (qty: ${stockQty})`,
        {
          movementType: 'stock_deletion',
          createdById: userdb.id,
          transactionId: nextTransactionId,
        },
        tx
      )

      // Set product stock to zero and soft-delete
      await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: 0,
          isDeleted: true,
        },
      })
    })

    return { success: true, message: 'Product deleted and stock reversed', errors: {} }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { success: false, message: 'Error deleting product', errors: { general: (error as Error).message } }
  }
}