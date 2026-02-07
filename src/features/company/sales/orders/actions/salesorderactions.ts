'use server'

import { PrevState } from '@/types/project-types'

import { canManageSales } from '@/lib/permissions/permissions'
import { createJournalEntry } from '@/features/company/accounts/journal/actions/journalactions'
import { } from '@/types/prisma-types'

import { Account, Prisma, PrismaClient, SalesOrder, SalesOrderItem, User } from '@/generated/prisma/client'
import { prisma } from '../../../../../lib/prisma'
import { FcPaid } from 'react-icons/fc'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'

/**
 * Generate next order number like SO-0001, SO-0002, etc.
 */
async function generateOrderNumber(companyId: number): Promise<string> {
  const lastOrder = await prisma.salesOrder.findFirst({
    where: { companyId },
    orderBy: { id: 'desc' },
  })

  const lastNumber = lastOrder?.orderNumber?.split('-')[1]
  const next = lastNumber ? parseInt(lastNumber) + 1 : 1
  return `SO-${next.toString().padStart(4, '0')}`
}

/**
 * Create Sales Order with items
 */
export async function createSalesOrder(prevState: PrevState, formData: FormData): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'Not logged in' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)
    // if (!userdb?.companyId) return { success: false, message: 'User has no company' }

    const userdb = await getAuthUserCompanyOrThrow();
    if (!canManageSales(userdb, 'create')) return { success: false, message: 'Permission denied' }

    const companyId = userdb.companyId
    const customerId = Number(formData.get('customerId'))
    const totalDiscount = parseFloat(formData.get('discountAmount') as string) || 0
    const totalAmount = parseFloat(formData.get('totalAmount') as string)
    const paidAmount = parseFloat(formData.get('paidAmount') as string) || 0
    const dueDate = formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : null
    const itemsJson = formData.get('items') as string
    const orderStatus = (formData.get('orderStatus') as string)?.toUpperCase()
    const orderComments = formData.get('orderComments') as string || ''

    if (!customerId || !itemsJson)
      return { success: false, message: 'Missing customer or items', errors: {} }

    const items = JSON.parse(itemsJson)
    if (!Array.isArray(items) || items.length === 0)
      return { success: false, message: 'At least one item is required', errors: {} }

    const today = new Date().toISOString().split('T')[0]


    await prisma.$transaction(async (tx) => {
      if (!companyId) {throw new Error("User does not belong to any company");}
      const orderNumber = await generateOrderNumber(companyId)
      const maxId = await tx.journal.aggregate({
        _max: { transactionId: true },
      })
      const nextTransactionId = (maxId._max.transactionId ?? 0) + 1

      // 1️⃣ Create order
      const order = await tx.salesOrder.create({
        data: {
          companyId,
          customerId,
          orderNumber,
          transactionId: nextTransactionId,
          totalAmount: new Prisma.Decimal(totalAmount),
          paidAmount: new Prisma.Decimal(paidAmount),
          discountAmount: new Prisma.Decimal(totalDiscount),
          dueDate,
          createdById: userdb.id,
          updatedById: userdb.id,
          orderStatus,
          orderComments,
        },
      })

      // 2️⃣ Create items
      for (const item of items) {
        await tx.salesOrderItem.create({
          data: {
            companyId,
            salesOrderId: order.id,
            productId: item.productId,
            transactionId: nextTransactionId,
            quantity: new Prisma.Decimal(item.quantity),
            unitPrice: new Prisma.Decimal(item.unitPrice),
            totalPrice: new Prisma.Decimal(item.totalPrice),
            discountAmount: new Prisma.Decimal(item.discountAmount || 0),
          },
        })
      }

      // 3️⃣ If invoiced or paid — post accounting entries and stock updates
      if (orderStatus === 'INVOICED' || orderStatus === 'PAID') {
        // compute COGS
        let totalCOGS = 0
        for (const i of items) {
          const tmpproduct = await tx.product.findFirst({ where: { id: i.productId } })
          if (!tmpproduct) throw new Error(`Product not found for ID ${i.productId}`)
          totalCOGS += Number(tmpproduct.costPrice || 0) * i.quantity
        }

        const receivable = await tx.account.findFirst({ where: { title: 'Accounts Receivable', companyId } })
        const customer = await tx.customer.findFirst({ where: { id: customerId, companyId } })
        let receivablesubaccount = null; if (customer) { receivablesubaccount = await tx.account.findFirst({ where: { id: customer.accountId1!, companyId } }) }
        let receivablecontrasubaccount = null; if (customer) { receivablecontrasubaccount = await tx.account.findFirst({ where: { id: customer.accountId2!, companyId } }) }

        const sales = await tx.account.findFirst({ where: { title: 'Sales Revenue', companyId } })
        const cogs = await tx.account.findFirst({ where: { title: 'Cost of Goods Sold', companyId } })
        const inventory = await tx.account.findFirst({ where: { title: 'Stock', companyId } })
        const cash = await tx.account.findFirst({ where: { title: 'Cash', companyId } })
        const salesDiscount = await tx.account.findFirst({ where: { title: 'Sales Discounts', companyId } })

        if (!receivable || !receivablesubaccount || !receivablecontrasubaccount || !sales || !cogs || !inventory || !cash) {
          throw new Error('Required accounts not found')
        }


        // net sales = receivable to post (net of discounts)
        const netSalesAmount = totalAmount - totalDiscount
        const netPaidAmount = paidAmount;

        // A. Sales entry (Dr AR net, Cr Sales gross)
        await createJournalEntry(
          [
            { accountId: receivable.id, side: true, amount: netSalesAmount }, // Debit Receivable (net)
            { accountId: sales.id, side: false, amount: totalAmount }, // Credit Sales (gross)

            { accountId: receivablesubaccount.id, side: true, amount: netSalesAmount }, // Debit sub AR (net)
            { accountId: receivablecontrasubaccount.id, side: false, amount: netSalesAmount }, // Credit contra AR (net)
          ],
          today,
          `Sales invoice ${orderNumber} ${customer ? ' to ' + customer.name : ''}`,
          {
            movementType: 'sale',
            createdById: userdb.id,
            transactionId: nextTransactionId,
          },
          tx
        )

        // B. Sales Discount (if any): Dr SalesDiscount, Cr AR (to reduce receivable)
        if (totalDiscount > 0 && salesDiscount) {
          await createJournalEntry(
            [
              { accountId: salesDiscount.id, side: true, amount: totalDiscount }, // Debit SalesDiscount
              { accountId: receivable.id, side: false, amount: totalDiscount }, // Credit AR (reduce)

              { accountId: receivablecontrasubaccount.id, side: true, amount: totalDiscount }, // Debit contra AR (increase)
              { accountId: receivablesubaccount.id, side: false, amount: totalDiscount }, // Credit sub AR (reduce)
            ],
            today,
            `Sales discount on invoice ${orderNumber} ${customer ? ' to ' + customer.name : ''}`,
            {
              movementType: 'discount',
              createdById: userdb.id,
              transactionId: nextTransactionId,
            },
            tx
          )
        }

        // C. COGS entry
        await createJournalEntry(
          [
            { accountId: cogs.id, side: true, amount: totalCOGS }, // Debit COGS
            { accountId: inventory.id, side: false, amount: totalCOGS }, // Credit Inventory
          ],
          today,
          `COGS for ${orderNumber} ${customer ? ' to ' + customer.name : ''}`,
          {
            movementType: 'sale',
            createdById: userdb.id,
            transactionId: nextTransactionId,
          },
          tx
        )

        // D. Reduce stock quantities
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { decrement: item.quantity } },
          })
        }

        // E. If paid → record payment (Cash receipts for net)
        if (orderStatus === 'PAID') {
          await createJournalEntry(
            [
              { accountId: cash.id, side: true, amount: netPaidAmount }, // Debit Cash
              { accountId: receivable.id, side: false, amount: netPaidAmount }, // Credit AR

              { accountId: receivablecontrasubaccount.id, side: true, amount: netPaidAmount }, // Debit contra sub AR
              { accountId: receivablesubaccount.id, side: false, amount: netPaidAmount }, // Credit sub AR

            ],
            today,
            `Payment received for ${orderNumber} ${customer ? ' to ' + customer.name : ''}`,
            {
              movementType: 'sale',
              createdById: userdb.id,
              transactionId: nextTransactionId,
            },
            tx
          )
        }
      }
    })

    return { success: true, message: 'Sales order created successfully', errors: {} }
  } catch (error) {
    console.error('Error creating sales order:', error)
    return { success: false, message: 'Failed to create sales order', errors: {} }
  }
}

