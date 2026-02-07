// src/features/company/payroll/payrun/actions/payrun-actions.ts
'use server'

import { PaySlip, Prisma } from "@/generated/prisma/client";
import { prisma } from "../../../../../lib/prisma";
import { canManageEmployees } from "@/lib/permissions/permissions";
import { createSalariesEarnedEntries, createSalariesPaidEntries, reverseSalariesEntries } from "./payrun-journal-actions";
import { getAuthUserCompanyOrThrow } from "@/lib/permissions/helperfunctions";

/**
 * Helper: get authenticated DB user + enforce company membership
 */
async function getAuthUserOrThrow() {
  // const session = await auth();
  // if (!session?.user) throw new Error("User not logged in");

  // const tmpform = new FormData();
  // tmpform.append("email", session.user.email || "");
  // const userdb = await getuser({}, tmpform);
  // if (!userdb) throw new Error("Database user not found");
  // if (!userdb.companyId!) throw new Error("User does not belong to any company");
  const userdb =  await getAuthUserCompanyOrThrow();
  return userdb;
}

/* -------------------------
   Recalculation helpers
   ------------------------- */
async function recalcPaySlip(payslipId: number, companyId: number) {
  const slip = await prisma.paySlip.findFirst({
    where: { id: payslipId, companyId },
    include: { paySlipItems: true },
  });

  if (!slip) return null;

  let gross = new Prisma.Decimal(0);
  let deductions = new Prisma.Decimal(0);

  for (const item of slip.paySlipItems) {
    const amt = new Prisma.Decimal(item.amount ?? 0);
    const typ = (item.type || "").toUpperCase();
    if (typ === "ALLOWANCE" || typ === "OVERTIME") gross = gross.plus(amt);
    else if (typ === "DEDUCTION") deductions = deductions.plus(amt);
  }

  // If payslip has a stored basic/base pay field, include it in gross
  // Accept both basicPay and basePay / baseSalary naming by checking
  //const baseCandidates: any = (slip as any).basicPay ?? (slip as any).basePay ?? (slip as any).baseSalary;
  const baseCandidates: Prisma.Decimal = slip.basicPay;
  if (baseCandidates != null) {
    gross = gross.plus(new Prisma.Decimal(baseCandidates));
  }

  const net = gross.minus(deductions);

  return await prisma.paySlip.update({
    where: { id: payslipId },
    data: {
      // Use field names that your Prisma model defines. Adjust if your schema differs.
      grossPay: gross,
      totalDeductions: deductions,
      netPay: net,
    },
  });
}

async function recalcPayRun(payRunId: number, companyId: number) {
  const slips = await prisma.paySlip.findMany({ where: { payRunId, companyId } });

  let totalGross = new Prisma.Decimal(0);
  let totalDeductions = new Prisma.Decimal(0);
  let totalNet = new Prisma.Decimal(0);

  for (const s of slips) {
    totalGross = totalGross.plus(s.grossPay ?? 0);
    totalDeductions = totalDeductions.plus(s.totalDeductions ?? 0);
    totalNet = totalNet.plus(s.netPay ?? 0);
  }

  return await prisma.payRun.update({
    where: { id: payRunId },
    data: {
      totalGross,
      totalDeductions,
      totalNet,
    },
  });
}

/* -------------------------
   Create PayRun (kept mostly same)
   ------------------------- */
export async function createPayRun(formData: FormData) {
  'use server'
  try {
    const userdb = await getAuthUserOrThrow();

    if (!canManageEmployees(userdb, "create")) {
      return { success: false, message: "Permission denied", errors: {} };
    }

    const companyId = userdb.companyId!;
    const periodStartRaw = String(formData.get("periodStart") ?? "");
    const periodEndRaw = String(formData.get("periodEnd") ?? "");
    const periodStart = new Date(periodStartRaw);
    const periodEnd = new Date(periodEndRaw);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      return { success: false, message: "Invalid period dates", errors: {} };
    }

    const run = await prisma.payRun.create({
      data: {
        companyId,
        periodStart,
        periodEnd
      }
    });

    return { success: true, payRunId: run.id };
  } catch (error) {
    console.error("createPayRun error:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message || "Error creating payrun" };
    } else {
      return { success: false, message: "Error creating payrun" };
    }

  }
}

