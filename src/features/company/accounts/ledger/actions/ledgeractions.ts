// src/features/company/accounts/actions/ledgeractions.ts
'use server'

import { prisma } from '../../../../../lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { assertCanViewReport } from '@/features/subscription/guards/report.guards'

const LedgerParams = z.object({
  accountId: z.number(),
  startDate: z.date(),
  endDate: z.date(),
})

export async function getGeneralLedgerEntries(params: z.infer<typeof LedgerParams>) {
  'use server'
  try {
    const session = await auth()
    if (!session?.user) return []

    const { accountId, startDate, endDate } = params

    // Fetch the account info (for side and validation)
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        isDeleted: false,
      },
      select: {
        id: true,
        companyId: true,
        side: true, // true = Debit, false = Credit
        balance: true,
      },
    })

    if (!account) return []
    await assertCanViewReport(account.companyId, 'LEDGER');

    // Fetch journal entries for this account within date range
    const journals = await prisma.journal.findMany({
      where: {
        accountId,
        isDeleted: false,
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        entryDate: 'asc',
      },
    })

    // Compute running balance
    let runningBalance = Number(account.balance)
    const entries = journals.map((j) => {
      const amount = Number(j.amount)
      const isDebit = j.side === true
      let debit = 0
      let credit = 0

      if (isDebit) debit = amount
      else credit = amount

      // Update balance according to account's inherent side
      if (account.side) runningBalance += debit - credit
      else runningBalance += credit - debit

      return {
        id: j.id,
        date: j.entryDate,
        description: j.description,
        debit,
        credit,
        balance: runningBalance,
      }
    })

    return entries
  } catch (error) {
    const message = error instanceof Error ? error.message : null
    console.error('Error fetching general ledger entries:', error)
    return { error: message || 'Failed to generate income statement' }
  }

}