/**
 * Delete Sales Order (handles reversal)
 */
export async function deleteSalesOrder(id: number): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'Not logged in' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)
    // if (!userdb?.companyId) return { success: false, message: 'User has no company' }

    const userdb = await getAuthUserCompanyOrThrow();
    if (!canManageSales(userdb, 'delete')) return { success: false, message: 'Permission denied' }

    const companyId = userdb.companyId


    await prisma.$transaction(async (tx) => {
      if (!companyId) {throw new Error("User does not belong to any company");}

      const order = await tx.salesOrder.findFirst({
        where: { id, companyId },
        include: { items: true },
      })
      if (!order) return { success: false, message: 'Sales order not found' }

      // Soft delete for non-posted orders
      if (['DRAFT', 'OPEN', 'CANCELED'].includes(order.orderStatus.toUpperCase())) {
        await tx.salesOrder.update({
          where: { id },
          data: { isDeleted: true },
        })
        return { success: true, message: 'Sales order soft-deleted', errors: {} }
      }

      // For INVOICED / PAID -> reverse related accounting & restore stock
      const today = new Date().toISOString().split('T')[0]
      const maxId = await tx.journal.aggregate({
        _max: { transactionId: true },
      })
      const nextTransactionId = (maxId._max.transactionId ?? 0) + 1


      // lookup accounts (to ensure they exist)
      const receivable = await tx.account.findFirst({ where: { title: 'Accounts Receivable', companyId } })
      const customer = await tx.customer.findFirst({ where: { id: order.customerId, companyId } })
      let receivablesubaccount = null; if (customer) { receivablesubaccount = await tx.account.findFirst({ where: { id: customer.accountId1!, companyId } }) }
      let receivablecontrasubaccount = null; if (customer) { receivablecontrasubaccount = await tx.account.findFirst({ where: { id: customer.accountId2!, companyId } }) }

      const sales = await tx.account.findFirst({ where: { title: 'Sales Revenue', companyId } })
      const cogs = await tx.account.findFirst({ where: { title: 'Cost of Goods Sold', companyId } })
      const inventory = await tx.account.findFirst({ where: { title: 'Stock', companyId } })
      const cash = await tx.account.findFirst({ where: { title: 'Cash', companyId } })
      const salesDiscount = await tx.account.findFirst({ where: { title: 'Sales Discounts', companyId } })

      if (!receivable || !receivablesubaccount || !receivablecontrasubaccount || !sales || !cogs || !inventory || !cash)
        throw new Error('Required accounts not found for reversal')

      // total COGS for items
      let totalCOGS = 0
      for (const i of order.items) {
        const product = await tx.product.findFirst({ where: { id: i.productId } })
        if (product) totalCOGS += Number(product.costPrice || 0) * Number(i.quantity)
      }

      const totalAmount = Number(order.totalAmount)
      const totalDiscount = Number(order.discountAmount || 0)
      const netSalesAmount = totalAmount - totalDiscount

      // 1️⃣ Reverse Sales Entry: Debit Sales, Credit AR (for net or gross logic)
      await createJournalEntry(
        [
          { accountId: sales.id, side: true, amount: totalAmount }, // Debit Sales
          { accountId: receivable.id, side: false, amount: netSalesAmount }, // Credit AR (reverse net receivable)

          { accountId: receivablecontrasubaccount.id, side: true, amount: netSalesAmount }, // Debit contra sub AR (reverse net receivable)
          { accountId: receivablesubaccount.id, side: false, amount: netSalesAmount }, // Credit sub AR (reverse net receivable)
        ],
        today,
        `Reversal of sales for ${order.orderNumber} ${customer ? ' to ' + customer.name : ''}`,
        {
          movementType: 'reversal',
          createdById: userdb.id,
          transactionId: nextTransactionId,
        },
        tx
      )

      // 2️⃣ Reverse Discount (if any): Debit AR, Credit SalesDiscount
      if (totalDiscount > 0 && salesDiscount) {
        await createJournalEntry(
          [
            { accountId: receivable.id, side: true, amount: totalDiscount }, // Debit AR (restore)
            { accountId: salesDiscount.id, side: false, amount: totalDiscount }, // Credit SalesDiscount

            { accountId: receivablesubaccount.id, side: true, amount: totalDiscount }, // Debit sub AR
            { accountId: receivablecontrasubaccount.id, side: false, amount: totalDiscount }, // Credit contra AR (restore)

          ],
          today,
          `Reversal of discount for ${order.orderNumber} ${customer ? ' to ' + customer.name : ''}`,
          {
            movementType: 'reversal-discount',
            createdById: userdb.id,
            transactionId: nextTransactionId,
          },
          tx
        )
      }

      // 3️⃣ Reverse COGS (Debit Inventory, Credit COGS)
      await createJournalEntry(
        [
          { accountId: inventory.id, side: true, amount: totalCOGS }, // Debit Inventory
          { accountId: cogs.id, side: false, amount: totalCOGS }, // Credit COGS
        ],
        today,
        `Reversal of COGS for ${order.orderNumber} ${customer ? ' to ' + customer.name : ''}`,
        {
          movementType: 'reversal',
          createdById: userdb.id,
          transactionId: nextTransactionId,
        },
        tx
      )

      // 4️⃣ Reverse Payment (if paid): Debit AR, Credit Cash
      if (order.orderStatus.toUpperCase() === 'PAID') {
        await createJournalEntry(
          [
            { accountId: receivable.id, side: true, amount: Number(order.paidAmount) }, // Debit AR
            { accountId: cash.id, side: false, amount: Number(order.paidAmount) }, // Credit Cash

            { accountId: receivablesubaccount.id, side: true, amount: Number(order.paidAmount) }, // Debit sub AR
            { accountId: receivablecontrasubaccount.id, side: false, amount: Number(order.paidAmount) }, // Credit contra sub AR
          ],
          today,
          `Reversal of payment for ${order.orderNumber} ${customer ? ' to ' + customer.name : ''}`,
          {
            movementType: 'reversal-payment',
            createdById: userdb.id,
            transactionId: nextTransactionId,
          },
          tx
        )
      }

      // 5️⃣ Restore stock quantities
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: Number(item.quantity) },
          },
        })
      }

      // 6️⃣ Mark order as CANCELED
      await tx.salesOrder.update({
        where: { id },
        data: {
          orderStatus: 'CANCELED',
          updatedById: userdb.id,
        },
      })
    })

    return { success: true, message: 'Sales order reversed and CANCELED', errors: {} }
  } catch (error) {
    console.error('Error deleting sales order:', error)
    return { success: false, message: 'Failed to delete sales order', errors: {} }
  }
}