/* -------------------------
   Edit PayRun (update period or meta)
   ------------------------- */
export async function editPayRun(formData: FormData) {
  'use server'
  try {
    const userdb = await getAuthUserOrThrow();
    if (!canManageEmployees(userdb, "update")) {
      return { success: false, message: "Permission denied", errors: {} };
    }

    const payRunId = Number(formData.get("payRunId"));
    const periodStartRaw = formData.get("periodStart");
    const periodEndRaw = formData.get("periodEnd");
    if (!payRunId) return { success: false, message: "Missing payRunId" };

    // const data: any = {};
    const data: {
      periodStart?: Date
      periodEnd?: Date
    } = {}
    if (periodStartRaw) {
      const d = new Date(String(periodStartRaw));
      if (isNaN(d.getTime())) return { success: false, message: "Invalid periodStart" };
      data.periodStart = d;
    }
    if (periodEndRaw) {
      const d = new Date(String(periodEndRaw));
      if (isNaN(d.getTime())) return { success: false, message: "Invalid periodEnd" };
      data.periodEnd = d;
    }
    const run = await prisma.payRun.findFirst({ where: { id: payRunId, companyId: userdb.companyId! } });
    if (!run) return { success: false, message: "PayRun not found" };
    if (run.isLocked) {
      return { success: false, message: "PayRun is locked and cannot be modified" };
    }

    const updated = await prisma.payRun.update({
      where: { id: payRunId, },
      data,
    });

    //return { success: true, payRun: updated };
    return { success: true, message: "PayRun updated successfully" };
  } catch (error) {
    console.error("editPayRun error:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message || "Error editing payrun" };
    } else {
      return { success: false, message: "Error editing payrun" };
    }

  }
}

/* -------------------------
   Delete PayRun (cascade safe)
   ------------------------- */
export async function deletePayRun(formData: FormData) {
  'use server'
  try {
    const userdb = await getAuthUserOrThrow();
    if (!canManageEmployees(userdb, "delete")) {
      return { success: false, message: "Permission denied", errors: {} };
    }

    const payRunId = Number(formData.get("payRunId"));
    if (!payRunId) return { success: false, message: "Missing payRunId" };

    // Ensure the PayRun belongs to company
    const run = await prisma.payRun.findFirst({ where: { id: payRunId, companyId: userdb.companyId! } });
    if (!run) return { success: false, message: "PayRun not found" };

    // Recommended: delete slips and items inside a transaction
    await prisma.$transaction(async (tx) => {

      if (run.transactionId !== undefined && run.transactionId !== null){
        await reverseSalariesEntries({
          transactionId: run.transactionId!,
          companyId: userdb.companyId!,
          currentUserId: userdb.id!,
          tx,
        });
      }


      await tx.paySlipItem.updateMany({ where: { paySlip: { payRunId } }, data: { isDeleted: true } });
      await tx.paySlip.updateMany({ where: { payRunId: payRunId }, data: { isDeleted: true } });
      await tx.payRun.updateMany({ where: { id: payRunId }, data: { isDeleted: true } });

      // await tx.paySlipItem.deleteMany({ where: { paySlip: { payRunId } } });
      // await tx.paySlip.deleteMany({ where: { payRunId } });
      // await tx.payRun.delete({ where: { id: payRunId } });
    });

    return { success: true };
  } catch (error) {
    console.error("deletePayRun error:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message || "Error deleting payrun" };
    } else {
      return { success: false, message: "Error deleting payrun" };
    }

  }
}

