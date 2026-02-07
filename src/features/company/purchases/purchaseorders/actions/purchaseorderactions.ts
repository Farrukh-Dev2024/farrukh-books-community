'use server'

import { canManagePurchases } from '@/lib/permissions/permissions'
import { createJournalEntry } from '@/features/company/accounts/journal/actions/journalactions'
import { PrevState } from '@/types/project-types'
//import { Prisma.Decimal } from '@prisma/client/runtime/library'
import { PurchaseOrderSchema } from '../schemas/purchaseorderschemas'

import { Prisma, PrismaClient, PurchaseOrder, PurchaseOrderItem, User } from '@/generated/prisma/client'
import { prisma } from '../../../../../lib/prisma'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'

/**
 * ✅ Generate next Purchase Order Number
 */
async function getNextPurchaseOrderNumber(companyId: number): Promise<string> {
  'use server'
  const latest = await prisma.purchaseOrder.findFirst({
    where: { companyId },
    orderBy: { id: 'desc' },
  })
  const nextNumber = (latest?.id || 0) + 1
  return `PO-${nextNumber.toString().padStart(4, '0')}`
}
async function getNextTransactionId(tx: Prisma.TransactionClient) {
  const maxId = await tx.journal.aggregate({ _max: { transactionId: true } })
  return (maxId._max.transactionId ?? 0) + 1
}

/**
 * ✅ Create Purchase Order
 */
