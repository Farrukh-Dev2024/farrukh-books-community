// company-subscription-actions.ts
'use server'
import { prisma } from '../../../../lib/prisma'
import { assertSuperAdminAccess } from '@/features/admindashboard/utils/utils'
import { SubscriptionRow } from '@/types/prisma-types'
import { getAuthUserOrThrow } from '@/lib/permissions/helperfunctions'

export async function adminAssignWebsiteTesterPlan(
  companyId: number,
  days = 30
) {
  'use server'
  await assertSuperAdminAccess()
  const userdb = await getAuthUserOrThrow()

  const testerPlan = await prisma.subscriptionPlan.findFirstOrThrow({
    where: { code: 'WEBSITE_TESTER' },
  })

  const now = new Date()
  const endsAt = new Date(now.getTime() + days * 86400000)

  return prisma.companySubscription.upsert({
    where: { companyId },
    update: {
      subscriptionPlanId: testerPlan.id,
      status: 'ACTIVE',
      startedAt: now,
      endsAt,
      graceEndsAt: null,
      canceledAt: null,
    },
    create: {
      companyId,
      subscriptionPlanId: testerPlan.id,
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      startedAt: now,
      endsAt,
      createdByUserId: userdb.id, // admin user
    },
  })
}

export async function adminForceChangeCompanyPlan(
  companyId: number,
  planCode: string,
  billingCycle: 'MONTHLY' | 'YEARLY',
  durationDays?: number
) {
  'use server'
  await assertSuperAdminAccess()
  const user = await getAuthUserOrThrow()

  const plan = await prisma.subscriptionPlan.findFirstOrThrow({
    where: { code: planCode },
  })

  const now = new Date()
  const endsAt =
    durationDays
      ? new Date(now.getTime() + durationDays * 86400000)
      : billingCycle === 'YEARLY'
        ? new Date(now.getTime() + 365 * 86400000)
        : new Date(now.getTime() + 30 * 86400000)

await prisma.adminAuditLog.create({
  data: {
    action: 'ADMIN_EDIT_SUBSCRIPTION',
    performedBy: user.id,
    targetCompanyId: companyId,
    entityType: 'Subscription',
    entityId: companyId.toString(),
    meta: {
      planCode,
      preservedTime: true,
    },
  },
})        
  return prisma.companySubscription.update({
    where: { companyId },
    data: {
      subscriptionPlanId: plan.id,
      billingCycle,
      status: 'ACTIVE',
      startedAt: now,
      endsAt,
      graceEndsAt: null,
      canceledAt: null,
    },
  })
}

export async function adminExtendGracePeriod(
  companyId: number,
  extraDays: number
) {
  'use server'
  await assertSuperAdminAccess()

  const sub = await prisma.companySubscription.findUniqueOrThrow({
    where: { companyId },
  })

  const base = sub.graceEndsAt ?? new Date()
  const newGraceEndsAt = new Date(
    base.getTime() + extraDays * 86400000
  )

  return prisma.companySubscription.update({
    where: { companyId },
    data: { graceEndsAt: newGraceEndsAt },
  })
}

export async function adminGetAllCompanySubscriptions(): Promise<SubscriptionRow[]> {
  'use server'
  try {
    await assertSuperAdminAccess()

    const subscriptions = await prisma.companySubscription.findMany({
      include: {
        company: true,
        subscriptionPlan: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const safeSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      companyId: sub.companyId,
      companyTitle: sub.company.title!,           // flattened
      planId: sub.subscriptionPlanId,
      planCode: sub.subscriptionPlan.code,     // flattened
      planName: sub.subscriptionPlan.name,     // flattened
      billingCycle: sub.billingCycle,
      status: sub.status,
      startedAt: sub.startedAt,
      endsAt: sub.endsAt,
      graceEndsAt: sub.graceEndsAt,
      canceledAt: sub.canceledAt,
      monthlyPrice: sub.subscriptionPlan.monthlyPrice
        ? Number(sub.subscriptionPlan.monthlyPrice)
        : null,
      yearlyPrice: sub.subscriptionPlan.yearlyPrice
        ? Number(sub.subscriptionPlan.yearlyPrice)
        : null,
      maxInvites: sub.subscriptionPlan.maxInvites,
      dailyTransactionLimit: sub.subscriptionPlan.dailyTransactionLimit,
      monthlyBackupLimit: sub.subscriptionPlan.monthlyBackupLimit,
      canViewAllReports: sub.subscriptionPlan.canViewAllReports,
      autoExpireDays: sub.subscriptionPlan.autoExpireDays,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));
    return safeSubscriptions;
  } catch (error) {
    console.error("Error in adminGetAllCompanySubscriptions: ", error);
    return [];
  }

}