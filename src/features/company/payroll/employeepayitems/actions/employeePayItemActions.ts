// src/features/payroll/employeepayitems/actions/employeePayItemActions.ts
'use server'

import { prisma } from '../../../../../lib/prisma'
import { assignEmployeePayItemSchema, updateEmployeePayItemSchema } from '../schemas/employeePayItemSchemas'
import { canManagePayItems } from "@/lib/permissions/permissions";
import { number } from 'zod'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'

/**
 * Note: This file exposes server-side actions that can be used either by API routes
 * or directly as Server Actions from server components.
 *
 * Flowchart (visual reference): /mnt/data/A_flowchart_diagram_created_using_a_digital_vector.png
 */

// helper to get DB user from the session
async function getDbUser() {
  const userdb = await getAuthUserCompanyOrThrow();
  return userdb ?? null
}

/* ---------------------------
   assignPayItemToEmployee
   --------------------------- */
export async function assignPayItemToEmployee(input: unknown) {
  const parsed = assignEmployeePayItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors }

  const userdb = await getDbUser()
  if (!userdb) return { success: false, message: 'Unauthorized', errors: {} }

  if (!canManagePayItems(userdb, 'create')) {
    return { success: false, message: 'Permission denied', errors: {} }
  }

  const { employeeId, payItemId, amount, isPercentage } = parsed.data

  // Validate employee and payItem exist and belong to same company
  const [employee, payItem] = await Promise.all([
    prisma.payrollEmployee.findUnique({ where: { id: employeeId } }),
    prisma.payItem.findUnique({ where: { id: payItemId } }),
  ])

  if (!employee || !payItem) {
    return { success: false, message: 'Employee or PayItem not found', errors: {} }
  }

  if (employee.companyId !== userdb.companyId || payItem.companyId !== userdb.companyId) {
    return { success: false, message: 'Cross-company assignment blocked', errors: {} }
  }

  // Prevent duplicate active assignment
  const existing = await prisma.payrollEmployeePayItem.findFirst({
    where: { employeeId, payItemId, isDeleted: false, companyId: userdb.companyId },
  })
  if (existing) {
    return { success: false, message: 'This PayItem is already assigned to the employee', errors: {} }
  }

  try {
    const created = await prisma.payrollEmployeePayItem.create({
      data: {
        companyId: userdb.companyId,
        employeeId,
        payItemId,
        amount: amount ?? null,
        isPercentage,
      },
    })
    return { success: true, item: created, message: 'Assigned' }
  } catch (err) {
    console.error('assignPayItemToEmployee error', err)
    return { success: false, message: 'Database error during assign', errors: {} }
  }
}

/* ---------------------------
   updateEmployeePayItem
   --------------------------- */
export async function updateEmployeePayItem(input: unknown) {
  const parsed = updateEmployeePayItemSchema.safeParse(input)
  if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors }

  const userdb = await getDbUser()
  if (!userdb) return { success: false, message: 'Unauthorized', errors: {} }

  if (!canManagePayItems(userdb, 'update')) {
    return { success: false, message: 'Permission denied', errors: {} }
  }

  const { id, employeeId, payItemId, amount, isPercentage } = parsed.data

  const existing = await prisma.payrollEmployeePayItem.findUnique({ where: { id } })
  if (!existing || existing.isDeleted) return { success: false, message: 'Assignment not found', errors: {} }

  const [employee, payItem] = await Promise.all([
    prisma.payrollEmployee.findUnique({ where: { id: employeeId } }),
    prisma.payItem.findUnique({ where: { id: payItemId } }),
  ])
  if (!employee || !payItem) return { success: false, message: 'Employee or PayItem not found', errors: {} }

  if (employee.companyId !== userdb.companyId || payItem.companyId !== userdb.companyId) {
    return { success: false, message: 'Cross-company update blocked', errors: {} }
  }

  try {
    const updated = await prisma.payrollEmployeePayItem.update({
      where: { id },
      data: {
        employeeId,
        payItemId,
        amount: amount ?? null,
        isPercentage,
        updatedAt: new Date(),
      },
    })
    return { success: true, item: updated, message: 'Updated' }
  } catch (err) {
    console.error('updateEmployeePayItem error', err)
    return { success: false, message: 'Database error while updating', errors: {} }
  }
}

/* ---------------------------
   removeEmployeePayItem (soft delete)
   --------------------------- */
export async function removeEmployeePayItem(id: number) {
  if (!id) return { success: false, message: 'Invalid id' }

  const userdb = await getDbUser()
  if (!userdb) return { success: false, message: 'Unauthorized', errors: {} }

  if (!canManagePayItems(userdb, 'delete')) {
    return { success: false, message: 'Permission denied', errors: {} }
  }

  const existing = await prisma.payrollEmployeePayItem.findUnique({ where: { id } })
  if (!existing || existing.isDeleted) return { success: false, message: 'Assignment not found', errors: {} }

  // Ensure same company
  const employee = await prisma.payrollEmployee.findUnique({ where: { id: existing.employeeId } })
  if (!employee || employee.companyId !== userdb.companyId) {
    return { success: false, message: 'Cross-company delete blocked', errors: {} }
  }

  try {
    await prisma.payrollEmployeePayItem.update({
      where: { id, companyId: userdb.companyId },
      data: { isDeleted: true },
    })
    return { success: true, message: 'Removed' }
  } catch (err) {
    console.error('removeEmployeePayItem error', err)
    return { success: false, message: 'Error removing assignment', errors: {} }
  }
}

/* ---------------------------
   getEmployeePayItems
   --------------------------- */
export async function getEmployeePayItems(employeeId: number) {
  const userdb = await getDbUser()
  if (!userdb) return { success: false, message: 'Unauthorized', items: [] }

  const employee = await prisma.payrollEmployee.findUnique({ where: { id: employeeId } })
  if (!employee || employee.companyId !== userdb.companyId) {
    return { success: false, message: 'Not found or access denied', items: [] }
  }

  const items = await prisma.payrollEmployeePayItem.findMany({
    where: { employeeId, isDeleted: false , companyId: userdb.companyId},
    include: { payItem: true },
    orderBy: { id: 'asc' },
  })

const safeItems = items.map((item) => ({
  ...item,
  amount: item.amount != null ? Number(item.amount) : null,
  payItem: {
    ...item.payItem,
    defaultAmount: item.payItem.defaultAmount != null ? Number(item.payItem.defaultAmount) : 0,
  },
}));

  return { success: true, safeItems }
}