export async function createPurchaseOrder(_: PrevState, formData: FormData): Promise<PrevState> {
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'User not logged in' }

    // // 🔎 Get user and company
    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)

    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return { success: false, message: 'Invalid user/company' }
    if (!canManagePurchases(userdb, 'create'))
      return { success: false, message: 'Permission denied' }

    const companyId = userdb.companyId

    // 🧩 Parse items JSON safely
    let parsedItems: PurchaseOrderItem[] = []
    try {
      const rawItems = formData.get('items')
      parsedItems = rawItems ? JSON.parse(rawItems as string) : []
    } catch {
      return { success: false, message: 'Invalid items format' }
    }

    // 🧾 Validate all fields including items
    const rawData = Object.fromEntries(formData.entries())
    const parsed = await PurchaseOrderSchema.parseAsync({
      ...rawData,
      items: parsedItems,
    })

    const { items, ...data } = parsed
    const orderStatus = data.orderStatus?.toUpperCase()
    const today = new Date().toISOString().split('T')[0]

    return await prisma.$transaction(async (tx) => {
      const orderNumber = await getNextPurchaseOrderNumber(companyId)

      const nextTransactionId = await getNextTransactionId(tx)
      const paidAmount = Number(data.paidAmount || 0)

      // 1️⃣ Create Purchase Order
      const order = await tx.purchaseOrder.create({
        data: {
          vendorId: Number(data.vendorId),
          orderNumber,
          companyId,
          createdById: userdb.id,
          updatedById: userdb.id,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          discountAmount: Number(data.discountAmount || 0),
          totalAmount: Number(data.totalAmount || 0),
          paidAmount: Number(data.paidAmount || 0),
          orderStatus,
          orderComments: data.orderComments || null,
          transactionId: nextTransactionId,
          items: {
            create: items.map((item) => ({
              companyId,
              productId: Number(item.productId),
              transactionId: nextTransactionId,
              quantity: item.quantity,
              unitCost: new Prisma.Decimal(item.unitCost),
              totalCost: new Prisma.Decimal(item.totalCost),
              discountAmount: new Prisma.Decimal(item.discountAmount || 0),
            })),
          },
        },
        include: { items: true },
      })

      // 🔎 Lookup vendor & accounts
      const vendor = await tx.vendor.findFirst({
        where: { id: order.vendorId, companyId },
      })
      if (!vendor) throw new Error('Vendor not found')

      const accounts = await Promise.all([
        tx.account.findFirst({ where: { title: 'Accounts Payable', companyId } }),
        tx.account.findFirst({ where: { id: vendor.accountId1!, companyId } }),
        tx.account.findFirst({ where: { id: vendor.accountId2!, companyId } }),
        tx.account.findFirst({ where: { title: 'Stock', companyId } }),
        tx.account.findFirst({ where: { title: 'Purchase Discounts', companyId } }),
        tx.account.findFirst({ where: { title: 'Cash', companyId } }),
      ])
      const [payable, payableSub, payableContra, inventory, purchaseDiscount, cash] = accounts
      if (accounts.some(a => !a)) throw new Error('Required accounts not found')

      let grossTotal = items.reduce((sum, item) => sum.add(new Prisma.Decimal(item.totalCost)), new Prisma.Decimal(0))
      const discountAmount = new Prisma.Decimal(data.discountAmount || 0)
      const netPayable = grossTotal.sub(discountAmount)

      if (orderStatus === 'INVOICED' || orderStatus === 'PAID') {
        for (const item of order.items) {

          const product = await tx.product.findUnique({ where: { id: item.productId } })
          if (!product) throw new Error(`Product not found: ${item.productId}`)

          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          })
        }

        // Inventory Dr / A/P Cr
        await createJournalEntry(
          [
            { accountId: inventory!.id, side: true, amount: Number(grossTotal) },
            { accountId: payable!.id, side: false, amount: Number(grossTotal) },
            { accountId: payableContra!.id, side: true, amount: Number(grossTotal) },
            { accountId: payableSub!.id, side: false, amount: Number(grossTotal) },
          ],
          today,
          `Purchase invoice ${orderNumber} from ${vendor.name}`,
          {
            movementType: 'purchase',
            createdById: userdb.id,
            transactionId: nextTransactionId,
          },
          tx
        )

        if (discountAmount.gt(0)) {
          await createJournalEntry(
            [
              { accountId: payable!.id, side: true, amount: Number(discountAmount) },
              { accountId: purchaseDiscount!.id, side: false, amount: Number(discountAmount) },
              { accountId: payableSub!.id, side: true, amount: Number(discountAmount) },
              { accountId: payableContra!.id, side: false, amount: Number(discountAmount) },
            ],
            today,
            `Discount received on ${orderNumber} from ${vendor.name}`,
            {
              movementType: 'discount',
              createdById: userdb.id,
              transactionId: nextTransactionId,
            },
            tx
          )
        }

        if (orderStatus === 'PAID') {
          await createJournalEntry(
            [
              { accountId: payable!.id, side: true, amount: Number(paidAmount) },
              { accountId: cash!.id, side: false, amount: Number(paidAmount) },
              { accountId: payableSub!.id, side: true, amount: Number(paidAmount) },
              { accountId: payableContra!.id, side: false, amount: Number(paidAmount) },
            ],
            today,
            `Payment made for ${orderNumber} to ${vendor.name}`,
            {
              movementType: 'payment',
              createdById: userdb.id,
              transactionId: nextTransactionId,
            },
            tx
          )
        }
      }

      return { success: true, message: 'Purchase order created successfully' }
    })
  } catch (error) {
    console.error('Error creating purchase order: %O', error)
    return { success: false, message: 'Error creating purchase order' }
  }
}

/**

/**
 * ✅ Get all Purchase Orders
 */
export async function getPurchaseOrders() {
  'use server'
  // const session = await auth()
  // if (!session?.user) return []

  // const tmpform = new FormData()
  // tmpform.append('email', session.user.email || '')
  // const userdb = await getuser({}, tmpform)
  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return []
    if (!canManagePurchases(userdb, 'read')) return []

    const companyId = userdb.companyId

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { companyId, isDeleted: false },
      include: {
        vendor: true,
        items: true,
      },
      orderBy: { id: 'desc' },
    })

    const safepurchaseOrders = purchaseOrders.map(po => ({
      ...po,
      discountAmount: Number(po.discountAmount ? po.discountAmount : 0),
      totalAmount: Number(po.totalAmount ? po.totalAmount : 0),
      paidAmount: Number(po.paidAmount ? po.paidAmount : 0),
      items: po.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitCost: item.unitCost ? Number(item.unitCost) : 0,
        totalCost: item.totalCost ? Number(item.totalCost) : 0,
        discountAmount: item.discountAmount ? Number(item.discountAmount) : 0,
      })),
    }))
    return safepurchaseOrders    
  } catch (error) {
    console.log ("Error in getPurchaseOrders %O", error);
    return []
  }

}

