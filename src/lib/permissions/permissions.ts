/**
 * permissions.ts
 * This module defines permission handling for user roles and company roles.
 */
import { UserRoles, CompanyRoles, AccountTypes, AccountSubTypes } from "@/types/project-types"

import { Prisma, PrismaClient, Account, User } from '@/generated/prisma/client'
import { prisma  } from '../prisma'

//instead of database permissions, we use predefined ones for certain roles

export function canManageAccounts(user: User) {
  //can create modify delete accounts
  return (
    user.userRole >= UserRoles.Admin ||
    user.companyRole >= CompanyRoles.Accountant
  );
}

type CRUDPermission = {
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
}

const accountPermissions: Record<number, Record<number, CRUDPermission>> = {
  [CompanyRoles.Accountant]: {
    [AccountSubTypes.Bank]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Receivable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Payable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.CreditCard]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.ExternalAccountant]: {
    [AccountSubTypes.Bank]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Receivable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Payable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.CreditCard]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.AccountsPayble]: {
    [AccountSubTypes.Bank]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Payable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.CreditCard]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.AccountsReceivable]: {
    [AccountSubTypes.Bank]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Receivable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.CreditCard]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.Banking]: {
    [AccountSubTypes.Bank]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Receivable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Payable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.CreditCard]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.Finance]: {
    [AccountSubTypes.Bank]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Receivable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Payable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.CreditCard]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.Inventory]: {
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.PayrollManager]: {
    [AccountSubTypes.Receivable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Payable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.CreditCard]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.PayrollProcessor]: {
    [AccountSubTypes.Receivable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Payable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.CreditCard]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.Purchasing]: {
    [AccountSubTypes.Payable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.CreditCard]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.Sales]: {
    [AccountSubTypes.Receivable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.CreditCard]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.TimeTracking]: {
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.Viewonly]: {
    [AccountSubTypes.Bank]: { create: false, read: true, update: false, delete: false },
    [AccountSubTypes.Receivable]: { create: false, read: true, update: false, delete: false },
    [AccountSubTypes.Payable]: { create: false, read: true, update: false, delete: false },
    [AccountSubTypes.CreditCard]: { create: false, read: true, update: false, delete: false },
    [AccountSubTypes.OtherCurrentAsset]: { create: false, read: true, update: false, delete: false },
  },
  [CompanyRoles.CustomRole]: {
    [AccountSubTypes.Bank]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Receivable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Payable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.CreditCard]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
  [CompanyRoles.FullAccess]: {
    [AccountSubTypes.Bank]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Receivable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.Payable]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.CreditCard]: { create: true, read: true, update: true, delete: true },
    [AccountSubTypes.OtherCurrentAsset]: { create: true, read: true, update: true, delete: true },
  },
}
export function canUseAccounts(user: User ,account: Account, action: keyof CRUDPermission): boolean {
  //can enter data into journals with these accounts
  //can enter data into ledgers with these accounts

  if (user.userRole === UserRoles.SuperAdmin || user.userRole === UserRoles.Admin) return true
  if (user.companyRole === CompanyRoles.FullAccess) return true
  
  const perms = accountPermissions[user.companyRole]?.[account.accountSubType]
  if (!perms) return false

  return perms[action]
}

const productPermissions: Record<number, CRUDPermission> = {
  [CompanyRoles.Sales]:       { create: true, read: true, update: true, delete: false },
  [CompanyRoles.Purchasing]:  { create: true, read: true, update: true, delete: false },
  [CompanyRoles.Inventory]:   { create: true, read: true, update: true, delete: true },
  [CompanyRoles.Accountant]:  { create: true, read: true, update: true, delete: false },
  [CompanyRoles.FullAccess]:  { create: true, read: true, update: true, delete: true },
  [CompanyRoles.Viewonly]:    { create: false, read: true, update: false, delete: false },
}

export function canManageProducts(user: User, action: keyof CRUDPermission): boolean {
  // SuperAdmin and Admin always allowed
  if (user.userRole === UserRoles.SuperAdmin || user.userRole === UserRoles.Admin) return true
  
  const perm = productPermissions[user.companyRole]
  if (!perm) return false
  
  return perm[action]
}

