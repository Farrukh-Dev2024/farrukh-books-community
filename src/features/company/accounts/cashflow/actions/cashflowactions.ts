// features/company/accounts/cashflow/actions/cashflowactions.ts
'use server'

import { prisma } from '../../../../../lib/prisma'
import { AccountTypes, CashFlowSection } from '@/types/project-types'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'
import { assertCanViewReport } from '@/features/subscription/guards/report.guards';

export async function getCashFlowReport(startDate: Date, endDate: Date) {
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

    await assertCanViewReport(companyId, 'CASH_FLOW');
    
    // Fetch journal entries within the date range
    const entries = await prisma.journal.findMany({
      where: {
        companyId,
        entryDate: { gte: startDate, lte: endDate },
      },
      include: {
        account: true,
      },
    })

    if (!entries.length) {
      return { operating: [], investing: [], financing: [], totals: { operating: 0, investing: 0, financing: 0, net: 0 } }
    }

    // Buckets for activities
    const operating: CashFlowSection[] = []
    const investing: CashFlowSection[] = []
    const financing: CashFlowSection[] = []

    let totalOperating = 0
    let totalInvesting = 0
    let totalFinancing = 0

    for (const e of entries) {
      const accType = e.account.accountType

      const amount = e.amount.toNumber()
      const isDebit = e.side

      // Operating Activities (Income, Expense)
      if (([AccountTypes.Income, AccountTypes.Expense] as (typeof AccountTypes.Income | typeof AccountTypes.Expense)[]).includes(accType as typeof AccountTypes.Income | typeof AccountTypes.Expense)) {
        operating.push({
          title: e.account.title,
          debit: isDebit ? amount : 0,
          credit: !isDebit ? amount : 0,
        })
        totalOperating += isDebit ? -amount : amount
      }

      // Investing Activities (Assets)
      else if (accType === AccountTypes.Asset && e.account.title.toLowerCase() !== 'cash') {
        investing.push({
          title: e.account.title,
          debit: isDebit ? amount : 0,
          credit: !isDebit ? amount : 0,
        })
        totalInvesting += isDebit ? -amount : amount
      }

      // Financing Activities (Liabilities & Equity)
      else if (([AccountTypes.Liability, AccountTypes.Equity] as (typeof AccountTypes.Liability | typeof AccountTypes.Equity)[]).includes(accType as typeof AccountTypes.Liability | typeof AccountTypes.Equity)) {
        financing.push({
          title: e.account.title,
          debit: isDebit ? amount : 0,
          credit: !isDebit ? amount : 0,
        })
        totalFinancing += isDebit ? -amount : amount
      }
    }

    const netCashFlow = totalOperating + totalInvesting + totalFinancing

    return {
      operating,
      investing,
      financing,
      totals: {
        operating: totalOperating,
        investing: totalInvesting,
        financing: totalFinancing,
        net: netCashFlow,
      },
    }
  } catch (error) {
    console.error('Error generating cash flow report:', error)
    return { error: 'Error generating cash flow report' }
  }
}