/**
 * ✅ Get single Purchase Order
 */
export async function getPurchaseOrderById(id: number) {
  'use server'
  // const session = await auth()
  // if (!session?.user) return null

  // const tmpform = new FormData()
  // tmpform.append('email', session.user.email || '')
  // const userdb = await getuser({}, tmpform)
  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return null

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id, companyId: userdb.companyId },
      include: { vendor: true, items: true },
    })

    const safepurchaseOrder = purchaseOrder
      ? {
        ...purchaseOrder,
        totalAmount: purchaseOrder.totalAmount ? Number(purchaseOrder.totalAmount) : 0,
        discountAmount: purchaseOrder.discountAmount ? Number(purchaseOrder.discountAmount) : 0,
        paidAmount: purchaseOrder.paidAmount ? Number(purchaseOrder.paidAmount) : 0,
        items: purchaseOrder.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitCost: item.unitCost ? Number(item.unitCost) : 0,
          totalCost: item.totalCost ? Number(item.totalCost) : 0,
          discountAmount: item.discountAmount ? Number(item.discountAmount) : 0,
        })),
      }
      : null
    return safepurchaseOrder    
  } catch (error) {
    console.log("Error in getPurchaseORderById %O" , error);
    return null;
  }

}

/**
 * ✅ Delete / Reverse Purchase Order
 */
export async function deletePurchaseOrder(id: number): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user)
    //   return { success: false, message: 'Not logged in' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)

    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) {return { success: false, message: 'Invalid company' }}
    if (!canManagePurchases(userdb, 'delete')){return { success: false, message: 'Permission denied' }}

    const companyId = userdb.companyId

    return await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchaseOrder.findFirst({
        where: { id, companyId },
        include: { items: { include:{product:true}}, vendor: true },
      })
      if (!purchase)
        return { success: false, message: 'Purchase order not found' }

      const prevStatus = purchase.orderStatus.toUpperCase()
      const today = new Date().toISOString().split('T')[0]

      if (['DRAFT', 'OPEN', 'CANCELED'].includes(prevStatus)) {
        await tx.purchaseOrder.update({
          where: { id },
          data: { orderStatus: 'CANCELED', isDeleted: true },
        })
        return { success: true, message: 'Purchase order deleted (soft)' }
      }

      await reversePurchaseEntries(purchase, tx, userdb, (await tx.journal.aggregate({ _max: { transactionId: true } }))._max.transactionId! + 1, today, companyId)
      return { success: true, message: 'Purchase order reversed and canceled' }
    })
  } catch (error) {
    console.error('Error deleting purchase order: %O', error)
    return { success: false, message: `Error deleting purchase order` }
  }
}

/**
 * ✅ Update Purchase Order
 */
