'use server'
import { prisma } from '../../../lib/prisma'

export type ResolvedSubscriptionContext = {
  planCode: string
  plan: {
    code: string
    maxInvites: number | null
    dailyTransactionLimit: number | null
    monthlyBackupLimit: number | null
    canViewAllReports: boolean
  }
  status: 'FREE' | 'ACTIVE' | 'GRACE' | 'EXPIRED'
  subscriptionId: number | null
}

export async function getCompanySubscriptionContext(companyId: number): Promise<ResolvedSubscriptionContext> {
  'use server'
  const subscription = await prisma.companySubscription.findUnique({
    where: { companyId },
    include: { subscriptionPlan: true },
  })

  // ✅ No subscription → Free plan
  if (!subscription) {
    const freePlan = await prisma.subscriptionPlan.findUnique({
      where: { code: 'FREE' },
    })

    if (!freePlan) {
      throw new Error('Free plan missing from database')
    }

    return {
      planCode: freePlan.code,
      plan: freePlan,
      status: 'FREE',
      subscriptionId: null,
    }
  }

  // Paid or admin plans
  return {
    planCode: subscription.subscriptionPlan.code,
    plan: subscription.subscriptionPlan,
    status: subscription.status,
    subscriptionId: subscription.id,
  }
}
