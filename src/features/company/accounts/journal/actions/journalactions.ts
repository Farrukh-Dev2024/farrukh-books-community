'use server'


import { auth } from '@/lib/auth'
import { CompanyRoles, JournalEntry, AccountTypes, AccountSubTypes } from '@/types/project-types'
import { ZodError } from 'zod'

import { Prisma, PrismaClient } from '@/generated/prisma/client'
import { prisma } from '../../../../../lib/prisma'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'
import { incrementDailyJournalUsage } from '@/features/subscription/usage/increment-daily-journal'
import { assertCanCreateJournal } from '@/features/subscription/guards/journal.guards'


interface JournalLineInput {
  accountId: number
  side: boolean        // true = debit, false = credit
  amount: number
  description?: string
}
export async function createJournalEntry(
  lines: JournalLineInput[],
  entryDate: string,
  description?: string,
  extraData?: {
    productId?: number
    movementType?: string
    fromLocation?: string | null
    toLocation?: string | null
    remarks?: string | null
    createdById?: number
    transactionId?: number | null
  },
  tx?: Prisma.TransactionClient
) {
  'use server'
  // const session = await auth()
  // const tmpform = new FormData()
  // tmpform.append('email', session?.user?.email || '')
  // const userdb = await getuser({}, tmpform)

  // if (!session?.user)
  //   return { success: false, message: 'User not logged in', errors: {} }


  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId)
      return { success: false, message: 'User has no company', errors: {} }

    await assertCanCreateJournal(userdb.companyId);

    const prismaClient = tx ?? prisma

    // 🔹 If no manual lines given, auto-generate from movement type
    const finalLines = [...lines]

    // ✅ Validate debit = credit
    const totalDebit = finalLines.filter(l => l.side).reduce((a, l) => a + l.amount, 0)
    const totalCredit = finalLines.filter(l => !l.side).reduce((a, l) => a + l.amount, 0)
    if (totalDebit !== totalCredit)
      return { success: false, message: 'Debit and Credit totals must be equal' }

    // ✅ Next transactionId
    const maxId = await prisma.journal.aggregate({
      _max: { transactionId: true },
    })
    let nextTransactionId = (maxId._max.transactionId ?? 0) + 1
    if (extraData?.transactionId) {
      nextTransactionId = extraData.transactionId
    }
    // ✅ Create all lines
    await prismaClient.journal.createMany({
      data: finalLines.map((line) => ({
        transactionId: nextTransactionId,
        companyId: Number(userdb.companyId ?? -1),
        accountId: line.accountId,
        side: line.side,
        amount: line.amount,
        description: line.description || description || '',
        entryDate: new Date(entryDate),
        lastChangeByUserId: userdb.id,
        extraData: extraData ? JSON.stringify(extraData) : "",
      })),
    })

    // ✅ Update balances
    const accounts = await prismaClient.account.findMany({
      where: { id: { in: finalLines.map(l => l.accountId) } },
    })

    for (const line of finalLines) {
      const account = accounts.find(a => a.id === line.accountId)
      if (!account) continue

      let newBalance = account.balance
      if (account.side) {
        newBalance = newBalance.plus(line.amount)
      } else {
        newBalance = newBalance.minus(line.amount)
      }

      await prismaClient.account.update({
        where: { id: account.id },
        data: { balance: newBalance },
      })
    }

    await incrementDailyJournalUsage(userdb.companyId);
    return { success: true, transactionId: nextTransactionId }
  } catch (error) {
    console.log("Error createJournalEntry %O", error)
    return { success: false, message: 'Error createJournalEntry', errors: {} }
  }

}


export async function getJournalTransactions(page = 1, pageSize = 10) {
  'use server'
  // const session = await auth()
  // if (!session?.user) return { data: [], totalPages: 0 }

  // const tmpform = new FormData()
  // tmpform.append('email', session.user.email || '')
  // const userdb = await getuser({}, tmpform)
  try {
    const userdb = await getAuthUserCompanyOrThrow();

    if (!userdb?.companyId) return { data: [], totalPages: 0 }

    // 🧮 Count total distinct transactionIds for pagination
    const totalTransactions = await prisma.journal.groupBy({
      by: ['transactionId'],
      where: { companyId: userdb.companyId, isDeleted: false },
      _count: true
    })
    const totalPages = Math.ceil(totalTransactions.length / pageSize)

    // ⚡ Get distinct transactionIds for current page
    const transactionsForPage = totalTransactions
      .sort((a, b) => b.transactionId - a.transactionId) // latest first
      .slice((page - 1) * pageSize, page * pageSize)
      .map(t => t.transactionId)

    // 🎯 Fetch all lines for these transactionIds
    const entries = await prisma.journal.findMany({
      where: {
        companyId: userdb.companyId,
        transactionId: { in: transactionsForPage }
      },
      include: {
        account: { select: { title: true } },
        lastChangedByUser: {
          select: { id: true, name: true }
        },
      },
      orderBy: [{ transactionId: 'desc' }, { id: 'asc' }]
    })

    // 🔁 Convert Prisma Decimal to plain number
    const cleanEntries = entries.map(e => ({
      ...e,
      amount: Number(e.amount),
      userName: e.lastChangedByUser?.name || 'Unknown',
    }))

    // 🧩 Group lines by transactionId
    const grouped = Object.values(
      cleanEntries.reduce((acc, line) => {
        if (!acc[line.transactionId]) {
          acc[line.transactionId] = {
            transactionId: line.transactionId,
            entryDate: line.entryDate,
            description: line.description || '',
            userName: line.userName,
            lines: [],
            totalDebit: 0,
            totalCredit: 0,
          }
        }

        acc[line.transactionId].lines.push({
          id: line.id,
          accountId: line.accountId,
          accountTitle: line.account.title,
          side: line.side,
          amount: line.amount,
          description: line.description || '',
        })

        if (line.side) acc[line.transactionId].totalDebit += line.amount
        else acc[line.transactionId].totalCredit += line.amount


        return acc
      }, {} as Record<number, JournalEntry>)
    )

    return { data: grouped, totalPages }
  } catch (error) {
    console.log("Error getJournalTransactions %O", error)
    return { data: [], totalPages: 0 }
  }

}