/**
 * List all orders for logged-in company
 */
export async function getSalesOrders() {
  'use server'
  // const session = await auth()
  // if (!session?.user) return { success: false, message: 'Not logged in' }

  // const tmpform = new FormData()
  // tmpform.append('email', session.user.email || '')
  // const userdb = await getuser({}, tmpform)
  // if (!userdb?.companyId) return { success: false, message: 'User has no company' }

  const userdb = await getAuthUserCompanyOrThrow();
  if (!canManageSales(userdb, 'read')) return { success: false, message: 'Permission denied' }

  if (!userdb.companyId) {throw new Error("User does not belong to any company");}
  const orders = await prisma.salesOrder.findMany({
    where: { companyId: userdb.companyId, isDeleted: false },
    include: {
      customer: true,
      items: {
        include: { product: true },
      },
    },
    orderBy: { dateIssued: 'desc' },
  })
  const safeOrders = orders.map((o) => ({
    ...o,
    totalAmount: Number(o.totalAmount), // convert Prisma.Decimal → number
    discountAmount: Number(o.discountAmount || 0), // convert Prisma.Decimal → number
    paidAmount: Number(o.paidAmount || 0), // convert Prisma.Decimal → number
    items: o.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      discountAmount: Number(item.discountAmount || 0),
      product: {
        ...item.product,
        costPrice: Number(item.product.costPrice),
        sellingPrice: Number(item.product.sellingPrice),
        stockQuantity: Number(item.product.stockQuantity),
        reorderLevel: Number(item.product.reorderLevel),
        defaultLocation: item.product.defaultLocation ?? null,
      }
    })),
  }))

  return safeOrders
}

