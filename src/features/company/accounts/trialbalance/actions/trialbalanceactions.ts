//trialbalanceactions.ts
'use server'

import { prisma } from '../../../../../lib/prisma'
import { JournalWhereBase } from '@/types/project-types'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'
import { assertCanViewReport } from '@/features/subscription/guards/report.guards'

type TrialBalanceRow = {
  accountId: number
  accountTitle: string
  debit: number // summed debits
  credit: number // summed credits
}

/**
 * Get trial balance for the current user's company.
 * Optional from/to ISO date strings to filter Journal.entryDate.
 */
export async function getTrialBalance({ from, to }: { from?: string; to?: string } = {}): Promise<TrialBalanceRow[] | [] | { error: string }> {
  'use server'
  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return []

    const companyId = userdb.companyId
    if (!companyId) return []

    await assertCanViewReport(companyId, 'TRIAL_BALANCE');

    const whereBase: JournalWhereBase = { companyId, isDeleted: false }
    if (from || to) {
      whereBase.entryDate = {}
      if (from) whereBase.entryDate.gte = new Date(from)
      if (to) whereBase.entryDate.lte = new Date(to)
    }

    // Sum debits (side = true)
    const debits = await prisma.journal.groupBy({
      by: ['accountId'],
      where: { ...whereBase, side: true, companyId, isDeleted: false },
      _sum: { amount: true },
    })

    // Sum credits (side = false)
    const credits = await prisma.journal.groupBy({
      by: ['accountId'],
      where: { ...whereBase, side: false, companyId, isDeleted: false },
      _sum: { amount: true },
    })

    // Get accounts for titles
    const accounts = await prisma.account.findMany({
      where: { companyId, isDeleted: false },
      select: { id: true, title: true },
    })

    // Merge results into rows
    const map = new Map<number, { debit: number; credit: number }>()

    for (const d of debits) {
      const accId = d.accountId
      const val = d._sum.amount ?? 0
      const n = Number(val) || 0
      map.set(accId, { ...(map.get(accId) ?? { debit: 0, credit: 0 }), debit: n })
    }

    for (const c of credits) {
      const accId = c.accountId
      const val = c._sum.amount ?? 0
      const n = Number(val) || 0
      map.set(accId, { ...(map.get(accId) ?? { debit: 0, credit: 0 }), credit: n })
    }

    const rows: TrialBalanceRow[] = []
    for (const [accountId, sums] of map) {
      const acct = accounts.find((a) => a.id === accountId)
      rows.push({
        accountId,
        accountTitle: acct?.title ?? 'Unknown',
        debit: sums.debit ?? 0,
        credit: sums.credit ?? 0,
      })
    }

    // Also include accounts that have zero journal entries (optional)
    for (const acct of accounts) {
      if (!map.has(acct.id)) {
        rows.push({
          accountId: acct.id,
          accountTitle: acct.title,
          debit: 0,
          credit: 0,
        })
      }
    }

    // sort alphabetically
    rows.sort((a, b) => a.accountTitle.localeCompare(b.accountTitle || ''))

    return rows
  } catch (error) {
    console.log("Error getTrialBalance %O",error)

    const message = error instanceof Error ? error.message : null
    return { error: message || 'Failed to generate trial balance' }
  }

}
