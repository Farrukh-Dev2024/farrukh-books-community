"use server";

import { prisma } from "../../../../../lib/prisma";
import { PayItemSchema } from "../schemas/payitem";
import { canManagePayItems } from "@/lib/permissions/permissions";
import { getAuthUserCompanyOrThrow } from "@/lib/permissions/helperfunctions";

export async function createPayItem(data: unknown) {
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
      return { success: false, message: "User does not belong to any company", errors: {} };
    }

    // Step 3: Permission check
    if (!canManagePayItems(userdb, "create")) {
      return { success: false, message: "Permission denied", errors: {} };
    }

    // Step 4: Validate data
    const parsed = PayItemSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    // Step 5: Absolute safety — override companyId instead of trusting the client
    const { ...rest } = parsed.data;
    const companyId = userdb.companyId;



    // Step 6: Create Pay Item

      await prisma.payItem.create({
        data: {
          ...rest,
          companyId,
        },
      });


    return { success: true, message: "Pay item created" };    
  } catch (error) {
    console.log ("Error createPayItem %O",error)
    return { success: false, message: "Database error while creating Pay Item", errors: {} };
  }

}


export async function updatePayItem(id: number, data: unknown) {
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
  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb || !userdb.companyId) {
      return { success: false, message: "Invalid user or company", errors: {} };
    }

    // Step 3: Permission check
    if (!canManagePayItems(userdb, "update")) {
      return { success: false, message: "Permission denied", errors: {} };
    }

    // Step 4: Fetch existing pay item (to prevent cross-company update)
    const existing = await prisma.payItem.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      return { success: false, message: "Pay item not found", errors: {} };
    }

    if (existing.companyId !== userdb.companyId) {
      return { success: false, message: "Cross-company update blocked", errors: {} };
    }

    // Step 5: Validate input
    const parsed = PayItemSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, errors: parsed.error.flatten().fieldErrors };
    }

    // Remove companyId from update even if client sent it
    const { ...rest } = parsed.data;

    await prisma.payItem.update({
      where: { id },
      data: rest,
    });
    return { success: true, message: "Pay item updated" };
  } catch (error) {
    console.log("Error updatePayItem %O",error)
    return { success: false, message: "Error while updating pay item" };

  }

  
}


export async function deletePayItem(id: number) {
  'use server'
  // Step 1: Auth check
  // const session = await auth();
  // if (!session?.user) {
  //   return { success: false, message: "User not logged in", errors: {} };
  // }

  // // Step 2: Fetch DB user
  // const tmpform = new FormData();
  // tmpform.append("email", session.user.email || "");
  // const userdb = await getuser({}, tmpform);

  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb || !userdb.companyId) {
      return { success: false, message: "Invalid user or company", errors: {} };
    }

    // Step 3: Permission check
    if (!canManagePayItems(userdb, "delete")) {
      return { success: false, message: "Permission denied", errors: {} };
    }

    // Step 4: Ensure pay item belongs to user's company
    const existing = await prisma.payItem.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      return { success: false, message: "Pay item not found", errors: {} };
    }

    if (existing.companyId !== userdb.companyId) {
      return { success: false, message: "Cross-company delete blocked", errors: {} };
    }

    // Step 5: Soft delete
    await prisma.payItem.update({
      where: { id },
      data: { isDeleted: true },
    });

    return { success: true, message: "Pay item deleted" };
  } catch (error) {
    return { success: false, message: "Error deleting pay item" };

  }

}


export async function getAllPayItems() {
  'use server'
  // const session = await auth();
  // if (!session?.user) return [];

  // const tmpform = new FormData();
  // tmpform.append("email", session.user.email || "");
  // const userdb = await getuser({}, tmpform);

  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return [];

    const items = await prisma.payItem.findMany({
      where: { companyId: userdb.companyId, isDeleted: false },
      orderBy: { createdAt: "desc" },
    });
    const safeItems = items.map(item => ({
      ...item,
      defaultAmount: Number(item.defaultAmount), // Prisma Decimal -> number
    }));

    return safeItems;
  } catch (error) {
    console.log("Error getAllPayItems %O", error);
    return [];
  }

}


export async function getPayItem(id: number) {
  'use server'
  // const session = await auth();
  // if (!session?.user) return null;

  // const tmpform = new FormData();
  // tmpform.append("email", session.user.email || "");
  // const userdb = await getuser({}, tmpform);

  try {
    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return null;

    const item = await prisma.payItem.findUnique({ where: { id } });
    if (!item || item.isDeleted) return null;

    if (item.companyId !== userdb.companyId) return null; // prevent cross-tenant read

    const safeitem = {
      ...item,
      defaultAmount: Number(item.defaultAmount),
    }
    return safeitem;
  } catch (error) {
    console.log("Error getPayItem %O", error)
    return null;
  }

}