const customerPermissions: Record<number, CRUDPermission> = {
  [CompanyRoles.Sales]:       { create: true, read: true, update: true, delete: false },
  [CompanyRoles.Purchasing]:  { create: true, read: true, update: true, delete: false },
  [CompanyRoles.Inventory]:   { create: true, read: true, update: true, delete: true },
  [CompanyRoles.Accountant]:  { create: true, read: true, update: true, delete: false },
  [CompanyRoles.FullAccess]:  { create: true, read: true, update: true, delete: true },
  [CompanyRoles.Viewonly]:    { create: false, read: true, update: false, delete: false },
}
export function canManageCustomers(user: User, action: keyof CRUDPermission): boolean {
  // SuperAdmin and Admin always allowed
  if (user.userRole === UserRoles.SuperAdmin || user.userRole === UserRoles.Admin) return true
  
  const perm = customerPermissions[user.companyRole]
  if (!perm) return false
  
  return perm[action]
}

const salesQuotePermissions: Record<number, CRUDPermission> = {
  [CompanyRoles.Sales]:       { create: true, read: true, update: true, delete: false },
  [CompanyRoles.Purchasing]:  { create: true, read: true, update: true, delete: false },
  [CompanyRoles.Inventory]:   { create: true, read: true, update: true, delete: true },
  [CompanyRoles.Accountant]:  { create: true, read: true, update: true, delete: false },
  [CompanyRoles.FullAccess]:  { create: true, read: true, update: true, delete: true },
  [CompanyRoles.Viewonly]:    { create: false, read: true, update: false, delete: false },
}
export function canManageSalesQuotes(user: User, action: keyof CRUDPermission): boolean {
  // SuperAdmin and Admin always allowed
  if (user.userRole === UserRoles.SuperAdmin || user.userRole === UserRoles.Admin) return true
  
  const perm = salesQuotePermissions[user.companyRole]
  if (!perm) return false
  
  return perm[action]
}

const salesPermissions: Record<number, CRUDPermission> = {
  [CompanyRoles.Sales]:       { create: true, read: true, update: true, delete: false },
  [CompanyRoles.Purchasing]:  { create: true, read: true, update: true, delete: false },
  [CompanyRoles.Inventory]:   { create: true, read: true, update: true, delete: true },
  [CompanyRoles.Accountant]:  { create: true, read: true, update: true, delete: false },
  [CompanyRoles.FullAccess]:  { create: true, read: true, update: true, delete: true },
  [CompanyRoles.Viewonly]:    { create: false, read: true, update: false, delete: false },
}
export function canManageSales(user: User, action: keyof CRUDPermission): boolean {
  // SuperAdmin and Admin always allowed
  if (user.userRole === UserRoles.SuperAdmin || user.userRole === UserRoles.Admin) return true
  
  const perm = salesPermissions[user.companyRole]
  if (!perm) return false
  
  return perm[action]
}

// ✅ Define purchase permissions
const purchasePermissions: Record<number, CRUDPermission> = {
  [CompanyRoles.Purchasing]:  { create: true, read: true, update: true, delete: false },
  [CompanyRoles.Accountant]:  { create: true, read: true, update: true, delete: false },
  [CompanyRoles.Inventory]:   { create: true, read: true, update: true, delete: false },
  [CompanyRoles.FullAccess]:  { create: true, read: true, update: true, delete: true },
  [CompanyRoles.Viewonly]:    { create: false, read: true, update: false, delete: false },
  [CompanyRoles.Sales]:       { create: false, read: true, update: false, delete: false }, // can view vendor data only
}

// ✅ Permission check function
export function canManagePurchases(user: User, action: keyof CRUDPermission): boolean {
  // SuperAdmin and Admin always allowed
  if (user.userRole === UserRoles.SuperAdmin || user.userRole === UserRoles.Admin) return true

  const perm = purchasePermissions[user.companyRole]
  if (!perm) return false

  return perm[action]
}

