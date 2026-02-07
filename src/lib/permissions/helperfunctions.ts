import { getuser } from "@/features/auth/actions/authactions";
import { auth } from "../auth";

/**
 * Helper: get authenticated DB user + enforce company membership
 */
export async function getAuthUserOrThrow() {
  const session = await auth();
  if (!session?.user) throw new Error("User not logged in");

  const tmpform = new FormData();
  tmpform.append("email", session.user.email || "");
  const userdb = await getuser({}, tmpform);
  if (!userdb) throw new Error("Database user not found");
  if (userdb.isBanned) throw new Error("User is banned");
  return userdb;
}

export async function getAuthUserCompanyOrThrow() {
  const session = await auth();
  if (!session?.user) throw new Error("User not logged in");

  const tmpform = new FormData();
  tmpform.append("email", session.user.email || "");
  const userdb = await getuser({}, tmpform);
  if (!userdb) throw new Error("Database user not found");
  if (userdb.isBanned) throw new Error("User is banned");
  if (!userdb.companyId!) throw new Error("User does not belong to any company");
  return userdb;
}