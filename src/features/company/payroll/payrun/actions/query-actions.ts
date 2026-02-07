'use server';

import { prisma } from "../../../../../lib/prisma";
import { canManageEmployees } from "@/lib/permissions/permissions";
import { getAuthUserCompanyOrThrow } from "@/lib/permissions/helperfunctions";
//import { convertDecimals } from "@/lib/typeconvertfunctions";

/**
 * Helper → Get companyId using your exact pattern
 */
async function getCompanyIdFromAuthForRead() {
  'use server'
  // // Step 1: Auth check
  // const session = await auth();
  // if (!session?.user) {
  //   throw new Error("User not logged in");
  // }

  // // Step 2: Fetch DB user
  // const tmpform = new FormData();
  // tmpform.append("email", session.user.email || "");
  // const userdb = await getuser({}, tmpform);

  // if (!userdb) {
  //   throw new Error("Database user not found");
  // }

  // if (!userdb.companyId) {
  //   throw new Error("User does not belong to any company");
  // }

  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!canManageEmployees(userdb, "read")) {
      throw new Error("Permission denied");
    }

    return userdb.companyId;
    
  } catch (error) {
    throw new Error("error in getcompanyidfromauthforread");
  }
}

/* ------------------------------------------------------------------
   1) GET ALL PAYRUNS FOR COMPANY
------------------------------------------------------------------- */
export async function getPayRuns() {
  try {
    const companyId = await getCompanyIdFromAuthForRead();
    if (!companyId) {throw new Error("User does not belong to any company");}

    const tmppayrun = await prisma.payRun.findMany({
      where: { companyId ,isDeleted: false },
      include: { paySlips: { include: {employee:true, paySlipItems: true } } },
      orderBy: { createdAt: "desc" },
    });
    const payruns = tmppayrun.map((run) => ({
      ...run,
      totalGross: run.totalGross ? Number(run.totalGross) : 0,
      totalDeductions: run.totalDeductions ? Number(run.totalDeductions) : 0,
      totalNet: run.totalNet ? Number(run.totalNet) : 0,
      paySlips: run.paySlips.map((ps) => ({
        ...ps,
        totalDeductions: Number(ps.totalDeductions),
        basicPay: Number(ps.basicPay),
        totalAllowances: Number(ps.totalAllowances),
        grossPay: Number(ps.grossPay),
        netPay: Number(ps.netPay),
        employeeName: `${ps.employee.firstName} ${ps.employee.lastName}`,
        employee: {
          ...ps.employee,
          baseSalary: Number(ps.employee.baseSalary),
        },
        paySlipItems: ps.paySlipItems.map((item) => ({
          ...item,
          amount: item.amount ? Number(item.amount) : 0,
        })),
      })),
    }));
    //console.log("getPayRuns:", payruns);
    return payruns;
  } catch (error) {
    console.error("getPayRuns error:", error);
    return [];
  }
}

/* ------------------------------------------------------------------
   2) GET A SINGLE PAYRUN BY ID
------------------------------------------------------------------- */
export async function getPayRunById(payRunId: number) {
  try {
    const companyId = await getCompanyIdFromAuthForRead();
    if (!companyId) {throw new Error("User does not belong to any company");}

    return await prisma.payRun.findFirst({
      where: { id: payRunId, companyId ,isDeleted: false },
    });
  } catch (error) {
    console.error("getPayRunById error:", error);
    return null;
  }
}

/* ------------------------------------------------------------------
   3) GET PAYSLIPS FOR A PAYRUN
------------------------------------------------------------------- */
export async function getPaySlipsForRun(payRunId: number) {
  try {
    const companyId = await getCompanyIdFromAuthForRead();
    if (!companyId) {throw new Error("User does not belong to any company");}

    return await prisma.paySlip.findMany({
      where: { payRunId , companyId ,isDeleted: false },
      orderBy: { employeeId: "asc" },
    });
  } catch (error) {
    console.error("getPaySlipsForRun error:", error);
    return [];
  }
}

/* ------------------------------------------------------------------
   4) GET A SINGLE PAYSLIP BY ID
------------------------------------------------------------------- */
export async function getPaySlipById(paySlipId: number) {
  try {
    const companyId = await getCompanyIdFromAuthForRead();
    if (!companyId) {throw new Error("User does not belong to any company");}

    return await prisma.paySlip.findFirst({
      where: { id: paySlipId , companyId ,isDeleted: false },
    });
  } catch (error) {
    console.error("getPaySlipById error:", error);
    return null;
  }
}

export async function getPayRunDetails(payRunId: number) {
  "use server";
  const payRun = await prisma.payRun.findUnique({
    where: { id: payRunId, isDeleted: false },
    include: {
      paySlips: {
        include: { paySlipItems: true,employee:true },
      },
    },
  });
  if (!payRun) throw new Error("PayRun not found");
  const safepayrun = {
    ...payRun,
    totalGross: payRun.totalGross ? Number(payRun.totalGross) : 0,
    totalDeductions: payRun.totalDeductions ? Number(payRun.totalDeductions) : 0,
    totalNet: payRun.totalNet ? Number(payRun.totalNet) : 0,
    paySlips: payRun.paySlips.map((ps) => ({
      ...ps,
      totalDeductions: Number(ps.totalDeductions),
      basicPay: Number(ps.basicPay),
      totalAllowances: Number(ps.totalAllowances),
      grossPay: Number(ps.grossPay),
      netPay: Number(ps.netPay),
      employee:{
        ...ps.employee,
        baseSalary: Number(ps.employee.baseSalary),
      },
      paySlipItems: ps.paySlipItems.map((item) => ({
        ...item,
        amount: item.amount ? Number(item.amount) : 0,
      })),
    })),
  };
  return safepayrun;
}
