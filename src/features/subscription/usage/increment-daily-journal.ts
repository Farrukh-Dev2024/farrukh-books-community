'use server'
import { prisma } from '../../../lib/prisma'
import { getServerStartOfDay } from '../utils/date-buckets'

export async function incrementDailyJournalUsage(companyId: number) {
  'use server'
  const today = getServerStartOfDay()

  await prisma.companySubscriptionUsageDaily.upsert({
    where: {
      companyId_date: {
        companyId,
        date: today,
      },
    },
    create: {
      companyId,
      date: today,
      journalEntryCount: 1,
    },
    update: {
      journalEntryCount: { increment: 1 },
    },
  })
}

/**
Inside your journal create server action, only after successful DB commit:
await prisma.$transaction(async (tx) => {
  await tx.journal.create({ ... })

  await incrementDailyJournalUsage(companyId)
})
 */