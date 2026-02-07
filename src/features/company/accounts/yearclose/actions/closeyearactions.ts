// features/company/accounts/yearclose/actions/closeyearactions.ts
'use server'

import { prisma } from '../../../../../lib/prisma'
import { AccountTypes } from '@/types/project-types'
import { createJournalEntry } from '@/features/company/accounts/journal/actions/journalactions'
import { canManageYearClosing } from '@/lib/permissions/permissions'
import { unknown } from 'zod'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'

export async function closeYearAction(formData: FormData) {
  'use server'

  try {
    const companyId = Number(formData.get('companyId') || -1)
    const closingDateStr = String(formData.get('closingDate') || '')

    if (!companyId || !closingDateStr)
      return { success: false, message: 'Missing companyId or closingDate' }

    // ========================
    //  AUTH CHECK
    // ========================
    // const session = await auth()
    // if (!session?.user?.email)
    //   return { success: false, message: 'Unauthorized' }

    // const tmp = new FormData()
    // tmp.append('email', session.user.email)
    // const userdb = await getuser({}, tmp)
    const userdb = await getAuthUserCompanyOrThrow();
    
    if (!userdb?.companyId || userdb.companyId !== companyId)
      return { success: false, message: 'Unauthorized for this company' }

    if (!canManageYearClosing(userdb, 'create'))
      return { success: false, message: 'Permission denied', errors: {} }
        
    const closingDate = new Date(closingDateStr + 'T00:00:00Z')

    // ========================
    //  TRANSACTIONAL LOGIC
    // ========================
    const result = await prisma.$transaction(async (tx) => {
      // -------- Ensure Retained Earnings Exists --------
      const retained = await tx.account.findFirst({
        where: { companyId, title: 'Retained Earnings' }
      })

      if (!retained) {
        return { success: false, message: 'Retained Earnings account not found.' }
      }

      // -------- Fetch Income + Expense Accounts --------
      const plAccounts = await tx.account.findMany({
        where: {
          companyId,
          accountType: {
            in: [AccountTypes.Income, AccountTypes.Expense]
          }
        }
      })

      if (!plAccounts.length)
        throw new Error('No income or expense accounts found.')

      // -------- Build Journal Lines --------
      const journalLines: {
        accountId: number
        side: boolean
        amount: number
      }[] = []

      let retainedDelta = 0

      for (const acc of plAccounts) {
        const bal = Number(acc.balance)
        if (bal === 0) continue

        const amount = Math.abs(bal)

        if (acc.accountType === AccountTypes.Income) {
          // Income → Debit Income, Credit Retained Earnings
          journalLines.push({ accountId: acc.id, side: true, amount })   // debit income
          journalLines.push({ accountId: retained.id, side: false, amount }) // credit retained

          retainedDelta += amount
        }

        if (acc.accountType === AccountTypes.Expense) {
          // Expense → Credit Expense, Debit Retained Earnings
          journalLines.push({ accountId: acc.id, side: false, amount })   // credit expense
          journalLines.push({ accountId: retained.id, side: true, amount }) // debit retained

          retainedDelta -= amount
        }
      }

      if (journalLines.length === 0)
        throw new Error('All P&L accounts already zero; nothing to close.')

      // ========================
      //  USE createJournalEntry()
      // ========================
      const je = await createJournalEntry(
        journalLines,
        closingDateStr,
        'Year End Closing Entry',
        { createdById: userdb.id },
        tx
      )

      if (!je.success)
        throw new Error(je.message)

      // -------- Zero Out All P&L Accounts --------
      for (const acc of plAccounts) {
        await tx.account.update({
          where: { id: acc.id },
          data: { balance: 0 }
        })
      }

      // -------- Update Retained Earnings --------
      await tx.account.update({
        where: { id: retained.id },
        data: { balance: { increment: retainedDelta } }
      })

      return { success: true, transactionId: je.transactionId }
    })

    return {
      success: true,
      message: 'Year closed successfully',
      data: result
    }

  } catch (err) {
    console.error('closeYearAction error: %O', err)
    return { success: false, message: 'Failed to post year close' }
  }
}