/**
 * Get single order by ID
 */
export async function getSalesOrderById(id: number) {
  'use server'
  // const session = await auth()
  // if (!session?.user) return { success: false, message: 'Not logged in' }

  // const tmpform = new FormData()
  // tmpform.append('email', session.user.email || '')
  // const userdb = await getuser({}, tmpform)
  // if (!userdb?.companyId) return { success: false, message: 'User has no company' }

  const userdb = await getAuthUserCompanyOrThrow();  
   if (!canManageSales(userdb, 'read')) return { success: false, message: 'Permission denied' }
  if (!userdb.companyId) {throw new Error("User does not belong to any company");}

  const order = await prisma.salesOrder.findFirst({
    where: { id, companyId: userdb.companyId, isDeleted: false },
    include: {
      customer: true,
      items: {
        include: { product: true },
      },
    },
  })

  if (!order) return null

  const safeorder = {
    ...order,
    totalAmount: Number(order.totalAmount), // convert Prisma.Decimal → number
    discountAmount: Number(order.discountAmount || 0),
    items: order.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      discountAmount: Number(item.discountAmount || 0),
      product: {
        ...item.product,
        costPrice: Number(item.product.costPrice),
        sellingPrice: Number(item.product.sellingPrice),
        stockQuantity: Number(item.product.stockQuantity),
        reorderLevel: Number(item.product.reorderLevel),
        defaultLocation: item.product.defaultLocation ?? null,
      },
    })),
  }

  return safeorder;
}

