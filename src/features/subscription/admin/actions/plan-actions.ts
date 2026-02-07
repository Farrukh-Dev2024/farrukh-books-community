// plan-actions.ts
'use server'

import { prisma } from '../../../../lib/prisma'
import { assertSuperAdminAccess } from '@/features/admindashboard/utils/utils'

export async function adminGetAllSubscriptionPlans() {
  'use server'
  await assertSuperAdminAccess()

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { id: 'asc' },
  })

  return plans.map(plan => ({
    ...plan,
    monthlyPrice: plan.monthlyPrice ? Number(plan.monthlyPrice) : null,
    yearlyPrice: plan.yearlyPrice ? Number(plan.yearlyPrice) : null,
  }))
}

export async function adminUpdateSubscriptionPlan(
  planId: number,
  data: {
    name?: string
    monthlyPrice?: number | null
    yearlyPrice?: number | null
    maxInvites?: number | null
    dailyTransactionLimit?: number | null
    monthlyBackupLimit?: number | null
    canViewAllReports?: boolean
    autoExpireDays?: number | null
  }
) {
  'use server'
  await assertSuperAdminAccess()

  const updatedPlan = await prisma.subscriptionPlan.update({
    where: { id: planId },
    data,
  })
  const safeUpdatedPlan = {
    ...updatedPlan,
    monthlyPrice: updatedPlan.monthlyPrice ? Number(updatedPlan.monthlyPrice) : null,
    yearlyPrice: updatedPlan.yearlyPrice ? Number(updatedPlan.yearlyPrice) : null,
  }

  return safeUpdatedPlan
}

export async function adminToggleSubscriptionPlanAdminOnly(
  planId: number,
  isAdminOnly: boolean
) {
  'use server'
  await assertSuperAdminAccess()

  const updatedPlan = await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: { isAdminOnly },
  })
  const safeUpdatedPlan = {
    ...updatedPlan,
    monthlyPrice: updatedPlan.monthlyPrice ? Number(updatedPlan.monthlyPrice) : null,
    yearlyPrice: updatedPlan.yearlyPrice ? Number(updatedPlan.yearlyPrice) : null,
  }
  return safeUpdatedPlan
}
