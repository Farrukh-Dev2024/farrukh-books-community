// src/features/company/payroll/payrun/actions/attendance-utils.ts
'use server';

import { prisma } from "../../../../../lib/prisma";
import { PayrollEmployeeAttendance } from "@/types/prisma-types";

export async function getAttendanceForPeriod(employeeId: number, start: Date, end: Date) {
  const records = await prisma.payrollEmployeeAttendance.findMany({
    where: { employeeId, date: { gte: start, lte: end } },
    orderBy: { date: 'asc' },
  });

  return records.map((r) => ({
    ...r,
  }));
}

// Type for per-day deduction breakdown
export interface AttendanceDeductionRow {
  date: string;           // ISO string
  status: string;
  deduction: number;      // Deduction for this day
}

export interface AttendanceDeductionResult {
  totalDeduction: number;
  dailyRate: number;
  breakdown: AttendanceDeductionRow[];
}

/**
 * Calculates total deduction and per-day breakdown based on attendance
 */
export async function calculateAttendanceDeduction(
  attendance: PayrollEmployeeAttendance[],
  basicSalary: number,
  workingDays: number
): Promise<AttendanceDeductionResult> {
  const dailyRate = Math.round((Number(basicSalary) / workingDays) * 100) / 100;
  let totalDeduction = 0;

  const breakdown: AttendanceDeductionRow[] = attendance.map((day) => {
    let dayDeduction = 0;

    switch (day.status) {
      case "ABSENT":
        dayDeduction = dailyRate;
        break;
      case "HALFDAY":
        dayDeduction = dailyRate * 0.5;
        break;
      case "LEAVE":
      case "PRESENT":
        dayDeduction = 0;
        break;
      default:
        console.warn(`Unknown attendance status: ${day.status}`);
    }

    dayDeduction = Math.round(dayDeduction * 100) / 100;
    totalDeduction += dayDeduction;

    return {
      date: day.date.toISOString().split("T")[0],
      status: day.status,
      deduction: dayDeduction,
    };
  });

  totalDeduction = Math.round(totalDeduction * 100) / 100;

  return { totalDeduction, dailyRate, breakdown };
}
