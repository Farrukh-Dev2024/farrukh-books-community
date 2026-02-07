"use server";

import { employeeSchema } from "../schemas/employeeSchemas";
import { z } from "zod";
import { canManageEmployees } from "@/lib/permissions/permissions";
import { AccountSubTypes, AccountTypes } from "@/types/project-types";

import { Prisma, PrismaClient, PayrollEmployee } from '@/generated/prisma/client'
import { prisma  } from '../../../../../lib/prisma'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions';

export async function getEmployees() {
  'use server'
  // // Step 1: Auth check
  // const session = await auth();
  // if (!session?.user) {
  //   return { success: false, message: "User not logged in", errors: {} };
  // }

  // // Step 2: Fetch DB user
  // const tmpform = new FormData();
  // tmpform.append("email", session.user.email || "");
  // const userdb = await getuser({}, tmpform);

  // if (!userdb) {
  //   return { success: false, message: "Database user not found", errors: {} };
  // }
  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb.companyId) {
      return {
        success: false,
        message: "User does not belong to any company",
        errors: {},
      };
    }

    // Step 3: Permission check
    if (!canManageEmployees(userdb, "read")) {
      return { success: false, message: "Permission denied", errors: {} };
    }

    const companyId = userdb.companyId;

    // Step 4: Fetch employees
    const employees = await prisma.payrollEmployee.findMany({
      where: { companyId, isDeleted: false },
      orderBy: { createdAt: "desc" },
    });

    // Step 5: Convert Decimal -> number
    const safeEmployees = employees.map((e) => ({
      ...e,
      baseSalary: e.baseSalary.toNumber(),
    }));

    return {
      success: true,
      data: safeEmployees,
    };    
  } catch (error) {
    console.log("Error getEmployees %O",error);
    return {success: false, message: "Error getEmployees",errors: {}}
  }

}


export async function createEmployee(
  data: z.infer<typeof employeeSchema>
) {
  "use server";

  // // 1️⃣ Auth check
  // const session = await auth();
  // if (!session?.user) {
  //   return { success: false, message: "User not logged in", errors: {} };
  // }

  // // 2️⃣ Fetch DB user
  // const tmpform = new FormData();
  // tmpform.append("email", session.user.email || "");
  // const userdb = await getuser({}, tmpform);

  // if (!userdb) {
  //   return { success: false, message: "Database user not found", errors: {} };
  // }

  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb.companyId) {
      return {
        success: false,
        message: "User does not belong to any company",
        errors: {},
      };
    }

    // 3️⃣ Permission check
    if (!canManageEmployees(userdb, "create")) {
      return { success: false, message: "Permission denied", errors: {} };
    }

    // 4️⃣ Validate input
    const validated = employeeSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: validated.error.flatten().fieldErrors,
      };
    }


      // 5️⃣ DB Transaction
      const employee = await prisma.$transaction(async (tx) => {
        const account1 = await tx.account.create({
          data: {
            companyId: userdb.companyId!,
            title: `${validated.data.firstName} Salary Payable`,
            description: `Auto-created account for employee ${validated.data.firstName}`,
            balance: 0,
            accountType: AccountTypes.Liability,
            accountSubType: AccountSubTypes.Payable,
            side: false,
          },
        });

        const account2 = await tx.account.create({
          data: {
            companyId: userdb.companyId!,
            title: `${validated.data.firstName} Contra Salary Payable`,
            description: `Auto-created contra account for employee ${validated.data.firstName}`,
            balance: 0,
            accountType: AccountTypes.Contra,
            accountSubType: AccountSubTypes.Payable,
            side: true,
          },
        });

        return tx.payrollEmployee.create({
          data: {
            ...validated.data,
            companyId: userdb.companyId!,
            accountId1: account1.id,
            accountId2: account2.id,
            createdById: userdb.id,
            updatedById: userdb.id,
          },
        });
      });

      const safeemployee = {
        ...employee,
        baseSalary: employee.baseSalary.toNumber(),
      };

      return { success: true, data: safeemployee };
    
  } catch (error) {
    console.error("Error creating employee:", error);
    return {
      success: false,
      message: "Failed to create employee",
      errors: {},
    };    
  }

}



export async function updateEmployee(
  id: number,
  data: z.infer<typeof employeeSchema>
) {
  "use server";

  // const session = await auth();
  // if (!session?.user?.email) {
  //   return { success: false, message: "User not logged in" };
  // }

  // const tmpform = new FormData();
  // tmpform.append("email", session.user.email || "");
  // const userdb = await getuser({}, tmpform);
  // if (!userdb) {
  //   return { success: false, message: "Database user not found" };
  // }
  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb.companyId) {return { success: false, message: "User does not belong to any company" };}

    if (!canManageEmployees(userdb, "update")) {return { success: false, message: "Permission denied" };}

    const validated = employeeSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const tmpemployee = await prisma.payrollEmployee.findFirst({
      where: { id, companyId: userdb.companyId },
    });
    if (!tmpemployee) {
      return {
        success: false,
        message: "Employee not found or not in your company",
      };
    }

      const updated = await prisma.payrollEmployee.update({
        where: { id },
        data: validated.data,
      });

      return {
        success: true,
        data: {
          ...updated,
          baseSalary: updated.baseSalary?.toNumber?.() ?? 0,
        },
      };

  } catch (error) {
    console.error("Error updating employee: %O", error);
    return { success: false, message: "Failed to update employee" };
    
  }

}


export async function deleteEmployee(id: number) {
  "use server";

  // // Step 1: Auth check
  // const session = await auth();
  // if (!session?.user) {
  //   return { success: false, message: "User not logged in", errors: {} };
  // }

  // // Step 2: Fetch DB user (keep original format)
  // const tmpform = new FormData();
  // tmpform.append("email", session.user.email || "");
  // const userdb = await getuser({}, tmpform);

  // if (!userdb) {
  //   return { success: false, message: "Database user not found", errors: {} };
  // }

  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb.companyId) {
      return {
        success: false,
        message: "User does not belong to any company",
        errors: {},
      };
    }

    // Step 3: Permission check (delete)
    if (!canManageEmployees(userdb, "delete")) {
      return { success: false, message: "Permission denied", errors: {} };
    }

    // Step 4: Validate employee belongs to same company
    const employee = await prisma.payrollEmployee.findFirst({
      where: { id, isDeleted: false },
    });

    if (!employee) {
      return { success: false, message: "Employee not found", errors: {} };
    }

    if (employee.companyId !== userdb.companyId) {
      return {
        success: false,
        message: "Invalid company access",
        errors: {},
      };
    }

    // Step 5: Perform soft delete
      await prisma.$transaction(async (tx) => {
        // Soft delete employee
        await tx.payrollEmployee.update({
          where: { id },
          data: { isDeleted: true },
        });

        // Soft delete accounts
        await tx.account.updateMany({
          where: {
            id: { in: [employee.accountId1, employee.accountId2] },
            companyId: userdb.companyId!,
            isDeleted: false,
          },
          data: { isDeleted: true },
        });
      });

      return { success: true, message: "Employee deleted successfully" };    
  } catch (error) {
    console.error("Error deleting employee: %O", error);
    return {
      success: false,
      message: "Failed to delete employee",
      errors: {},
    };    
  }

}



