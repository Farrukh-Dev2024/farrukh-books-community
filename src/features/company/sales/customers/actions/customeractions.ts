//customeractions.ts
'use server'

import { prisma } from '../../../../../lib/prisma'
import { AccountSubTypes, AccountTypes, PrevState } from '@/types/project-types'
import { canManageCustomers, canManageProducts } from '@/lib/permissions/permissions'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'

/**
 * Create new customer
 */
export async function createCustomer(prevState: PrevState, formData: FormData): Promise<PrevState> {
  'use server'
  try {

    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'Not logged in' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)

    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return { success: false, message: 'User has no company' }
    if (!canManageCustomers(userdb, 'create')) return { success: false, message: 'Permission denied' }

    const name = formData.get('name')?.toString().trim()
    const email = formData.get('email')?.toString().trim() || null
    const phone = formData.get('phone')?.toString().trim() || null
    const address = formData.get('address')?.toString().trim() || null
    const city = formData.get('city')?.toString().trim() || null
    const country = formData.get('country')?.toString().trim() || null

    if (!name) {
      return { success: false, message: 'Name is required', errors: { name: ['Required'] } }
    }

    await prisma.$transaction(async (tx) => {

      //create an account for this customer in accounts table
      const tmpaccount1 = await tx.account.create({
        data: {
          companyId: userdb.companyId!,
          title: name + ' Account Receivable',
          description: 'Auto-created account for customer ' + name,
          balance: 0,
          accountType: AccountTypes.Asset,
          accountSubType: AccountSubTypes.Receivable,
          side: true,
        }
      })

      //create an contra account for this customer in accounts table
      const tmpaccount2 = await tx.account.create({
        data: {
          companyId: userdb.companyId!,
          title: name + ' Contra Account Receivable',
          description: 'Auto-created account for customer ' + name,
          balance: 0,
          accountType: AccountTypes.Contra,
          accountSubType: AccountSubTypes.Receivable,
          side: false,
        }
      })
      const tmpcustomer = await tx.customer.create({
        data: {
          accountId1: tmpaccount1.id,
          accountId2: tmpaccount2.id,
          companyId: userdb.companyId!,
          name,
          email,
          phone,
          address,
          city,
          country,
          createdById: userdb.id,
          updatedById: userdb.id
        },
      })

    })



    return { success: true, message: 'Customer created successfully', errors: {} }
  } catch (error) {
    console.error('Error creating customer:', error)
    return { success: false, message: 'Failed to create customer', errors: {} }
  }
}

/**
 * Update existing customer
 */
export async function updateCustomer(prevState: PrevState, formData: FormData): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'Not logged in' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)

    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return { success: false, message: 'User has no company' }
    if (!canManageCustomers(userdb, 'update')) return { success: false, message: 'Permission denied' }


    const id = Number(formData.get('id'))
    const name = formData.get('name')?.toString().trim()
    const email = formData.get('email')?.toString().trim() || null
    const phone = formData.get('phone')?.toString().trim() || null
    const address = formData.get('address')?.toString().trim() || null
    const city = formData.get('city')?.toString().trim() || null
    const country = formData.get('country')?.toString().trim() || null

    if (!id || !name) {
      return { success: false, message: 'Invalid data', errors: {} }
    }

    await prisma.customer.update({
      where: { id, companyId: userdb.companyId },
      data: { name, email, phone, address, city, country, updatedById: userdb.id },
    })

    return { success: true, message: 'Customer updated successfully', errors: {} }
  } catch (error) {
    console.error('Error updating customer:', error)
    return { success: false, message: 'Failed to update customer', errors: {} }
  }
}

/**
 * Soft delete customer
 */
export async function deleteCustomer(id: number): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'Not logged in' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)

    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return { success: false, message: 'User has no company' }
    if (!canManageCustomers(userdb, 'delete')) return { success: false, message: 'Permission denied' }

    // Use a transaction for safety
    await prisma.$transaction(async (tx) => {
      // Find the customer (to get its account IDs)
      const customer = await tx.customer.findFirst({
        where: { id, companyId: userdb.companyId!, isDeleted: false },
        select: { id: true, accountId1: true, accountId2: true },
      })

      if (!customer) throw new Error('Customer not found')

      // Soft delete the customer
      await tx.customer.update({
        where: { id: customer.id },
        data: { isDeleted: true, updatedById: userdb.id },
      })

      // Soft delete both related accounts
      const accountIds = [customer.accountId1, customer.accountId2].filter((x): x is number => x != null)
      if (accountIds.length > 0) {
        await tx.account.updateMany({
          where: { id: { in: accountIds }, companyId: userdb.companyId! },
          data: { isDeleted: true },
        })
      }
    })

    return { success: true, message: 'Customer and linked accounts deleted successfully', errors: {} }
  } catch (error) {
    console.error('Error deleting customer:', error)
    return { success: false, message: 'Failed to delete customer', errors: {} }
  }
}


/**
 * Get all customers for logged-in company
 */
export async function getCustomers() {
  'use server'
  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!canManageCustomers(userdb, 'read')) return []
    if (!userdb.companyId) { throw new Error("User does not belong to any company"); }

    const customers = await prisma.customer.findMany({
      where: { companyId: userdb.companyId, isDeleted: false },
      orderBy: { name: 'asc' },
    })

    // 2️⃣ Get ALL accounts receivables for the company (only once)
    const companyAccounts = await prisma.account.findMany({
      where: { companyId: userdb.companyId, isDeleted: false, accountType: AccountTypes.Asset, accountSubType: AccountSubTypes.Receivable },
      select: {
        title: true,
        balance: true
      }
    })


    // 3️⃣ Merge customer with AR balance by filtering locally
    const enhanced = customers.map((customer) => {
      const arTitle = `${customer.name} Account Receivable`

      // Find matching account in the already-fetched list
      const arAccount = companyAccounts.find(acc => acc.title === arTitle)

      return {
        ...customer,
        arBalance: arAccount ? Number(arAccount.balance) : 0
      }
    })

    return enhanced
  } catch (error) {
    console.log ("Error getCustomer %O",error)
    return []
  }

}


/**
 * Get customer by ID (with AR balance)
 */
export async function getCustomerById(id: number) {
  'use server'

  // const session = await auth()
  // if (!session?.user)
  //   return { success: false, message: 'Not logged in' }

  // const tmpform = new FormData()
  // tmpform.append('email', session.user.email || '')
  // const userdb = await getuser({}, tmpform)
  // if (!userdb?.companyId)
  //   return { success: false, message: 'User has no company' }
  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!canManageCustomers(userdb, 'update')) { return { success: false, message: 'Permission denied' } }
    if (!userdb.companyId) { throw new Error("User does not belong to any company"); }

    // 1️⃣ Fetch customer
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        companyId: userdb.companyId,
        isDeleted: false,
      },
    })

    if (!customer)
      return { success: false, message: 'Customer not found' }

    // 2️⃣ Fetch customer AR account
    const arAccount = await prisma.account.findFirst({
      where: {
        companyId: userdb.companyId,
        isDeleted: false,
        accountType: AccountTypes.Asset,
        accountSubType: AccountSubTypes.Receivable,
        title: `${customer.name} Account Receivable`,
      },
      select: {
        balance: true,
      },
    })

    // 3️⃣ Attach balance
    return {
      ...customer,
      arBalance: arAccount ? Number(arAccount.balance) : 0,
    }
  } catch (error) {
    console.log("getCustomerById Error %O", error);
    return { success: false, message: 'error in retrieving customer infomation.' }
  }

}