/* -------------------------
   Add / Delete / Update PaySlipItem
   (Your implementations mostly ok — small fixes applied)
   ------------------------- */

export async function addPaySlipItem(formData: FormData) {
  'use server'
  try {
    const sessionUser = await getAuthUserOrThrow();
    if (!canManageEmployees(sessionUser, "create")) return { success: false, message: "Permission denied" };

    const slipId = Number(formData.get("payslipId"));
    const title = String(formData.get("title") ?? "");
    const amount = new Prisma.Decimal(String(formData.get("amount") ?? "0"));
    const type = String(formData.get("type") ?? "");
    const mode = String(formData.get("mode") ?? "FIXED");

    if (!slipId) return { success: false, message: "Missing payslipId" };

    const paySlip = await prisma.paySlip.findFirst({ where: { id: slipId, companyId: sessionUser.companyId! } });
    if (!paySlip) return { success: false, message: "Payslip not found" };
    if (paySlip.isLocked) return { success: false, message: "Payslip is locked and cannot be modified" };

    await prisma.paySlipItem.create({
      data: {
        paySlipId: slipId,
        companyId: sessionUser.companyId!,
        title,
        amount,
        type,
        mode,
      }
    });

    await recalcPaySlip(slipId, sessionUser.companyId!);
    await recalcPayRun(paySlip.payRunId, sessionUser.companyId!);

    return { success: true };
  } catch (error) {
    console.error("addPaySlipItem error:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message || "Error adding payslip item" };
    } else {
      return { success: false, message: "Error adding payslip item" };
    }

  }
}

export async function deletePaySlipItem(formData: FormData) {
  'use server'
  try {
    const userdb = await getAuthUserOrThrow();
    if (!canManageEmployees(userdb, "delete")) return { success: false, message: "Permission denied" };

    const itemId = Number(formData.get("itemId"));
    if (!itemId) return { success: false, message: "Missing itemId" };

    const item = await prisma.paySlipItem.findFirst({ where: { id: itemId, companyId: userdb.companyId! } });
    if (!item) return { success: false, message: "Not found" };

    await prisma.paySlipItem.delete({ where: { id: itemId } });
    await recalcPaySlip(item.paySlipId, userdb.companyId!);
    const slip = await prisma.paySlip.findUnique({ where: { id: item.paySlipId } });
    if (slip) await recalcPayRun(slip.payRunId, userdb.companyId!);

    return { success: true };
  } catch (error) {
    console.error("deletePaySlipItem error:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message || "Error deleting payslip item" };
    } else {
      return { success: false, message: "Error deleting payslip item" };
    }

  }
}


/* -------------------------
   Update base pay (correct for your schema)
   ------------------------- */
export async function updateBasePay(formData: FormData) {
  "use server";
  try {
    const userdb = await getAuthUserOrThrow();
    const companyId = userdb.companyId!;
    if (!canManageEmployees(userdb, "update"))
      return { success: false, message: "Permission denied" };

    const slipId = Number(formData.get("paySlipId"));
    const newBaseRaw = String(formData.get("amount") ?? "0");

    if (!slipId)
      return { success: false, message: "Missing payslipId" };

    const newBase = new Prisma.Decimal(newBaseRaw);

    // Fetch payslip and enforce company scope
    const slip = await prisma.paySlip.findFirst({
      where: { id: slipId, companyId },
    });


    if (!slip)
      return { success: false, message: "Payslip not found" };

    if (slip?.isLocked) { return { success: false, message: "Payslip is locked and cannot be modified" }; }

    // Step 1: Update base pay on payslip
    const updatedSlip = await prisma.paySlip.update({
      where: { id: slipId },
      data: {
        basicPay: newBase,
      },
    });

    // Step 2: Recalculate totals
    await recalcPaySlip(slipId, companyId);

    // Step 3: Update parent payrun totals
    await recalcPayRun(updatedSlip.payRunId, companyId);

    return { success: true };
  } catch (error) {
    console.error("updateBasePay error:", error);
    if (error instanceof Error) {
      return {
        success: false,
        message: error.message || "Error updating base pay",
      };
    } else {
      return { success: false, message: "Error updating base pay" };
    }
  }
}