/**
 * Update Sales Order and perform accounting actions
 */
export async function updateSalesOrder(prevState: PrevState, formData: FormData): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'Not logged in' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)
    // if (!userdb?.companyId) return { success: false, message: 'User has no company' }

    const userdb = await getAuthUserCompanyOrThrow();
    if (!canManageSales(userdb, 'update')) return { success: false, message: 'Permission denied' }

    
    const id = Number(formData.get('id'))
    const newStatus = (formData.get('orderStatus')?.toString().trim() || 'DRAFT').toUpperCase()
    const totalAmount = parseFloat(formData.get('totalAmount') as string)
    const paidAmount = parseFloat(formData.get('paidAmount') as string) || 0
    const discountAmount = parseFloat(formData.get('discountAmount') as string) || 0
    const dueDate = formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : null
    const orderComments = (formData.get('orderComments') as string)

    if (!id || isNaN(totalAmount)) {
      return { success: false, message: 'Invalid input data', errors: {} }
    }


    // 🔹 1. Update order core info
    await prisma.$transaction(async (tx) => {
      if (!userdb?.companyId) return { success: false, message: 'User has no company' }
      const existing = await tx.salesOrder.findFirst({
        where: { id, companyId: userdb.companyId },
        include: {
          items: {
            include: { product: true }
          }
        },
      })
      if (!existing) return { success: false, message: 'Order not found', errors: {} }
      const itemsJson = formData.get('items') as string | null
      const parsedItems: SalesOrderItem[] = itemsJson ? JSON.parse(itemsJson) : []

      const existingIds = parsedItems
        .filter((i) => i.id && !isNaN(Number(i.id)))
        .map((i) => Number(i.id));

      for (const item of parsedItems) {
        if (item.id) {
          // Update existing item
          await tx.salesOrderItem.update({
            where: { id: item.id },
            data: {
              productId: Number(item.productId),
              quantity: new Prisma.Decimal(item.quantity),
              unitPrice: new Prisma.Decimal(item.unitPrice),
              totalPrice: new Prisma.Decimal(item.totalPrice),
              discountAmount: new Prisma.Decimal(item.discountAmount || 0),
            },
          })
        } else {
          // Create new item
          await tx.salesOrderItem.create({
            data: {
              companyId: userdb.companyId!,
              salesOrderId: existing.id,
              productId: Number(item.productId),
              quantity: new Prisma.Decimal(item.quantity),
              unitPrice: new Prisma.Decimal(item.unitPrice),
              totalPrice: new Prisma.Decimal(item.totalPrice),
              discountAmount: new Prisma.Decimal(item.discountAmount || 0),
            },
          })
        }
      }

      // Delete removed items
      await tx.salesOrderItem.deleteMany({
        where: {
          salesOrderId: existing.id,
          id: { notIn: existingIds },
        },
      })

      const prevStatus = existing.orderStatus.toUpperCase()
      const companyId = userdb.companyId
      const today = new Date().toISOString().split('T')[0]


      await tx.salesOrder.update({
        where: { id, companyId },
        data: { orderStatus: newStatus, totalAmount, discountAmount, paidAmount, dueDate, updatedById: userdb.id, orderComments },
      })

      // ✅ 2. Handle status transitions
      const maxId = await tx.journal.aggregate({ _max: { transactionId: true } })
      const nextTransactionId = (maxId._max.transactionId ?? 0) + 1

      // ---- CASES ----
      if ((prevStatus === 'DRAFT' || prevStatus === 'OPEN') && newStatus === 'INVOICED') {
        await createInvoiceEntries(existing, tx, userdb, nextTransactionId, today, companyId)
      } else if ((prevStatus === 'DRAFT' || prevStatus === 'OPEN') && newStatus === 'PAID') {
        await createInvoiceEntries(existing, tx, userdb, nextTransactionId, today, companyId)
        await createPaymentEntries(paidAmount,existing, tx, userdb, nextTransactionId, today, companyId)
      } else if ((prevStatus === 'INVOICED') && newStatus === 'PAID') {
        await createPaymentEntries(paidAmount,existing, tx, userdb, nextTransactionId, today, companyId)
      } else if ((prevStatus === 'INVOICED' || prevStatus === 'PAID') && newStatus === 'CANCELED') {
        await reverseInvoiceEntries(existing, tx, userdb, nextTransactionId, today, companyId)
      } else if ((prevStatus === 'DRAFT' || prevStatus === 'OPEN') && (newStatus === 'CANCELED' || newStatus === 'OPEN')) {
        // No accounting entries to reverse
      } else if (prevStatus === 'PAID' && newStatus === 'PAID' && paidAmount !== Number(existing.paidAmount)) {
        await createPaymentEntries(paidAmount,existing, tx, userdb, nextTransactionId, today, companyId);
      } else if (prevStatus === newStatus) {
        // No action needed
      } else {
        throw new Error(`Unsupported status transition from ${prevStatus} to ${newStatus}`)
      }

    })

    return { success: true, message: `Sales order updated and synced successfully.`, errors: {} }
  } catch (error) {
    console.error('Error updating sales order:', error)
    return { success: false, message: 'Failed to update sales order', errors: {} }
  }
}