export async function deleteJournalEntry(transactionId: number) {
  'use server'
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, message: 'Unauthorized' }
    }

    // 🧩 Get logged-in user
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) {
      return { success: false, message: 'User company not found' }
    }

    // ✅ Check if user has admin or full access rights (optional enforcement)
    if (userdb.companyRole < CompanyRoles.FullAccess) { return { success: false, message: "User does not have permission to delete transactions,", errors: {} }; }

    // ⚙️ Soft delete: mark all entries with this transactionId as deleted
    const result = await prisma.journal.updateMany({
      where: {
        companyId: userdb.companyId,
        transactionId: transactionId,
      },
      data: {
        isDeleted: true,
        lastChangeByUserId: userdb.id,
      },
    })

    if (result.count === 0) {
      return { success: false, message: 'No entries found or already deleted' }
    }

    return { success: true, message: 'Journal entry deleted successfully' }
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation error:', error.errors)
      return { success: false, message: 'Validation error', errors: error.flatten().fieldErrors }
    } else if (error instanceof Error) {
      console.error('Delete journal error:', error.message)
      return { success: false, message: 'Failed to delete journal entry', errors: { general: error.message } }
    }
  }
}


export async function updateBalances() {
  'use server'
  // const session = await auth()

  // if (!session?.user)
  //   return { success: false, message: 'User not logged in', errors: {} }

  // const tmpform = new FormData()
  // tmpform.append('email', session.user.email || '')
  // const userdb = await getuser({}, tmpform)

  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId)
      return { success: false, message: 'User has no company', errors: {} }

    const accounts = await prisma.account.findMany({ where: { companyId: userdb.companyId } })
    for (const account of accounts) {
      const debitSum = await prisma.journal.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          accountId: account.id,
          side: true,
          isDeleted: false,
        },
      })

      const creditSum = await prisma.journal.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          accountId: account.id,
          side: false,
          isDeleted: false,
        },
      })
      const totalDebit = debitSum._sum.amount ?? 0
      const totalCredit = creditSum._sum.amount ?? 0
      let newBalance = account.balance
      if (account.side) {
        newBalance = new Prisma.Decimal(totalDebit).minus(new Prisma.Decimal(totalCredit))
      } else {
        newBalance = new Prisma.Decimal(totalCredit).minus(new Prisma.Decimal(totalDebit))
      }
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: newBalance },
      })
    }
  } catch (error) {
    console.log("Error updateBalance %O", error)
    return { success: false, message: 'Error updateBalance', errors: {} }

  }

}
export async function updateBalancesEnhanced() {
  'use server'

  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId)
      return { success: false, message: 'User has no company', errors: {} }

    // 1️⃣ Fetch all accounts once
    const accounts = await prisma.account.findMany({
      where: { companyId: userdb.companyId },
    })

    // 2️⃣ Fetch all journals once
    const journals = await prisma.journal.findMany({
      where: { companyId: userdb.companyId, isDeleted: false },
      select: { accountId: true, amount: true, side: true },
    })

    // 3️⃣ Group journals by account
    const grouped: Record<
      string,
      { debit: Prisma.Decimal; credit: Prisma.Decimal }
    > = {}

    for (const journal of journals) {
      if (!grouped[journal.accountId]) {
        grouped[journal.accountId] = {
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(0),
        }
      }
      if (journal.side) {
        // Debit
        grouped[journal.accountId].debit =
          grouped[journal.accountId].debit.plus(journal.amount)
      } else {
        // Credit
        grouped[journal.accountId].credit =
          grouped[journal.accountId].credit.plus(journal.amount)
      }
    }

    // 4️⃣ Compute new balances & update accounts
    for (const account of accounts) {
      const sums = grouped[account.id] || {
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(0),
      }

      let newBalance = new Prisma.Decimal(0)

      if (account.side) {
        // Debit normal
        newBalance = sums.debit.minus(sums.credit)
      } else {
        // Credit normal
        newBalance = sums.credit.minus(sums.debit)
      }

      await prisma.account.update({
        where: { id: account.id },
        data: { balance: newBalance },
      })
    }

    return { success: true }
  } catch (error) {
    return { success: false }

  }

}
