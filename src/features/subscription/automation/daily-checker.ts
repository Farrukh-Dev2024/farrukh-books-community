// src/features/subscription/automation/daily-checker.ts
'use server'
import { prisma } from '../../../lib/prisma'
import { downgradeCompanyToFree } from './auto-downgrade'

const GRACE_DAYS = 7

export async function runDailySubscriptionCheck() {
  'use server'
  const now = new Date()

  const subs = await prisma.companySubscription.findMany({
    where: { status: 'ACTIVE', endsAt: { lt: now } },
  })

  for (const sub of subs) {
    if (!sub.graceEndsAt) {
      await prisma.companySubscription.update({
        where: { id: sub.id },
        data: {
          status: 'GRACE',
          graceEndsAt: new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000),
        },
      })
      continue
    }

    if (sub.graceEndsAt < now) {
      await downgradeCompanyToFree(sub.companyId)
    }
  }
}
