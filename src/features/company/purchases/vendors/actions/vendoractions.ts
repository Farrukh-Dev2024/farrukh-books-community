'use server'

import { prisma } from '../../../../../lib/prisma'
import { AccountSubTypes, AccountTypes, PrevState } from '@/types/project-types'
import { canManageVendors } from '@/lib/permissions/permissions'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'

/**
 * Create new vendor
 */
export async function createVendor(prevState: PrevState, formData: FormData): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'Not logged in' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)

    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return { success: false, message: 'User has no company' }
    if (!canManageVendors(userdb, 'create')) return { success: false, message: 'Permission denied' }

    const name = formData.get('name')?.toString().trim()
    const email = formData.get('email')?.toString().trim() || null
    const phone = formData.get('phone')?.toString().trim() || null
    const address = formData.get('address')?.toString().trim() || null
    const city = formData.get('city')?.toString().trim() || null
    const country = formData.get('country')?.toString().trim() || null

    if (!name) {
      return { success: false, message: 'Name is required', errors: { name: ['Required'] } }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create account payable
      const account1 = await tx.account.create({
        data: {
          companyId: userdb.companyId!,
          title: name + ' Account Payable',
          description: 'Auto-created account for vendor ' + name,
          balance: 0,
          accountType: AccountTypes.Liability,
          accountSubType: AccountSubTypes.Payable,
          side: false, // Credit side for Liabilities
        },
      })

      // Create contra account payable
      const account2 = await tx.account.create({
        data: {
          companyId: userdb.companyId!,
          title: name + ' Contra Account Payable',
          description: 'Auto-created contra account for vendor ' + name,
          balance: 0,
          accountType: AccountTypes.Contra,
          accountSubType: AccountSubTypes.Payable,
          side: true, // Debit side for contra
        },
      })

      // Create vendor record
      await tx.vendor.create({
        data: {
          accountId1: account1.id,
          accountId2: account2.id,
          companyId: userdb.companyId!,
          name,
          email,
          phone,
          address,
          city,
          country,
          createdById: userdb.id,
          updatedById: userdb.id,
        },
      })
    })

    return { success: true, message: 'Vendor created successfully', errors: {} }
  } catch (error) {
    console.error('Error creating vendor: %O', error)
    return { success: false, message: 'Failed to create vendor', errors: {} }
  }
}

/**
 * Update existing vendor
 */
export async function updateVendor(prevState: PrevState, formData: FormData): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'Not logged in' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)

    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return { success: false, message: 'User has no company' }
    if (!canManageVendors(userdb, 'update')) return { success: false, message: 'Permission denied' }

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

    await prisma.vendor.update({
      where: { id, companyId: userdb.companyId },
      data: { name, email, phone, address, city, country, updatedById: userdb.id },
    })

    return { success: true, message: 'Vendor updated successfully', errors: {} }
  } catch (error) {
    console.error('Error updating vendor: %O', error)
    return { success: false, message: 'Failed to update vendor', errors: {} }
  }
}

/**
 * Soft delete vendor
 */
export async function deleteVendor(id: number): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'Not logged in' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)

    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return { success: false, message: 'User has no company' }
    if (!canManageVendors(userdb, 'delete')) return { success: false, message: 'Permission denied' }

    await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.findFirst({
        where: { id, companyId: userdb.companyId!, isDeleted: false },
        select: { id: true, accountId1: true, accountId2: true },
      })

      if (!vendor) throw new Error('Vendor not found')

      // Soft delete vendor
      await tx.vendor.update({
        where: { id: vendor.id },
        data: { isDeleted: true, updatedById: userdb.id },
      })

      // Soft delete related accounts
      const accountIds = [vendor.accountId1, vendor.accountId2].filter((x): x is number => x != null)
      if (accountIds.length > 0) {
        await tx.account.updateMany({
          where: { id: { in: accountIds }, companyId: userdb.companyId! },
          data: { isDeleted: true },
        })
      }
    })

    return { success: true, message: 'Vendor and linked accounts deleted successfully', errors: {} }
  } catch (error) {
    console.error('Error deleting vendor: %O', error)
    return { success: false, message: 'Failed to delete vendor', errors: {} }
  }
}

/**
 * Get all vendors for logged-in company
 */
export async function getVendors() {
  'use server'

  // const session = await auth()
  // if (!session?.user) return []

  // const tmpform = new FormData()
  // tmpform.append('email', session.user.email || '')
  // const userdb = await getuser({}, tmpform)
  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return []
    if (!canManageVendors(userdb, 'read')) return []

    const vendors = await prisma.vendor.findMany({
      where: { companyId: userdb.companyId, isDeleted: false },
      orderBy: { name: 'asc' },
    })

    // 2️⃣ Get ALL accounts payables for the company (only once)
    const companyAccounts = await prisma.account.findMany({
      where: {
        companyId: userdb.companyId,
        isDeleted: false,
        accountType: AccountTypes.Liability,
        accountSubType: AccountSubTypes.Payable,
      },
      select: {
        title: true,
        balance: true,
      },
    })

    // 3️⃣ Merge vendor with AP balance by filtering locally
    const enhanced = vendors.map((vendor) => {
      const apTitle = `${vendor.name} Account Payable`
      const apAccount = companyAccounts.find(acc => acc.title === apTitle)

      return {
        ...vendor,
        apBalance: apAccount ? Number(apAccount.balance) : 0,
      }
    })

    return enhanced    
  } catch (error) {
    console.log ("Error in getVendors %O" , error)
    return []
  }

}


// /**
//  * Get vendor by ID
//  */
// export async function getVendorById(id: number) {
//   'use server'
//   const session = await auth()
//   if (!session?.user) return { success: false, message: 'Not logged in' }

//   const tmpform = new FormData()
//   tmpform.append('email', session.user.email || '')
//   const userdb = await getuser({}, tmpform)
//   if (!userdb?.companyId) return { success: false, message: 'User has no company' }
//   if (!canManageVendors(userdb, 'update')) return { success: false, message: 'Permission denied' }

//   const vendor = await prisma.vendor.findFirst({
//     where: { id, companyId: userdb.companyId, isDeleted: false },
//   })

//   return vendor
// }

/**
 * Get vendor by ID
 */
export async function getVendorById(id: number) {
  'use server'

  // const session = await auth()
  // if (!session?.user) return { success: false, message: 'Not logged in' }

  // const tmpform = new FormData()
  // tmpform.append('email', session.user.email || '')
  // const userdb = await getuser({}, tmpform)
  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return { success: false, message: 'User has no company' }
    if (!canManageVendors(userdb, 'update')) return { success: false, message: 'Permission denied' }

    const vendor = await prisma.vendor.findFirst({
      where: { id, companyId: userdb.companyId, isDeleted: false },
    })

    if (!vendor) {
      return { success: false, message: 'Vendor not found' }
    }

    // 🔹 Find vendor AP account
    const apTitle = `${vendor.name} Account Payable`

    const apAccount = await prisma.account.findFirst({
      where: {
        companyId: userdb.companyId,
        isDeleted: false,
        accountType: AccountTypes.Liability,
        accountSubType: AccountSubTypes.Payable,
        title: apTitle,
      },
      select: {
        balance: true,
      },
    })

    return {
      ...vendor,
      apBalance: apAccount ? Number(apAccount.balance) : 0,
    }    
  } catch (error) {
    console.log("getVendorByid failed  %O", error)
    return { success: false, message: 'getVendorByid failed..' }
  }

}