/* -------------------------
   Update PaySlip Item (by id) — accepts either numeric or Decimal string
   ------------------------- */
type UpdatePaySlipItemParams = {
  paySlipItemId: number;
  newAmount: Prisma.Decimal | number | string;
};

export async function updatePaySlipItem({ paySlipItemId, newAmount }: UpdatePaySlipItemParams) {
  'use server'
  try {
    const userdb = await getAuthUserOrThrow();
    if (!canManageEmployees(userdb, "update")) return { success: false, message: "Permission denied" };

    const item = await prisma.paySlipItem.findFirst({ where: { id: paySlipItemId, companyId: userdb.companyId! }, include: { paySlip: true } });
    if (!item) return { success: false, message: 'PaySlip item not found' };
    if (item.paySlip?.isLocked) return { success: false, message: "Payslip is locked and cannot be modified" };

    await prisma.paySlipItem.update({
      where: { id: paySlipItemId },
      data: { amount: new Prisma.Decimal(String(newAmount)) },
    });

    if (item.paySlip) {
      await recalcPaySlip(item.paySlipId, userdb.companyId!);
      await recalcPayRun(item.paySlip.payRunId, userdb.companyId!);
    }

    return { success: true, message: 'PaySlip item updated successfully' };
  } catch (error) {
    console.error("updatePaySlipItem error:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message || 'Error updating payslip item' };
    } else {
      return { success: false, message: 'Error updating payslip item' };
    }
  }
}

/* -------------------------
   Toggle Payslip Exclusion (kept but improved)
   ------------------------- */
export async function togglePayslipExclusion(formData: FormData) {
  'use server'
  try {
    const userdb = await getAuthUserOrThrow();
    if (!canManageEmployees(userdb, "update")) return { success: false, message: "Permission denied" };

    const slipId = Number(formData.get("payslipId"));
    const excluded = formData.get("excluded") === "true";
    if (!slipId) return { success: false, message: "Missing payslipId" };

    // mark flagged field if exists; otherwise zero totals when excluded
    const slip = await prisma.paySlip.findFirst({ where: { id: slipId, companyId: userdb.companyId! } });
    if (!slip) return { success: false, message: "Payslip not found" };
    if (slip.isLocked) return { success: false, message: "Payslip is locked and cannot be modified" };

    // If your paySlip model has an 'excluded' boolean, update it; otherwise we apply totals zeroing
    // const updates: any = {};
    // // @ts-ignore
    // if (typeof (slip as any).excluded !== "undefined") updates.excluded = excluded;
    // await prisma.paySlip.update({ where: { id: slipId }, data: updates });

    const updates: Prisma.PaySlipUpdateInput = {}

    if (typeof slip.excluded !== 'undefined') {
      updates.excluded = excluded
    }

    await prisma.paySlip.update({
      where: { id: slipId },
      data: updates,
    })

    if (excluded) {
      await prisma.paySlip.update({
        where: { id: slipId },
        data: {
          grossPay: new Prisma.Decimal(0),
          totalDeductions: new Prisma.Decimal(0),
          netPay: new Prisma.Decimal(0),
        }
      });
    } else {
      await recalcPaySlip(slipId, userdb.companyId!);
    }

    if (slip) await recalcPayRun(slip.payRunId, userdb.companyId!);

    return { success: true };
  } catch (error) {
    console.error("togglePayslipExclusion error:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message || "Error toggling exclusion" };
    } else {
      return { success: false, message: "Error toggling exclusion" };
    }
  }
}

/* -------------------------
   Approve PayRun
   - Sets payRun.status = 'APPROVED'
   - Optionally marks all payslips to APPROVED and prevents regeneration
   ------------------------- */
