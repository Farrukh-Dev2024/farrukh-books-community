'use server'

import { prisma } from '../../../../lib/prisma'
import { assertAdminAccess, assertSuperAdminAccess } from '../../utils/utils'
import { UserRoles } from '@/types/project-types'
import { CompanyRoles } from '@/types/project-types'

/**
 * Helpers
 */
async function getCompanyOrThrow(companyId: number) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  })

  if (!company) {
    throw new Error('Company not found')
  }

  return company
}

/**
 * ----------------------------------------
 * COMPANY METADATA
 * ----------------------------------------
 */

export async function updateCompanyDetails(
  companyId: number,
  data: {
    title?: string
    description?: string
  }
) {
  await assertAdminAccess()

  const company = await getCompanyOrThrow(companyId)

  if (company.isDeleted) {
    return { success: false, message: 'Company is deleted' }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: {
      title: data.title,
      description: data.description,
    },
  })

  return { success: true }
}

/**
 * ----------------------------------------
 * COMPANY SUSPENSION
 * ----------------------------------------
 */

export async function suspendCompany(companyId: number) {
  await assertAdminAccess()

  const company = await getCompanyOrThrow(companyId)

  if (company.isSuspended) {
    return { success: true }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { isSuspended: true },
  })

  return { success: true }
}

export async function unsuspendCompany(companyId: number) {
  await assertAdminAccess()

  const company = await getCompanyOrThrow(companyId)

  if (!company.isSuspended) {
    return { success: true }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { isSuspended: false },
  })

  return { success: true }
}

/**
 * ----------------------------------------
 * USER ↔ COMPANY MANAGEMENT
 * ----------------------------------------
 */

export async function addUserToCompany(
  userId: number,
  companyId: number,
  companyRole: number
) {
  await assertAdminAccess()

  const company = await getCompanyOrThrow(companyId)

  if (company.isDeleted) {
    return { success: false, message: 'Company is deleted' }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      companyId,
      companyRole,
    },
  })

  return { success: true }
}

export async function removeUserFromCompany(userId: number) {
  await assertAdminAccess()

  await prisma.user.update({
    where: { id: userId },
    data: {
      companyId: null,
      companyRole: CompanyRoles.Viewonly,
    },
  })

  return { success: true }
}

export async function changeUserCompanyRole(
  userId: number,
  companyRole: number
) {
  await assertAdminAccess()

  await prisma.user.update({
    where: { id: userId },
    data: {
      companyRole,
    },
  })

  return { success: true }
}

/**
 * ----------------------------------------
 * COMPANY DELETE / UNDELETE (SUPERADMIN ONLY)
 * ----------------------------------------
 */

export async function deleteCompany(companyId: number) {
  await assertSuperAdminAccess()

  const company = await getCompanyOrThrow(companyId)

  if (company.isDeleted) {
    return { success: true }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { isDeleted: true },
  })

  return { success: true }
}

export async function undeleteCompany(companyId: number) {
  await assertSuperAdminAccess()

  const company = await getCompanyOrThrow(companyId)

  if (!company.isDeleted) {
    return { success: true }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: { isDeleted: false },
  })

  return { success: true }
}


export async function getCompaniesForAdmin() {
  await assertAdminAccess()

  const companies = await prisma.company.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      description: true,
      isSuspended: true,
      isDeleted: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  })

  return companies.map((company) => ({
    id: company.id,
    title: company.title,
    description: company.description,
    isSuspended: company.isSuspended,
    isDeleted: company.isDeleted,
    usersCount: company._count.users,
  }))
}

export async function getAllPlatformUsers() {
  await assertAdminAccess()

  const users = await prisma.user.findMany({
    where: {
      // Assuming you have a soft delete field if needed
       isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      companyId: true,
      companyRole: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return users
}

export type User = {
  id: number
  name: string | null
  email: string
  companyId: number | null
  companyRole: number | null
}

export type Company = {
    id: number
    title: string
    isDeleted: boolean
}
