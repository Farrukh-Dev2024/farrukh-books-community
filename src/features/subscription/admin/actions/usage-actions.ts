'use server'
import { prisma } from '../../../../lib/prisma'
import { assertSuperAdminAccess } from '@/features/admindashboard/utils/utils'

export interface CompanyUsageRow {
  type: 'daily' | 'monthly'
  dateLabel: string       // e.g., '2025-12-30' for daily, 'Dec 2025' for monthly
  journalEntries: number  // daily journal usage
  backups: number         // daily or monthly backup usage
}

export async function adminGetCompanyUsageSummary(companyId: number): Promise<CompanyUsageRow[]> {
  'use server'
  await assertSuperAdminAccess()

  // --- Daily usage ---
  const dailyRaw = await prisma.companySubscriptionUsageDaily.findMany({
    where: { companyId },
    orderBy: { date: 'desc' },
    take: 30,
  })

  const dailyRows: CompanyUsageRow[] = dailyRaw.map(d => ({
    type: 'daily',
    dateLabel: d.date.toISOString().slice(0, 10),
    journalEntries: d.journalEntryCount ? Number(d.journalEntryCount) : 0,
    backups: 0,
  }))

  // --- Monthly usage ---
  const monthlyRaw = await prisma.companySubscriptionUsageMonthly.findMany({
    where: { companyId },
    orderBy: [
      { year: 'desc' },
      { month: 'desc' },
    ],
    take: 12,
  })

  const monthlyRows: CompanyUsageRow[] = monthlyRaw.map(m => ({
    type: 'monthly',
    dateLabel: `${m.year}-${String(m.month).padStart(2, '0')}`,
    journalEntries: 0,
    backups: m.backupCount ? Number(m.backupCount) : 0,
  }))

  // Combine daily and monthly
  return [...dailyRows, ...monthlyRows]
}