/**
 *  Helper functions need full objects , objects comming from db are prisma types
 *  Server to Server we do not need to convert them to safe types so directly use prisma types
 *  But for ui we convert them and send
 *  For journal entries we need to convert them too because functions are made for ui types
 */
// Define the type of `existing` with items and product included
type SalesOrderWithItems = Prisma.SalesOrderGetPayload<{
  include: {
    items: {
      include: { product: true }
    }
  }
}>
/* ============================================================
   Helper: Create Invoice Accounting Entries (Sales + COGS + Discount)
============================================================ */
async function createInvoiceEntries(order: SalesOrderWithItems, tx: Prisma.TransactionClient, user: User, transactionId: number, today: string, companyId: number) {
  const items = order.items
  let totalCOGS = 0
  if (items) {
    for (const i of items) {
      const prod = await tx.product.findFirst({ where: { id: i.productId } })
      if (prod) totalCOGS += Number(prod.costPrice || 0) * Number(i.quantity)
    }
  }

  const [receivable, sales, cogs, inventory, discount] = await Promise.all([
    tx.account.findFirst({ where: { title: 'Accounts Receivable', companyId } }),
    tx.account.findFirst({ where: { title: 'Sales Revenue', companyId } }),
    tx.account.findFirst({ where: { title: 'Cost of Goods Sold', companyId } }),
    tx.account.findFirst({ where: { title: 'Stock', companyId } }),
    tx.account.findFirst({ where: { title: 'Sales Discount', companyId } }),
  ])
  const customer = await tx.customer.findFirst({ where: { id: order.customerId, companyId } })
  let receivablesubaccount = null; if (customer) { receivablesubaccount = await tx.account.findFirst({ where: { id: customer.accountId1!, companyId } }) }
  let receivablecontrasubaccount = null; if (customer) { receivablecontrasubaccount = await tx.account.findFirst({ where: { id: customer.accountId2!, companyId } }) }

  if (!receivable || !customer || !receivablesubaccount || !receivablecontrasubaccount || !sales || !cogs || !inventory) throw new Error('Essential accounts missing')

  // A. Sales Entry
  await createJournalEntry(
    [
      { accountId: receivable.id, side: true, amount: Number(order.totalAmount) },
      { accountId: sales.id, side: false, amount: Number(order.totalAmount) },

      { accountId: receivablesubaccount.id, side: true, amount: Number(order.totalAmount) },
      { accountId: receivablecontrasubaccount.id, side: false, amount: Number(order.totalAmount) },

    ],
    today,
    `Sales Invoice #${order.orderNumber} ${customer ? ' to ' + customer.name : ''}`,
    { movementType: 'sale', createdById: user.id, transactionId },
    tx
  )

  // B. COGS Entry
  await createJournalEntry(
    [
      { accountId: cogs.id, side: true, amount: totalCOGS },
      { accountId: inventory.id, side: false, amount: totalCOGS },
    ],
    today,
    `COGS for ${order.orderNumber} ${customer ? ' to ' + customer.name : ''}`,
    { movementType: 'sale', createdById: user.id, transactionId },
    tx
  )

  // C. Discount Entry (optional)
  if (Number(order.discountAmount) > 0 && discount) {
    await createJournalEntry(
      [
        { accountId: discount.id, side: true, amount: Number(order.discountAmount) },
        { accountId: receivable.id, side: false, amount: Number(order.discountAmount) },

        { accountId: receivablecontrasubaccount.id, side: true, amount: Number(order.discountAmount) },
        { accountId: receivablesubaccount.id, side: false, amount: Number(order.discountAmount) },
      ],
      today,
      `Sales Discount for ${order.orderNumber} ${customer ? ' to ' + customer.name : ''}`,
      { movementType: 'discount', createdById: user.id, transactionId },
      tx
    )
  }

  // D. Reduce Stock
  if (items) {
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: Number(item.quantity) } },
      })
    }
  }

}

