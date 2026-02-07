'use server'

import { assertCanViewReport } from '@/features/subscription/guards/report.guards'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'
import { prisma } from '../../../../../lib/prisma'
import { AccountTypes, AccountSubTypes } from '@/types/project-types'

// 🧾 Generate Balance Sheet (Assets = Liabilities + Equity)
export async function getBalanceSheet(endDate: Date) {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { error: 'Unauthorized' }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)

    const userdb = await getAuthUserCompanyOrThrow();    
    if (!userdb?.companyId) return { error: 'Unauthorized' }

    const companyId = userdb.companyId
    await assertCanViewReport(companyId, 'BALANCE_SHEET');
    
    // Get all journal entries up to selected date
    const journals = await prisma.journal.findMany({
      where: {
        companyId,
        isDeleted: false,
        entryDate: { lte: endDate },
      },
      include: {
        account: {
          select: {
            id: true,
            title: true,
            description: true,
            accountType: true,
            accountSubType: true,
            side: true,
          },
        },
      },
    })

    const accountSummary: Record<
      string,
      {
        title: string
        description: string
        debit: number
        credit: number
        accountType: number
        accountSubType: number
      }
    > = {}

    for (const j of journals) {
      const key = j.account.id.toString()
      if (!accountSummary[key]) {
        accountSummary[key] = {
          title: j.account.title,
          description: j.account.description,
          debit: 0,
          credit: 0,
          accountType: j.account.accountType,
          accountSubType: j.account.accountSubType,
        }
      }

      if (j.side) accountSummary[key].debit += Number(j.amount)
      else accountSummary[key].credit += Number(j.amount)
    }

    const accounts = Object.values(accountSummary)

    // Calculate Income & Expenses for Net Income
    const incomeRows = accounts.filter((a) => a.accountType === AccountTypes.Income)
    const expenseRows = accounts.filter((a) => a.accountType === AccountTypes.Expense)

    const totalIncome = incomeRows.reduce((sum, a) => sum + (a.credit - a.debit), 0)
    const totalExpense = expenseRows.reduce((sum, a) => sum + (a.debit - a.credit), 0)
    const netIncome = totalIncome - totalExpense

    // Helper for grouping and applying contra accounts
    const groupWithContra = (
      mainTypes: number[],
      contraTypes: number[],
      isDebitNormal: boolean
    ) => {
      const mains = accounts.filter((a) => a.accountType !== AccountTypes.Contra && mainTypes.includes(a.accountType) && !a.description.includes('Auto-created'))
      const contras = accounts.filter((a) => a.accountType === AccountTypes.Contra && contraTypes.includes(a.accountSubType) && !a.description.includes('Auto-created')) 

      return mains.map((main) => {
        const relatedContra = contras.filter((c) => {
          if (main.accountType === AccountTypes.Asset && main.accountSubType === c.accountSubType ) return true
          if (main.accountType === AccountTypes.Liability && main.accountSubType === c.accountSubType) return true
          if (main.accountType === AccountTypes.Equity && main.accountSubType === c.accountSubType) return true
          return false
        })

        const mainBalance = isDebitNormal
          ? main.debit - main.credit
          : main.credit - main.debit

        const contraTotal = relatedContra.reduce((sum, c) => {
          const contraBalance = isDebitNormal
            ? c.debit - c.credit
            : c.credit - c.debit
          return sum + contraBalance
        }, 0)

        return {
          title: main.title,
          balance: mainBalance - contraTotal,
          contraAccounts: relatedContra.map((c) => ({
            title: c.title,
            balance: isDebitNormal ? c.debit - c.credit : c.credit - c.debit,
          })),
        }
      })
    }

    const assets = groupWithContra([AccountTypes.Asset], [AccountSubTypes.Receivable], true)
    const liabilities = groupWithContra([AccountTypes.Liability], [AccountSubTypes.Payable], false)
    const equity = groupWithContra([AccountTypes.Equity], [AccountSubTypes.Equity], false)

    // Add Net Income under Equity
    equity.push({
      title: 'Net Income',
      balance: netIncome,
      contraAccounts: [],
    })

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0)
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0)
    const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0)

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      netIncome,
    }
  } catch (err) {
    console.error('Error generating balance sheet:', err)
    const message = err instanceof Error ? err.message : String(err)
    return { error: message || 'Failed to generate balance sheet' }
  }
}
