'use server'

import { prisma } from '../../../../lib/prisma'
import { assertFullAccess } from '@/features/subscription/guards/company-subscription-access'

export async function getCompanySubscriptionOverview() {
  'use server'
  const user = await assertFullAccess()
  const companyId = user.companyId!

  // Get latest company subscription
  const subscription = await prisma.companySubscription.findFirstOrThrow({
    where: { companyId },
    include: { subscriptionPlan: true },
    orderBy: { createdAt: 'desc' },
  })

  // Daily journal usage
  const today = new Date().toISOString().slice(0, 10)
  const dailyUsage = await prisma.companySubscriptionUsageDaily.findUnique({
    where: { companyId_date: { companyId, date: today } },
  })

  // Monthly backup usage
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  const monthlyBackup = await prisma.companySubscriptionUsageMonthly.findUnique({
    where: { companyId_year_month: { companyId, year, month } },
  })

  return {
    subscription,
    dailyUsage: dailyUsage?.journalEntryCount ?? 0,
    monthlyBackup: monthlyBackup?.backupCount ?? 0,
  }
}
