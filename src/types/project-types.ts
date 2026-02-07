// src/types/project-types.ts

// export const CURRENCY_NAME = "US Dollar";
// export const CURRENCY_CODE = "USD";
// export const CURRENCY_SYMBOL = "$";

export const BASE_PATH = "/main"; // change here if main route changes
export const ADMIN_PATH = "/admin";
export const UserRoles = {
    SuperAdmin: 0,
    Admin: 1,
    User: 2,
} as const;
export type UserRoleType = (typeof UserRoles)[keyof typeof UserRoles]
export const USER_ROLE_LABELS: Record<UserRoleType, string> = {
  [UserRoles.SuperAdmin]: 'Super Admin',
  [UserRoles.Admin]: 'Admin',
  [UserRoles.User]: 'User',
}

export const CompanyRoles = { 
    AccountsPayble:1,
    AccountsReceivable:2,
    Banking:3,
    ExternalAccountant:4,
    Finance:5,
    Inventory:6,
    PayrollManager:7,
    PayrollProcessor:8,
    Purchasing:9,
    Sales:10,
    TimeTracking:11,
    Viewonly:12,
    CustomRole:13,
    Accountant:15,
    FullAccess:16,
} as const;

export const AccountTypes = {
  Asset:1,
  Liability:2,
  Equity:3,
  Income:4,
  Expense:5,

  Contra:6,
}as const;
export const ACCOUNT_TYPE_LABELS: Record<number, string> = {
  1: 'Assets',
  2: 'Liabilities',
  3: 'Equity',
  4: 'Income',
  5: 'Expenses',
  6: 'Contra Accounts',
}

export const AccountSubTypes = {
  // ASSETS
  Bank: 1,
  Receivable: 2,
  OtherFixedAsset: 3,
  OtherCurrentAsset: 4,

  // LIABILITIES
  Payable: 5,
  CreditCard: 6,
  OtherLongTermLiability: 7,
  OtherCurrentLiability: 8,

  // EQUITY
  Equity: 9,

  // INCOME & EXPENSES
  Income: 10,
  Expense: 11,
  InventoryAdjustment: 12,   // <-- new granular subType

  // CONTRA ACCOUNTS
  ContraAsset: 13,
  ContraLiability: 14,
  ContraEquity: 15,
  ContraIncome: 16,
  ContraExpense: 17,
} as const;



  export type PrevState = {
    success?: boolean;
    message?: string;
    errors?: Record<string, string[]>;
  } ;

// src/types/journal-types.ts
export interface JournalLine {
  id: number
  accountId: number
  accountTitle: string
  side: boolean
  amount: number
  description: string
}

export interface JournalEntry {
  transactionId: number
  entryDate: Date
  description: string
  userName: string
  lines: JournalLine[]
  totalDebit: number
  totalCredit: number
}

export type LedgerEntry = {
  id: number
  date: Date
  description: string
  debit: number
  credit: number
  balance: number
}

export type TrialBalanceRow = {
  accountId: number
  accountTitle: string
  debit: number
  credit: number
}

export type IncomeStatementRow = {
  title: string
  debit: number
  credit: number
  accountType: number
}

export type BalanceSheetSection = {
  title: string
  balance: number
  contraAccounts: {
    title: string
    balance: number
  }[]
}

export type BalanceSheetResult = {
  assets: BalanceSheetSection[]
  liabilities: BalanceSheetSection[]
  equity: BalanceSheetSection[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  netIncome: number
  error?: string
} | null;

export type CashFlowSection = {
  title: string
  debit: number
  credit: number
}

export type JournalWhereBase = {
  companyId: number
  isDeleted: boolean
  entryDate?: {
    gte?: Date
    lte?: Date
  }
}

export type SubscriptionState =
  | 'ACTIVE'
  | 'GRACE'
  | 'EXPIRED'
  | 'FREE'