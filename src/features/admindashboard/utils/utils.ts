'use server'

import { UserRoles } from '@/types/project-types'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'
import { auth } from '@/lib/auth';
import { getuser } from '@/features/auth/actions/authactions';

/* ---------- Access ---------- */

export enum AccessLevel {
  NONE = 'NONE',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export async function hasAccess(): Promise<AccessLevel> {
  'use server'
  try {
  const session = await auth();
  if (!session?.user) return AccessLevel.NONE

  const tmpform = new FormData();
  tmpform.append("email", session.user.email || "");
  const userdb = await getuser({}, tmpform);
  if (!userdb) return AccessLevel.NONE
  // if (userdb.isBanned) return AccessLevel.NONE
  // if (!userdb.companyId!) return AccessLevel.NONE

    if (!userdb) {
      return AccessLevel.NONE
    }

    if (userdb.userRole === UserRoles.SuperAdmin) {
      return AccessLevel.SUPER_ADMIN
    }

    if (userdb.userRole === UserRoles.Admin) {
      return AccessLevel.ADMIN
    }

    return AccessLevel.NONE
    
  } catch (error) {
    return AccessLevel.NONE    
  }
}

export async function assertAdminAccess(): Promise<AccessLevel> {
  const access = await hasAccess()

  if (access === AccessLevel.NONE) {
    throw new Error('Forbidden')
  }

  return access
}

export async function assertSuperAdminAccess(): Promise<void> {
  const access = await hasAccess()

  if (access !== AccessLevel.SUPER_ADMIN) {
    throw new Error('Forbidden')
  }
}

/**
 * Phase 1 rule:
 * Platform READ access is allowed for Admin + SuperAdmin
 */
export async function assertPlatformReadAccess(): Promise<AccessLevel> {
  return assertAdminAccess()
}