export async function approvePayRun(formData: FormData) {
  'use server'
  try {
    const userdb = await getAuthUserOrThrow();
    if (!canManageEmployees(userdb, "update")) return { success: false, message: "Permission denied" };

    const payRunId = Number(formData.get("payRunId"));
    if (!payRunId) return { success: false, message: "Missing payRunId" };

    // Ensure run belongs to company
    const run = await prisma.payRun.findFirst({ where: { id: payRunId, companyId: userdb.companyId! } });
    if (!run) return { success: false, message: "PayRun not found" };

    // Recalculate all slips before approval to make sure totals up-to-date
    const slips = await prisma.paySlip.findMany({ where: { payRunId, companyId: userdb.companyId! }, include: { employee: true } });
    for (const s of slips) {
      await recalcPaySlip(s.id, userdb.companyId!);
    }
    await recalcPayRun(payRunId, userdb.companyId!);

    // Update statuses inside tx
    await prisma.$transaction(async (tx) => {
      await tx.paySlip.updateMany({
        where: { payRunId, companyId: userdb.companyId! },
        data: { status: "APPROVED", isLocked: true },
      });

      const transactionId = await createSalariesEarnedEntries({
        payRunId,
        companyId: userdb.companyId!,
        employeeList: slips.map(slip => ({
          id: slip.employeeId,
          firstName: slip.employee?.firstName ?? "",
          baseSalary: slip.basicPay ?? new Prisma.Decimal(0),
        })), // Simplified
        currentUserId: userdb.id!,
        tx,
      });

      await tx.payRun.update({
        where: { id: payRunId },
        data: { status: "APPROVED", isLocked: true, transactionId },
      });
    });
    // await prisma.$transaction([
    //   prisma.paySlip.updateMany({ where: { payRunId, companyId: userdb.companyId! }, data: { status: "APPROVED", isLocked: true } }),
    //   prisma.payRun.update({ where: { id: payRunId }, data: { status: "APPROVED", isLocked: true } })
    // ]);

    return { success: true };
  } catch (error) {
    console.error("approvePayRun error:", error);
    if (error instanceof Error) {
      return { success: false, message: error.message || "Error approving payrun" };
    } else {
      return { success: false, message: "Error approving payrun" };
    }
  }
}

export async function performCashOut(formData: FormData) {
  'use server'
  try {
    const userdb = await getAuthUserOrThrow();
    if (!canManageEmployees(userdb, "update")) return { success: false, message: "Permission denied" };
    const payRunId = Number(formData.get("payRunId"));
    if (!payRunId) return { success: false, message: "Missing payRunId" };
    // Ensure run belongs to company
    const run = await prisma.payRun.findFirst({ where: { id: payRunId, companyId: userdb.companyId!, isDeleted: false } });
    if (!run) return { success: false, message: "PayRun not found" };
    if (run.cashedOut) {
      return { success: false, message: "Cash out has already been performed for this PayRun" };
    }
    await prisma.$transaction(async (tx) => {
      await tx.payRun.update({
        where: { id: payRunId },
        data: { cashedOut: true },
      });
      await createSalariesPaidEntries({
        payRunId,
        companyId: userdb.companyId!,
        employeeList: await prisma.paySlip.findMany({
          where: { payRunId, companyId: userdb.companyId!, isDeleted: false },
          select: { employeeId: true, employee: true, basicPay: true },
        }).then(slips => slips.map(slip => ({
          id: slip.employeeId,
          firstName: slip.employee?.firstName ?? "",
          baseSalary: slip.basicPay ?? new Prisma.Decimal(0),
        }))),
        currentUserId: userdb.id!,
        transactionId: run.transactionId!,
        tx,
      });

    });
    return { success: true };
  } catch (error) {
    console.error("performCashOut error:", error);
    if (error instanceof Error){
      return { success: false, message: error.message || "Error performing cash out" };
    }else{
      return { success: false, message: "Error performing cash out" };
    }
    
  }
}
