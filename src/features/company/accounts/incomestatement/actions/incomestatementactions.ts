// incomestatementactions.ts
'use server'

import { assertCanViewReport } from '@/features/subscription/guards/report.guards'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'
import { prisma } from '../../../../../lib/prisma'
import { AccountTypes, AccountSubTypes } from '@/types/project-types'

// 🔹 Generate Income Statement (Revenue – Expenses)
export async function getIncomeStatement(startDate: Date, endDate: Date) {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { error: 'Unauthorized' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)
    // if (!userdb?.companyId) return { error: 'Unauthorized' }

    const userdb = await getAuthUserCompanyOrThrow();
    const companyId = userdb.companyId
    if (!companyId) return { error: 'Unauthorized' }

    await assertCanViewReport(companyId, 'INCOME_STATEMENT');

    // Get all journal entries within date range for the company
    const journals = await prisma.journal.findMany({
      where: {
        companyId,
        isDeleted: false,
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        account: {
          select: {
            id: true,
            title: true,
            accountType: true,
            accountSubType: true,
            side: true,
          },
        },
      },
    })

    // Group by account
    const accountSummary: Record<
      string,
      { title: string; debit: number; credit: number; accountType: number, accountSubType: number }
    > = {}

    for (const j of journals) {
      const key = j.account.id.toString()

      if (!accountSummary[key]) {
        accountSummary[key] = {
          title: j.account.title,
          debit: 0,
          credit: 0,
          accountType: j.account.accountType,
          accountSubType: j.account.accountSubType,
        }
      }

      // side = true → Debit, false → Credit
      if (j.side) {
        accountSummary[key].debit += Number(j.amount)
      } else {
        accountSummary[key].credit += Number(j.amount)
      }
    }

    // 🔹 Map contra subtypes to their relevant main types
    for (const a of Object.values(accountSummary)) {
      if (a.accountType === AccountTypes.Contra) {
        switch (a.accountSubType) {
          case AccountSubTypes.ContraIncome:
            a.accountType = AccountTypes.Income
            // Reverse normal income effect (acts opposite)
            const tmpInc = a.debit
            a.debit = a.credit
            a.credit = tmpInc
            break

          case AccountSubTypes.ContraExpense:
            a.accountType = AccountTypes.Expense
            // Reverse normal expense effect
            const tmpExp = a.debit
            a.debit = a.credit
            a.credit = tmpExp
            break

          default:
            break
        }
      }
    }

    // Separate income (revenue) and expense accounts
    const incomeRows = Object.values(accountSummary).filter(
      (a) => a.accountType === AccountTypes.Income
    )
    const expenseRows = Object.values(accountSummary).filter(
      (a) => a.accountType === AccountTypes.Expense
    )

    // Calculate totals
    const totalIncome = incomeRows.reduce((sum, a) => sum + (a.credit - a.debit), 0)
    const totalExpense = expenseRows.reduce((sum, a) => sum + (a.debit - a.credit), 0)
    const netIncome = totalIncome - totalExpense

    return {
      income: incomeRows,
      expenses: expenseRows,
      totalIncome,
      totalExpense,
      netIncome,
    }
  } catch (error) {
    console.error('Error generating income statement:', error)
    const message = error instanceof Error ? error.message : String(error);
    //throw new Error(message);
    return { error: message || 'Failed to generate income statement' }
  }
}