// ✅ Define vendor permissions
const vendorPermissions: Record<number, CRUDPermission> = {
  [CompanyRoles.Purchasing]:  { create: true, read: true, update: true, delete: false },
  [CompanyRoles.Accountant]:  { create: true, read: true, update: true, delete: false },
  [CompanyRoles.Inventory]:   { create: true, read: true, update: true, delete: false },
  [CompanyRoles.FullAccess]:  { create: true, read: true, update: true, delete: true },
  [CompanyRoles.Viewonly]:    { create: false, read: true, update: false, delete: false },
  [CompanyRoles.Sales]:       { create: false, read: true, update: false, delete: false }, // can view vendor info only
}

/**
 * ✅ Permission check for managing vendors
 */
export function canManageVendors(user: User, action: keyof CRUDPermission): boolean {
  // SuperAdmin and Admin always allowed
  if (user.userRole === UserRoles.SuperAdmin || user.userRole === UserRoles.Admin) return true

  const perm = vendorPermissions[user.companyRole]
  if (!perm) return false

  return perm[action]
}

// ===============================
// Year Closing Permissions
// ===============================
const yearClosingPermissions: Record<number, CRUDPermission> = {
  [CompanyRoles.Accountant]:       { create: true, read: true, update: true, delete: false },
  [CompanyRoles.FullAccess]:       { create: true, read: true, update: true, delete: false },
  [CompanyRoles.PayrollManager]:   { create: false, read: true, update: false, delete: false },
  [CompanyRoles.Viewonly]:         { create: false, read: true, update: false, delete: false },

  // Roles that should not be able to close year
  [CompanyRoles.Sales]:            { create: false, read: false, update: false, delete: false },
  [CompanyRoles.Purchasing]:       { create: false, read: false, update: false, delete: false },
  [CompanyRoles.Inventory]:        { create: false, read: false, update: false, delete: false },
};

// Function to check year closing permissions
export function canManageYearClosing(user: User, action: keyof CRUDPermission): boolean {
  // SuperAdmin + Admin always allowed
  if (user.userRole === UserRoles.SuperAdmin || user.userRole === UserRoles.Admin) return true;

  const perm = yearClosingPermissions[user.companyRole];
  if (!perm) return false;

  return perm[action];
}


// ===============================
// Payroll Employee Permissions
// ===============================
const employeePermissions: Record<number, CRUDPermission> = {
  [CompanyRoles.PayrollManager]:    { create: true, read: true, update: true, delete: true },
  [CompanyRoles.PayrollProcessor]:  { create: true, read: true, update: true, delete: false },

  [CompanyRoles.Accountant]:        { create: true, read: true, update: true, delete: false },
  [CompanyRoles.FullAccess]:        { create: true, read: true, update: true, delete: true },
  [CompanyRoles.Viewonly]:          { create: false, read: true, update: false, delete: false },

  [CompanyRoles.Sales]:             { create: false, read: false, update: false, delete: false },
  [CompanyRoles.Purchasing]:        { create: false, read: false, update: false, delete: false },
  [CompanyRoles.Inventory]:         { create: false, read: false, update: false, delete: false },
};

export function canManageEmployees(user: User, action: keyof CRUDPermission): boolean {
  // SuperAdmin + Admin always allowed
  if (user.userRole === UserRoles.SuperAdmin || user.userRole === UserRoles.Admin) return true;

  const perm = employeePermissions[user.companyRole];
  if (!perm) return false;

  return perm[action];
}

// ===============================
// Payroll Pay Item Permissions
// ===============================

const payItemPermissions: Record<number, CRUDPermission> = {
  [CompanyRoles.PayrollManager]:    { create: true, read: true, update: true, delete: true },
  [CompanyRoles.PayrollProcessor]:  { create: true, read: true, update: true, delete: false },

  [CompanyRoles.Accountant]:        { create: true, read: true, update: true, delete: false },
  [CompanyRoles.FullAccess]:        { create: true, read: true, update: true, delete: true },
  [CompanyRoles.Viewonly]:          { create: false, read: true, update: false, delete: false },

};

export function canManagePayItems(user: User, action: keyof CRUDPermission): boolean {
  // SuperAdmin + Admin always allowed
  if (user.userRole === UserRoles.SuperAdmin || user.userRole === UserRoles.Admin) {
    return true;
  }

  const perm = payItemPermissions[user.companyRole];
  if (!perm) return false;

  return perm[action];
}