export async function updatePurchaseOrder(
  prevState: PrevState,
  formData: FormData
): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'User not logged in' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)

    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return { success: false, message: 'User has no company' }
    if (!canManagePurchases(userdb, 'update'))
      return { success: false, message: 'Permission denied' }

    const id = Number(formData.get('id'))
    if (!id) return { success: false, message: 'Invalid ID' }

    const parsedItems: PurchaseOrderItem[] = formData.get('items')
      ? JSON.parse(formData.get('items') as string)
      : []

    return await prisma.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findFirst({
        where: { id, companyId: userdb.companyId! },
        include: { items: {include:{product:true}}, vendor: true },
      })
      if (!existing) return { success: false, message: 'Purchase order not found' }

      const newStatus = (formData.get('orderStatus')?.toString().trim() || 'DRAFT').toUpperCase()
      const totalAmount = parseFloat(formData.get('totalAmount') as string) || 0
      const discountAmount = parseFloat(formData.get('discountAmount') as string) || 0
      const dueDate = formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : null
      const prevStatus = existing.orderStatus.toUpperCase()
      const today = new Date().toISOString().split('T')[0]
      const paidAmount = parseFloat(formData.get('paidAmount') as string) || 0
      const orderComments = formData.get('orderComments')?.toString().trim() || null

      // 1️⃣ Update main purchase order

      await tx.purchaseOrder.update({
        where: { id },
        data: { orderStatus: newStatus, totalAmount, discountAmount, paidAmount, orderComments, dueDate, updatedById: userdb.id },
      })

      // ✅ Track saved item IDs
      const savedItemIds: number[] = []

      // Update/Create items
      for (const item of parsedItems) {
        if (item.id) {
          const updatedItem = await tx.purchaseOrderItem.update({
            where: { id: item.id },
            data: {
              productId: Number(item.productId),
              quantity: item.quantity,
              unitCost: new Prisma.Decimal(item.unitCost),
              totalCost: new Prisma.Decimal(item.totalCost),
              discountAmount: new Prisma.Decimal(item.discountAmount || 0),
            },
          })
          savedItemIds.push(updatedItem.id)
        } else {
          const createdItem = await tx.purchaseOrderItem.create({
            data: {
              companyId: userdb.companyId!,
              purchaseOrderId: existing.id,
              productId: Number(item.productId),
              quantity: item.quantity,
              unitCost: new Prisma.Decimal(item.unitCost),
              totalCost: new Prisma.Decimal(item.totalCost),
              discountAmount: new Prisma.Decimal(item.discountAmount || 0),
            },
          })
          savedItemIds.push(createdItem.id)
        }
      }

      // Delete removed items
      await tx.purchaseOrderItem.deleteMany({
        where: {
          purchaseOrderId: existing.id,
          id: { notIn: savedItemIds },
        },
      })

      const nextTransactionId =
        (await tx.journal.aggregate({ _max: { transactionId: true } }))._max.transactionId! + 1

      // Handle accounting entries based on status transitions
      if ((prevStatus === 'DRAFT' || prevStatus === 'OPEN') && newStatus === 'INVOICED') {
        await createPurchaseInvoiceEntries(existing , tx, userdb, nextTransactionId, today, userdb.companyId!)
      } else if ((prevStatus === 'DRAFT' || prevStatus === 'OPEN') && newStatus === 'PAID') {
        await createPurchaseInvoiceEntries(existing , tx, userdb, nextTransactionId, today, userdb.companyId!)
        await createPurchasePaymentEntries(paidAmount, existing , tx, userdb, nextTransactionId, today, userdb.companyId!)
      } else if (prevStatus === 'INVOICED' && newStatus === 'PAID') {
        await createPurchasePaymentEntries(paidAmount, existing , tx, userdb, nextTransactionId, today, userdb.companyId!)
      } else if ((prevStatus === 'INVOICED' || prevStatus === 'PAID') && newStatus === 'CANCELED') {
        await reversePurchaseEntries(existing, tx, userdb, nextTransactionId, today, userdb.companyId!)
      } else if (prevStatus === 'PAID' && newStatus === 'PAID' && paidAmount !== Number(existing.paidAmount)) {
        await createPurchasePaymentEntries(paidAmount, existing , tx, userdb, nextTransactionId, today, userdb.companyId!)
      }

      return { success: true, message: 'Purchase order updated successfully' }
    })
  } catch (error) {
    console.error('Error updating purchase order: %O', error)
    return { success: false, message: 'Error updating purchase order' }
  }
}




type PurchaseOrderWithItems = Prisma.PurchaseOrderGetPayload<{
  include: {
    items: {
      include: { product: true }
    }
  }
}>

