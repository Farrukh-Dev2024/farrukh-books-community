// src\features\admindashboard\actions\usermanagement\user-actions.ts
'use server'

import { prisma } from '../../../../lib/prisma'
import {
  assertAdminAccess,
  assertSuperAdminAccess,
  hasAccess,
} from '@/features/admindashboard/utils/utils'
import { UserRoles } from '@/types/project-types'
import { getAuthUserOrThrow } from '@/lib/permissions/helperfunctions'
import { compare,hash } from "bcryptjs"

type ActionResult = {
  success: boolean
  message?: string
}

function safeError(message = 'Operation failed'): ActionResult {
  return { success: false, message }
}

/* =========================
   READ
========================= */

export async function getUsersForAdmin() {
  try {
    await assertAdminAccess()

    return await prisma.user.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        userRole: true,
        isBanned: true,
        isDeleted: true,
        createdAt: true,
      },
    })
  } catch (error) {
    console.error('getUsersForAdmin error:', error)
    return []
  }
}

/* =========================
   ADMIN ACTIONS
========================= */

export async function banUser(userId: number): Promise<ActionResult> {
  try {
    const access = await assertAdminAccess()
    const userdb = await getAuthUserOrThrow()

    if (userdb.id === userId)
      return safeError('You cannot ban yourself')

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.isDeleted) return safeError('User not found')

    if (user.userRole === UserRoles.SuperAdmin)
      return safeError('Cannot ban SuperAdmin')

    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        forceLogoutAt: new Date(),
      },
    })

    await logAudit('BAN_USER', userId, userdb.id)
    return { success: true }
  } catch (error) {
    console.error('banUser error:', error)
    return safeError()
  }
}

export async function unbanUser(userId: number): Promise<ActionResult> {
  try {
    await assertAdminAccess()

    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: false },
    })

    return { success: true }
  } catch (error) {
    console.error('unbanUser error:', error)
    return safeError()
  }
}

export async function forceLogoutUser(userId: number): Promise<ActionResult> {
  try {
    const access = await assertAdminAccess()
    const userdb = await getAuthUserOrThrow()
    
    if (userdb.id === userId)
      return safeError('You cannot force logout yourself')

    await prisma.user.update({
      where: { id: userId },
      data: { forceLogoutAt: new Date() },
    })

    await logAudit('FORCE_LOGOUT', userId, userdb.id)
    return { success: true }
  } catch (error) {
    console.error('forceLogoutUser error:', error)
    return safeError()
  }
}

export async function updateUserMessage(
  userId: number,
  message: string | null
): Promise<ActionResult> {
  try {
    await assertAdminAccess()
    

    await prisma.user.update({
      where: { id: userId },
      data: { messages: message },
    })

    return { success: true }
  } catch (error) {
    console.error('updateUserMessage error:', error)
    return safeError()
  }
}

/* =========================
   SUPER ADMIN ACTIONS
========================= */

export async function changeUserRole(
  userId: number,
  role: number
): Promise<ActionResult> {
  try {
    await assertSuperAdminAccess()
    const userdb = await getAuthUserOrThrow()

    if (userdb.id === userId)
      return safeError('You cannot change your own role')

    await prisma.user.update({
      where: { id: userId },
      data: { userRole: role },
    })

    await logAudit('CHANGE_ROLE', userId, userdb.id)
    return { success: true }
  } catch (error) {
    console.error('changeUserRole error:', error)
    return safeError()
  }
}

export async function softDeleteUser(userId: number): Promise<ActionResult> {
  try {
    await assertSuperAdminAccess()
    const userdb = await getAuthUserOrThrow()

    if (userdb.id === userId)
      return safeError('You cannot delete yourself')

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return safeError('User not found')

    if (user.userRole === UserRoles.SuperAdmin)
      return safeError('Cannot delete SuperAdmin')

    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        isBanned: true,
        forceLogoutAt: new Date(),
      },
    })

    await logAudit('DELETE_USER', userId, userdb.id)
    return { success: true }
  } catch (error) {
    console.error('softDeleteUser error:', error)
    return safeError()
  }
}

export async function forceResetPassword(userId: number): Promise<ActionResult> {
  try {
    await assertSuperAdminAccess()
    const userdb = await getAuthUserOrThrow()

    // if (userdb.id === userId)
    //   return safeError('You cannot reset your own password')

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return safeError('User not found')

      const password = '123456789'
      const hashedPassword = await hash(password+process.env.NEXTAUTH_SECRET, 10) 

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        forceLogoutAt: new Date(),
      },
    })

    await logAudit('FORCE_RESET_PASSWORD', userId, userdb.id)
    return { success: true }
  } catch (error) {
    console.error('forceResetPassword error:', error)
    return safeError()
  }
}
/* =========================
   AUDIT LOG
========================= */

async function logAudit(
  action: string,
  targetUserId: number,
  performedBy: number
) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        action,
        targetUserId,
        performedBy,
      },
    })
  } catch (error) {
    console.error('Audit log failed:', error)
  }
}
