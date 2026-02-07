// src/features/company/payroll/payrun/actions/payslip-generator.ts
'use server';

import { prisma } from "../../../../../lib/prisma";
import { getAttendanceForPeriod, calculateAttendanceDeduction } from "./attendance-utils";
import { canManageEmployees } from "@/lib/permissions/permissions";
import { Prisma } from "@/generated/prisma/client";
import { getAuthUserCompanyOrThrow } from "@/lib/permissions/helperfunctions";

export async function generatePaySlipsForRun(payRunId: number) {
  'use server';

  // // Step 1: Auth check
  // const session = await auth();
  // if (!session?.user) {return { success: false, message: "User not logged in", errors: {} };}

  // // Step 2: Fetch DB user
  // const tmpform = new FormData();
  // tmpform.append("email", session.user.email || "");
  // const userdb = await getuser({}, tmpform);
  // if (!userdb) {return { success: false, message: "Database user not found", errors: {} };}

  // if (!userdb.companyId) {
  //   return {
  //     success: false,
  //     message: "User does not belong to any company",
  //     errors: {},
  //   };
  // }

  try {
    const userdb = await getAuthUserCompanyOrThrow();
    // Step 3: Permission check
    if (!canManageEmployees(userdb, "create")) {return { success: false, message: "Permission denied", errors: {} };}
    if (!userdb.companyId) {throw new Error("User does not belong to any company");}

    // 1️⃣ Fetch PayRun
    const payRun = await prisma.payRun.findFirst({
      where: { id: payRunId , isDeleted: false },
    });

    if (!payRun) throw new Error("PayRun not found.");

    // ⭐⭐⭐ CHANGE #1 — CHECK IF PAYSLIPS ALREADY EXIST ⭐⭐⭐
    const existingPayslips = await prisma.paySlip.findMany({
      where: { payRunId , isDeleted: false },
      include: {
        employee: true,
      },
    });

    if (existingPayslips.length > 0) {
      // ⭐⭐⭐ CHANGE #2 — RETURN EXISTING SLIPS ⭐⭐⭐
      return {
        success: true,
        fromCache: true, // Optional
        count: existingPayslips.length,
        slips: existingPayslips.map((ps) => ({
          payslipId: ps.id,
          employee: `${ps.employee.firstName} ${ps.employee.lastName}`,
          grossPay: Number(ps.grossPay),
          totalAllowances: Number(ps.totalAllowances),
          totalDeductions: Number(ps.totalDeductions),
          netPay: Number(ps.netPay),
          status: ps.status,
        })),
      };
    }
    // ⭐⭐⭐ END OF NEW CODE ⭐⭐⭐

    // 2️⃣ Fetch active employees with assigned pay items
    const employees = await prisma.payrollEmployee.findMany({
      where: { companyId: userdb.companyId, status: "ACTIVE" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        baseSalary: true,
        assignedPayItems: {
          include: { payItem: true },
        },
      },
    });

    if (employees.length === 0) throw new Error("No active employees found.");

    // ----------------------------------------------------------------
    // ⭐️ CORE CHANGE: run a single transaction that does the whole loop
    // This ensures every payslip + items are committed before we return
    // ----------------------------------------------------------------
    const results = await prisma.$transaction(async (tx) => {
      const out: {
        payslipId: number;
        employee: string;
        grossPay: number;
        totalAllowances: number;
        totalDeductions: number;
        netPay: number;
        status: string;
      }[] = [];

      for (const emp of employees) {
        // 3️⃣ Get attendance for the period
        const attendance = await getAttendanceForPeriod(
          emp.id,
          payRun.periodStart,
          payRun.periodEnd
        );

        const workingDays = attendance.length || 30;
        const { totalDeduction: attendanceDeduction } =
          await calculateAttendanceDeduction(
            attendance,
            Number(emp.baseSalary),
            workingDays
          );

        // 4️⃣ Calculate totals
        let allowanceTotal = 0;
        let deductionTotal = attendanceDeduction;

        // 5️⃣ Process assigned pay items
        for (const pi of emp.assignedPayItems) {
          const item = pi.payItem;
          if (!item) continue;

          const finalAmount = pi.amount ?? item.defaultAmount ?? 0;

          if (item.type === "ALLOWANCE") allowanceTotal += Number(finalAmount);
          if (item.type === "DEDUCTION") deductionTotal += Number(finalAmount);
        }

        const grossPay = Number(emp.baseSalary);
        const netPay = grossPay - deductionTotal + allowanceTotal;

        // Create payslip inside the same transaction
        const payslip = await tx.paySlip.create({
          data: {
            companyId: userdb.companyId!,
            payRunId,
            periodStart: payRun.periodStart,
            periodEnd: payRun.periodEnd,
            basicPay: emp.baseSalary,
            employeeId: emp.id,
            grossPay,
            totalAllowances: allowanceTotal,
            totalDeductions: deductionTotal,
            netPay,
            status: "DRAFT",
          },
        });

        const items: {
          companyId: number;
          paySlipId: number;
          title: string;
          type: string;
          mode: string;
          amount: Prisma.Decimal;
        }[] = [];

        // Attendance Deduction
        if (attendanceDeduction > 0) {
          items.push({
            companyId: userdb.companyId!,
            paySlipId: payslip.id,
            title: "Attendance Deduction",
            type: "DEDUCTION",
            mode: "FIXED",
            amount: new Prisma.Decimal(attendanceDeduction),
          });
        }

        // Assigned Pay Items
        for (const pi of emp.assignedPayItems) {
          const item = pi.payItem;
          if (!item) continue;

          items.push({
            companyId: userdb.companyId!,
            paySlipId: payslip.id,
            title: item.title,
            type: item.type,
            mode: item.mode ?? "FIXED",
            amount: new Prisma.Decimal(item.defaultAmount ?? 0),
          });
        }

        // createMany inside the same transaction (all synchronous within tx)
        if (items.length > 0) {
          const rslt = await tx.paySlipItem.createMany({ data: items });
          console.log(`create many paySlipItems result:`, rslt);
          // for (const item of items) {
          //   await tx.paySlipItem.create({
          //     data: {
          //       ...item
          //     },
          //   });
          // }
        }

        out.push({
          payslipId: payslip.id,
          employee: `${emp.firstName} ${emp.lastName}`,
          grossPay,
          totalAllowances: allowanceTotal,
          totalDeductions: deductionTotal,
          netPay,
          status: payslip.status,
        });
      }

      return out;
    });
    // `results` is the array returned from the transaction
    return {
      success: true,
      count: results.length,
      slips: results,
    };    
  } catch (error) {
    console.log("Error in generatePaySlipForRun %O",error);
    return { success: false, message: "Error in generatePaySlipForRun", errors: {} }
  }

}
