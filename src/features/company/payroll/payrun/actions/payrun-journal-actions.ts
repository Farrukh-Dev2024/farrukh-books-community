// src/features/company/payroll/payrun/actions/payrun-journal-actions.ts
'use server';

import { prisma } from "../../../../../lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { incrementDailyJournalUsage } from "@/features/subscription/usage/increment-daily-journal";
import { assertCanCreateJournal } from "@/features/subscription/guards/journal.guards";
import { th } from "date-fns/locale";

// Helper: update ledger balances
async function updateLedgerAndTrial(tx: typeof prisma, companyId: number) {
  // Recalculate ledger balances for all accounts
  const accounts = await tx.account.findMany({ where: { companyId } });

  for (const acc of accounts) {
    const debitSum = await tx.journal.aggregate({
      where: { accountId: acc.id, side: true },
      _sum: { amount: true },
    });
    const creditSum = await tx.journal.aggregate({
      where: { accountId: acc.id, side: false },
      _sum: { amount: true },
    });

    const balance = (debitSum._sum.amount ?? new Prisma.Decimal(0))
      .minus(creditSum._sum.amount ?? new Prisma.Decimal(0));

    await tx.account.update({
      where: { id: acc.id },
      data: { balance },
    });
  }
}

// -------------------------
// 1️⃣ Salaries Earned Entries
// -------------------------
export async function createSalariesEarnedEntries({
  payRunId,
  companyId,
  employeeList,
  currentUserId,
  tx,
}: {
  payRunId: number;
  companyId: number;
  employeeList: { id: number; firstName: string; baseSalary: Prisma.Decimal }[];
  currentUserId: number;
  tx: Prisma.TransactionClient;
}) {
  'use server';

  try {
    await assertCanCreateJournal(companyId);

    // Generate transactionId
    const maxId = await tx.journal.aggregate({ _max: { transactionId: true } });
    const transactionId = (maxId._max.transactionId ?? 0) + 1;

    // Find company-level accounts
    const [salaryExpense, salaryPayable] = await Promise.all([
      tx.account.findFirst({ where: { title: 'Salaries Expense', companyId } }),
      tx.account.findFirst({ where: { title: 'Salaries Payable', companyId } }),
    ]);

    if (!salaryExpense || !salaryPayable) throw new Error('Salary accounts not found');

    // Journal entries for company-level
    const journalData: Prisma.JournalCreateManyInput[] = [
      {
        accountId: salaryExpense.id,
        side: true, // debit
        amount: employeeList.reduce((acc, e) => acc.plus(e.baseSalary), new Prisma.Decimal(0)),
        transactionId,
        companyId,
        entryDate: new Date(),
        description: `Salary expense for PayRun ${payRunId}`,
        lastChangeByUserId: currentUserId,
      },
      {
        accountId: salaryPayable.id,
        side: false, // credit
        amount: employeeList.reduce((acc, e) => acc.plus(e.baseSalary), new Prisma.Decimal(0)),
        transactionId,
        companyId,
        entryDate: new Date(),
        description: `Salary payable for PayRun ${payRunId}`,
        lastChangeByUserId: currentUserId,
      },
    ];

    // Employee-level accounts
    for (const emp of employeeList) {
      const empSalaryPayable = await tx.account.findFirst({ where: { title: `${emp.firstName} Salary Payable`, companyId } });
      const empContra = await tx.account.findFirst({ where: { title: `${emp.firstName} Contra Salary Payable`, companyId } });

      if (!empSalaryPayable || !empContra) throw new Error(`Accounts for employee ${emp.firstName} not found`);

      journalData.push(
        {
          accountId: empSalaryPayable.id,
          side: true,
          amount: emp.baseSalary,
          transactionId,
          companyId,
          entryDate: new Date(),
          description: `Salary payable for ${emp.firstName}`,
          lastChangeByUserId: currentUserId,
        },
        {
          accountId: empContra.id,
          side: false,
          amount: emp.baseSalary,
          transactionId,
          companyId,
          entryDate: new Date(),
          description: `Contra salary payable for ${emp.firstName}`,
          lastChangeByUserId: currentUserId,
        }
      );
    }

    await incrementDailyJournalUsage(companyId);
    await tx.journal.createMany({ data: journalData });

    return transactionId;
  } catch (error) {
    throw new Error('Failed to create salary earned entries: ' + (error as Error).message);
  }

}


