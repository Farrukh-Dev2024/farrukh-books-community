'use server'
import { prisma } from '../../../lib/prisma'
import { getServerYearMonth } from '../utils/date-buckets'

export async function incrementMonthlyBackupUsage(companyId: number) {
  'use server'
  const { year, month } = getServerYearMonth()

  await prisma.companySubscriptionUsageMonthly.upsert({
    where: {
      companyId_year_month: {
        companyId,
        year,
        month,
      },
    },
    create: {
      companyId,
      year,
      month,
      backupCount: 1,
    },
    update: {
      backupCount: { increment: 1 },
    },
  })
}

/*
Where this is called
Inside your backup creation server action, after backup success:

await prisma.$transaction(async (tx) => {
  await tx.backup.create({ ... })

  await incrementMonthlyBackupUsage(companyId)
})
*/  