async function createPurchaseInvoiceEntries(
  purchase: PurchaseOrderWithItems,
  tx: Prisma.TransactionClient,
  userdb: User,
  transactionId: number,
  today: string,
  companyId: number
) {
  const vendor = await tx.vendor.findFirst({ where: { id: purchase.vendorId, companyId } })
  if (!vendor?.accountId1 || !vendor?.accountId2)
    throw new Error('Vendor accounts not linked')

  const inventory = await tx.account.findFirst({
    where: { title: 'Stock', companyId },
  })
  const payable = await tx.account.findFirst({
    where: { title: 'Accounts Payable', companyId },
  })

  if (!inventory || !payable) throw new Error('Required accounts not found')

  // Loop through all purchase items
  for (const item of purchase.items) {
    const lineAmount = new Prisma.Decimal(item.quantity).mul(item.unitCost || 0)

    // Update stock
    const product = await tx.product.findUnique({ where: { id: item.productId } })
    if (!product) throw new Error(`Product not found: ${item.productId}`)

    await tx.product.update({
      where: { id: item.productId },
      data: { stockQuantity: product.stockQuantity + item.quantity },
    })

    // Journal entry: Inventory (Dr), Accounts Payable (Cr)
    await createJournalEntry(
      [
        { accountId: inventory.id, side: true, amount: Number(lineAmount) },
        { accountId: payable.id, side: false, amount: Number(lineAmount) },

        // Individual A/P entries
        { accountId: vendor.accountId2, side: false, amount: Number(lineAmount) },
        { accountId: vendor.accountId1, side: true, amount: Number(lineAmount) },
      ],
      today,
      `Purchase Invoice for ${purchase.orderNumber} from vendor: ${vendor.name}`,
      {
        movementType: 'purchase_invoice',
        createdById: userdb.id,
        transactionId,
      },
      tx
    )
  }

  // Handle overall discount if any (e.g., Discount Received)
  if (purchase.discountAmount && Number(purchase.discountAmount) > 0) {
    const discountAccount = await tx.account.findFirst({
      where: { title: 'Purchase Discounts', companyId },
    })
    if (discountAccount) {
      await createJournalEntry(
        [
          { accountId: payable.id, side: true, amount: Number(purchase.discountAmount) },
          { accountId: discountAccount.id, side: false, amount: Number(purchase.discountAmount) },

          { accountId: vendor.accountId1, side: true, amount: Number(purchase.discountAmount) },
          { accountId: vendor.accountId2, side: false, amount: Number(purchase.discountAmount) },
        ],
        today,
        `Discount received on Purchase Order ${purchase.orderNumber} from ${vendor.name}`,
        {
          movementType: 'purchase_discount',
          createdById: userdb.id,
          transactionId,
        },
        tx
      )
    }
  }
}

async function createPurchasePaymentEntries(
  paidAmount: number,
  purchase: PurchaseOrderWithItems,
  tx: Prisma.TransactionClient,
  userdb: User,
  transactionId: number,
  today: string,
  companyId: number
) {
  const vendor = await tx.vendor.findFirst({ where: { id: purchase.vendorId, companyId } })
  if (!vendor?.accountId1 || !vendor?.accountId2)
    throw new Error('Vendor accounts not linked')

  const cash = await tx.account.findFirst({
    where: { title: 'Cash', companyId },
  })
  const payable = await tx.account.findFirst({
    where: { title: 'Accounts Payable', companyId },
  })
  if (!cash || !payable) throw new Error('Cash or Payable account missing')

  const totalAmount = new Prisma.Decimal(purchase.totalAmount || 0)
  const discountAmount = new Prisma.Decimal(purchase.discountAmount || 0)
  //const netPaid = totalAmount.sub(discountAmount)
  const netPaid = new Prisma.Decimal(paidAmount)

  const paidAmount_Diff = paidAmount - Number(purchase.paidAmount);
  const paidAmount_Diff1 = Math.abs(paidAmount_Diff);

  const mside: boolean = paidAmount_Diff >= 0 ? true : false;

  // Payment: Accounts Payable (Dr), Cash (Cr)
  await createJournalEntry(
    [
      { accountId: payable.id, side: mside, amount: Number(netPaid) },
      { accountId: cash.id, side: mside, amount: Number(netPaid) },

      { accountId: vendor.accountId1, side: mside, amount: Number(netPaid) },
      { accountId: vendor.accountId2, side: mside, amount: Number(netPaid) },
    ],
    today,
    `Payment for Purchase Order ${purchase.orderNumber} to ${vendor.name}`,
    {
      movementType: 'purchase_payment',
      createdById: userdb.id,
      transactionId,
    },
    tx
  )
}