// -------------------------
// 2️⃣ Salaries Paid Entries
// -------------------------
export async function createSalariesPaidEntries({
  payRunId,
  companyId,
  employeeList,
  currentUserId,
  transactionId,
  tx,
}: {
  payRunId: number;
  companyId: number;
  employeeList: { id: number; firstName: string; baseSalary: Prisma.Decimal }[];
  currentUserId: number;
  transactionId: number;
  tx: Prisma.TransactionClient;
}) {
  'use server';

  try {
    await assertCanCreateJournal(companyId);
    const cash = await tx.account.findFirst({ where: { title: 'Cash', companyId } });
    const salaryPayable = await tx.account.findFirst({ where: { title: 'Salaries Payable', companyId } });

    if (!cash || !salaryPayable) throw new Error('Cash or Salary Payable account not found');

    const journalData: Prisma.JournalCreateManyInput[] = [
      {
        accountId: salaryPayable.id,
        side: true, // debit
        amount: employeeList.reduce((acc, e) => acc.plus(e.baseSalary), new Prisma.Decimal(0)),
        transactionId,
        companyId,
        entryDate: new Date(),
        description: `Salary payment for PayRun ${payRunId}`,
        lastChangeByUserId: currentUserId,
      },
      {
        accountId: cash.id,
        side: false, // credit
        amount: employeeList.reduce((acc, e) => acc.plus(e.baseSalary), new Prisma.Decimal(0)),
        transactionId,
        companyId,
        entryDate: new Date(),
        description: `Cash paid for salaries in PayRun ${payRunId}`,
        lastChangeByUserId: currentUserId,
      },
    ];

    for (const emp of employeeList) {
      const empSalaryPayable = await tx.account.findFirst({ where: { title: `${emp.firstName} Salary Payable`, companyId } });
      const empContra = await tx.account.findFirst({ where: { title: `${emp.firstName} Contra Salary Payable`, companyId } });

      if (!empSalaryPayable || !empContra) throw new Error(`Accounts for employee ${emp.firstName} not found`);

      journalData.push(
        {
          accountId: empContra.id,
          side: true,
          amount: emp.baseSalary,
          transactionId,
          companyId,
          entryDate: new Date(),
          description: `Contra salary payable reversal for ${emp.firstName}`,
          lastChangeByUserId: currentUserId,
        },
        {
          accountId: empSalaryPayable.id,
          side: false,
          amount: emp.baseSalary,
          transactionId,
          companyId,
          entryDate: new Date(),
          description: `Salary payable cleared for ${emp.firstName}`,
          lastChangeByUserId: currentUserId,
        }
      );
    }

    await incrementDailyJournalUsage(companyId);
    await tx.journal.createMany({ data: journalData });    
  } catch (error) {
    throw new Error('Failed to create salary paid entries: ' + (error as Error).message);
  }

}


// -------------------------
// 3️⃣ Reverse Salaries Entries
// -------------------------
export async function reverseSalariesEntries({
  transactionId,
  companyId,
  currentUserId,
  tx,
}: {
  transactionId: number;
  companyId: number;
  currentUserId: number;
  tx: Prisma.TransactionClient;
}) {
  'use server';
  try {
    await assertCanCreateJournal(companyId);

    // Fetch all journal entries for this transaction
    const entries = await tx.journal.findMany({ where: { transactionId, companyId } });

    // const nextTransactionId = (maxId._max.transactionId ?? 0) + 1;
    const reversalData = entries.map(e => ({
      accountId: e.accountId,
      side: !e.side, // flip debit/credit
      amount: e.amount,
      transactionId: transactionId,
      companyId,
      entryDate: new Date(),
      description: `Reversal of journal entry ${e.id}`,
      lastChangeByUserId: currentUserId,
    }));

    await incrementDailyJournalUsage(companyId);
    await tx.journal.createMany({ data: reversalData });    
  } catch (error) {
    throw new Error('Failed to reverse salaries entries: ' + (error as Error).message);
  }

}