/* ============================================================
   Helper: Create Payment Entries (Cash ↔ Accounts Receivable)
============================================================ */
async function createPaymentEntries(paidAmount: number, order: SalesOrderWithItems, tx: Prisma.TransactionClient, user: User, transactionId: number, today: string, companyId: number) {
  const [cash, receivable] = await Promise.all([
    tx.account.findFirst({ where: { title: 'Cash', companyId } }),
    tx.account.findFirst({ where: { title: 'Accounts Receivable', companyId } }),
  ])
  const customer = await tx.customer.findFirst({ where: { id: order.customerId, companyId } })
  let receivablesubaccount = null; if (customer) { receivablesubaccount = await tx.account.findFirst({ where: { id: customer.accountId1!, companyId } }) }
  let receivablecontrasubaccount = null; if (customer) { receivablecontrasubaccount = await tx.account.findFirst({ where: { id: customer.accountId2!, companyId } }) }


  if (!cash || !receivable || !customer || !receivablesubaccount || !receivablecontrasubaccount) throw new Error('Cash or AR accounts missing')
  
  const paidAmount_Diff = paidAmount - Number(order.paidAmount) ;
  const paidAmount_Diff1 = Math.abs(paidAmount_Diff) ;

  const mside: boolean = paidAmount_Diff >= 0 ? true : false;
  await createJournalEntry(
    [
      { accountId: cash.id, side: mside, amount: Number(paidAmount_Diff1) },
      { accountId: receivable.id, side: !mside, amount: Number(paidAmount_Diff1) },

      { accountId: receivablecontrasubaccount.id, side: mside, amount: Number(paidAmount_Diff1) },
      { accountId: receivablesubaccount.id, side: !mside, amount: Number(paidAmount_Diff1) },

    ],
    today,
    `Payment received for ${order.orderNumber} ${customer ? ' to ' + customer.name : ''}`,
    { movementType: 'payment', createdById: user.id, transactionId },
    tx
  )
}

