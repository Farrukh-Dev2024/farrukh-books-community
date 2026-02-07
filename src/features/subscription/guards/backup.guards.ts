// src/features/subscription/guards/backup.guards.ts
'use server'
import { prisma } from '../../../lib/prisma'
import { subscriptionError } from './subscription-error'
import { getCompanyPlan, getSubscriptionState } from '../utils/subscription-resolver'

function getStartOfMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export async function assertCanCreateBackup(companyId: number) {
  'use server'
  const state = await getSubscriptionState(companyId)

  if (state === 'EXPIRED' || state === 'GRACE') {
    subscriptionError('Backup creation is disabled in grace or expired state.')
  }

  const plan = await getCompanyPlan(companyId)

  if (plan.monthlyBackupLimit === null) {
    return
  }

  const monthStart = getStartOfMonth()

  const usage = await prisma.companySubscriptionUsageMonthly.findUnique({
    where: {
      companyId_year_month: {
        companyId,
        year: monthStart.getFullYear(),
        month: monthStart.getMonth() + 1, // JS months are 0-indexed
      },
    },
  })

  const used = usage?.backupCount ?? 0

  if (used >= plan.monthlyBackupLimit) {
    subscriptionError(
      `Monthly backup limit reached (${plan.monthlyBackupLimit}).`
    )
  }
}