async function reversePurchaseEntries(
  purchase: PurchaseOrderWithItems,
  tx: Prisma.TransactionClient,
  userdb: User,
  transactionId: number,
  today: string,
  companyId: number
) {
  const vendor = await tx.vendor.findFirst({ where: { id: purchase.vendorId, companyId } })
  if (!vendor?.accountId1 || !vendor?.accountId2)
    throw new Error('Vendor accounts not linked')

  const inventory = await tx.account.findFirst({
    where: { title: 'Stock', companyId },
  })
  const payable = await tx.account.findFirst({
    where: { title: 'Accounts Payable', companyId },
  })
  const cash = await tx.account.findFirst({
    where: { title: 'Cash', companyId },
  })
  const discountAccount = await tx.account.findFirst({
    where: { title: 'Purchase Discounts', companyId },
  })

  if (!inventory || !payable || !cash)
    throw new Error('Required accounts not found for reversal')

  // Reverse product stock
  for (const item of purchase.items) {

    const product = await tx.product.findUnique({ where: { id: item.productId } })
    if (!product) throw new Error(`Product not found: ${item.productId}`)

    await tx.product.update({
      where: { id: item.productId },
      data: { stockQuantity: product.stockQuantity - item.quantity },
    })
  }

  // Reverse main invoice
  const totalAmount = new Prisma.Decimal(purchase.totalAmount || 0)
  await createJournalEntry(
    [
      { accountId: payable.id, side: true, amount: Number(totalAmount) },
      { accountId: inventory.id, side: false, amount: Number(totalAmount) },

      { accountId: vendor.accountId1, side: true, amount: Number(totalAmount) },
      { accountId: vendor.accountId2, side: false, amount: Number(totalAmount) },
    ],
    today,
    `Reversal of Purchase Order ${purchase.orderNumber} to ${vendor.name}`,
    {
      movementType: 'purchase_reversal',
      createdById: userdb.id,
      transactionId,
    },
    tx
  )

  const paidAmount = new Prisma.Decimal(purchase.paidAmount || 0)
  // Reverse payment if paid
  if (purchase.orderStatus === 'PAID') {
    await createJournalEntry(
      [
        { accountId: cash.id, side: true, amount: Number(paidAmount) },
        { accountId: payable.id, side: false, amount: Number(paidAmount) },

        { accountId: vendor.accountId2, side: true, amount: Number(paidAmount) },
        { accountId: vendor.accountId1, side: false, amount: Number(paidAmount) },
      ],
      today,
      `Reversal of payment for Purchase Order ${purchase.orderNumber} from ${vendor.name}`,
      {
        movementType: 'purchase_payment_reversal',
        createdById: userdb.id,
        transactionId,
      },
      tx
    )
  }

  // Reverse discount if any
  if (discountAccount && purchase.discountAmount && Number(purchase.discountAmount) > 0) {
    await createJournalEntry(
      [
        { accountId: discountAccount.id, side: true, amount: Number(purchase.discountAmount) },
        { accountId: payable.id, side: false, amount: Number(purchase.discountAmount) },

        { accountId: vendor.accountId2, side: true, amount: Number(purchase.discountAmount) },
        { accountId: vendor.accountId1, side: false, amount: Number(purchase.discountAmount) },
      ],
      today,
      `Reversal of discount on Purchase Order ${purchase.orderNumber} from ${vendor.name}`,
      {
        movementType: 'purchase_discount_reversal',
        createdById: userdb.id,
        transactionId,
      },
      tx
    )
  }

  // Finally mark as canceled
  await tx.purchaseOrder.update({
    where: { id: purchase.id },
    data: { orderStatus: 'CANCELED' },
  })
}

