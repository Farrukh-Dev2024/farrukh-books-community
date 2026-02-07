import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../../../../lib/prisma";
import { PaySlipItem } from "@/types/prisma-types";

export function summarizeItems(items: PaySlipItem[]) {
  let totalAllowances = new Prisma.Decimal(0);
  let totalDeductions = new Prisma.Decimal(0);

  for (const item of items) {
    if (item.isDeleted) continue;

    const amount = new Prisma.Decimal(item.amount);

    if (item.type === "ALLOWANCE") {
      totalAllowances = totalAllowances.plus(amount);
    } else if (item.type === "DEDUCTION") {
      totalDeductions = totalDeductions.plus(amount);
    }
  }

  return { totalAllowances, totalDeductions };
}

export function calculateOvertimeAmount(overtimeHours: number, overtimeRate: Prisma.Decimal) {
  if (!overtimeHours || overtimeHours <= 0) return new Prisma.Decimal(0);

  return new Prisma.Decimal(overtimeHours).times(overtimeRate);
}

export function recalcPaySlip(p: {
  basePay: Prisma.Decimal;
  overtimeAmount:Prisma.Decimal;
  items: PaySlipItem[];
  excluded: boolean;
}) {
  if (p.excluded) {
    return {
      grossPay: new Prisma.Decimal(0),
      totalAllowances: new Prisma.Decimal(0),
      totalDeductions: new Prisma.Decimal(0),
      netPay: new Prisma.Decimal(0),
      pay: new Prisma.Decimal(0),
    };
  }

  const { totalAllowances, totalDeductions } = summarizeItems(p.items);

  const grossPay = p.basePay
    .plus(p.overtimeAmount)
    .plus(totalAllowances);

  const netPay = grossPay.minus(totalDeductions);

  const pay = netPay; // your naming convention

  return {
    grossPay,
    totalAllowances,
    totalDeductions,
    netPay,
    pay,
  };
}

