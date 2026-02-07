// src/features/subscription/guards/journal.guards.ts

import { prisma } from '../../../lib/prisma'
import { subscriptionError } from './subscription-error'
import {
  getSubscriptionState,
  getCompanyPlan,
} from '../utils/subscription-resolver'

function getStartOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export async function assertCanCreateJournal(companyId: number) {
  const state = await getSubscriptionState(companyId)

  if (state === 'EXPIRED') {
    subscriptionError('Subscription expired. Journal entry is read-only.')
  }

  const plan = await getCompanyPlan(companyId)

  // Unlimited journals
  if (plan.dailyTransactionLimit === null) {
    return
  }

  const date = getStartOfToday()

  const usage = await prisma.companySubscriptionUsageDaily.findUnique({
    where: {
      companyId_date: {
        companyId,
        date,
      },
    },
  })

  const used = usage?.journalEntryCount ?? 0

  if (used >= plan.dailyTransactionLimit) {
    subscriptionError(
      `Daily journal entry limit reached (${plan.dailyTransactionLimit}).`
    )
  }
}