/* ============================================================
   Helper: Reverse All Invoice + Payment Entries
============================================================ */
async function reverseInvoiceEntries(order: SalesOrderWithItems, tx: Prisma.TransactionClient, user: User, transactionId: number, today: string, companyId: number) {
  const [receivable, sales, cogs, inventory, cash, discount] = await Promise.all([
    tx.account.findFirst({ where: { title: 'Accounts Receivable', companyId } }),
    tx.account.findFirst({ where: { title: 'Sales Revenue', companyId } }),
    tx.account.findFirst({ where: { title: 'Cost of Goods Sold', companyId } }),
    tx.account.findFirst({ where: { title: 'Stock', companyId } }),
    tx.account.findFirst({ where: { title: 'Cash', companyId } }),
    tx.account.findFirst({ where: { title: 'Sales Discount', companyId } }),
  ])
  const customer = await tx.customer.findFirst({ where: { id: order.customerId, companyId } })
  let receivablesubaccount = null; if (customer) { receivablesubaccount = await tx.account.findFirst({ where: { id: customer.accountId1!, companyId } }) }
  let receivablecontrasubaccount = null; if (customer) { receivablecontrasubaccount = await tx.account.findFirst({ where: { id: customer.accountId2!, companyId } }) }

  if (!receivable || !customer || !receivablecontrasubaccount || !receivablesubaccount || !sales || !cogs || !inventory) throw new Error('Essential accounts missing for reversal')

  // Reverse Sales Entry
  await createJournalEntry(
    [
      { accountId: sales.id, side: true, amount: Number(order.totalAmount) },
      { accountId: receivable.id, side: false, amount: Number(order.totalAmount) },

      { accountId: receivablecontrasubaccount.id, side: true, amount: Number(order.totalAmount) },
      { accountId: receivablesubaccount.id, side: false, amount: Number(order.totalAmount) },
    ],
    today,
    `Reversal: Sales Invoice #${order.orderNumber} ${customer ? ' to ' + customer.name : ''}`,
    { movementType: 'reversal', createdById: user.id, transactionId },
    tx
  )

  // Reverse COGS Entry
  let totalCOGS = 0
  for (const i of order.items) {
    const prod = await tx.product.findFirst({ where: { id: i.productId } })
    if (prod) totalCOGS += Number(prod.costPrice || 0) * Number(i.quantity)
  }
  await createJournalEntry(
    [
      { accountId: inventory.id, side: true, amount: totalCOGS },
      { accountId: cogs.id, side: false, amount: totalCOGS },
    ],
    today,
    `Reversal: COGS for ${order.orderNumber} ${customer ? ' to ' + customer.name : ''}`,
    { movementType: 'reversal', createdById: user.id, transactionId },
    tx
  )

  // Reverse Discount if exists
  if (Number(order.discountAmount) > 0 && discount) {
    await createJournalEntry(
      [
        { accountId: receivable.id, side: true, amount: Number(order.discountAmount) },
        { accountId: discount.id, side: false, amount: Number(order.discountAmount) },

        { accountId: receivablesubaccount.id, side: true, amount: Number(order.discountAmount) },
        { accountId: receivablecontrasubaccount.id, side: false, amount: Number(order.discountAmount) },
      ],
      today,
      `Reversal: Discount for ${order.orderNumber} ${customer ? ' to ' + customer.name : ''}`,
      { movementType: 'reversal', createdById: user.id, transactionId },
      tx
    )
  }

  // Reverse Payment if already paid
  if (order.orderStatus === 'PAID' && cash) {
    await createJournalEntry(
      [
        { accountId: receivable.id, side: true, amount: Number(order.totalAmount) },
        { accountId: cash.id, side: false, amount: Number(order.totalAmount) },

        { accountId: receivablesubaccount.id, side: true, amount: Number(order.totalAmount) },
        { accountId: receivablecontrasubaccount.id, side: false, amount: Number(order.totalAmount) },
      ],
      today,
      `Reversal: Payment for ${order.orderNumber} ${customer ? ' to ' + customer.name : ''}`,
      { movementType: 'reversal', createdById: user.id, transactionId },
      tx
    )
  }

  // Restore Stock
  for (const item of order.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stockQuantity: { increment: Number(item.quantity) } },
    })
  }
}