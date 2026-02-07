// src/types/prisma-types.ts
export interface User {
  id: number
  companyId: number | null
  companyRole: number
  name: string | null
  email: string
  password: string
  userRole: number
  createdAt: Date
  updatedAt: Date
  lastLogin: Date | null
  logs?: string | null
  isBanned: boolean
  isDeleted: boolean
  messages: string | null
  avatarUrl: string | null
  imageUploadCount: number
  lastImageUploadDate: Date | null
  

  company?: Company | null
  journals?: Journal[]
  images?: Image[]
}

export interface Company {
  id: number
  title: string | null
  description: string | null
  ownerId: number
  createdAt: Date
  updatedAt: Date
  extraData?:  string  | null
  isDeleted: boolean
  avatarUrl: string | null

  currencyCode: string
  currencySymbol: string
  currencyName: string
  businessType: number

  users?: User[]
  invites?: CompanyInvite[]
  accounts?: Account[]
  journals?: Journal[]
}

export interface CompanyInvite {
  id: number
  companyId: number
  email: string
  title: string
  description: string
  role: number
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
  isRejected: boolean
  isAccepted: boolean

  company: Company | null
}

export interface Journal {
  id: number
  transactionId: number
  companyId: number
  accountId: number
  side: boolean
  amount: number
  description: string
  entryDate: Date
  createdAt: Date
  updatedAt: Date
  lastChangeByUserId: number
  extraData?: string | null
  isDeleted: boolean

  company: Company | null
  account: Account | null
  lastChangedByUser: User | null
}

export interface Account {
  id: number
  companyId: number
  accountType: number
  accountSubType: number
  title: string
  description: string
  avatarUrl: string | null
  side: boolean
  createdAt: Date
  updatedAt: Date
  extraData?:  string | null
  permissions: string  | null
  isDeleted: boolean
  balance: number

  company?: Company
  journalEntries?: Journal[]
}

export interface Image {
  id: string
  userId: number
  size: number
  data: string
  createdAt: string
  updatedAt: string

  user: User | null
}

export interface Product {
  id: number
  companyId: number
  title: string
  sku: string
  barcode?: string | null
  description?: string | null
  categoryId?: number | null
  category?: ProductCategory | null
  sellingPrice: number
  costPrice: number
  reorderLevel?: number | null
  stockQuantity: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  defaultLocation?: string | null
}


export interface ProductCategory {
  id: number
  companyId: number
  name: string
  description?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: number
  companyId: number
  accountId1:   number
  accountId2:   number  
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  createdAt: Date
  updatedAt: Date

  arBalance: number // this will be filled by a query with aggregation
}



export type SalesOrder = {
  id: number
  companyId: number
  customerId: number
  orderNumber: string
  orderStatus: string
  discountAmount: number 
  totalAmount: number
  paidAmount: number
  dateIssued: Date
  dueDate?: Date | null
  transactionId?: number | null
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
  extraData?:  string | null
  orderComments?:  string | null
  createdById: number
  updatedById: number
  customer?: Customer
  items?: SalesOrderItem[]
}
export interface SalesOrderItem {
  id: number
  salesOrderId: number
  transactionId?: number | null
  productId: number
  quantity: number
  unitPrice: number
  totalPrice: number
  discountAmount: number
  product: Product
}

/*
| Status       | Meaning                                                     | Journal                      | Editable                 |
| ------------ | ----------------------------------------------------------- | ---------------------------- | ------------------------ |
| **DRAFT**    | Quote or unsubmitted order                                  | ❌ No                         | ✅ Yes                    |
| **OPEN**     | Confirmed sales order (awaiting invoice)                    | ❌ No                         | ✅ Yes                    |
| **INVOICED** | Invoice issued, inventory + accounting affected             | ✅ Yes                        | ❌ Lock prices/quantities |
| **PAID**     | Customer payment received                                   | ✅ (Payment journal)          | ❌ Fully locked           |
| **CANCELED** | reverse the entries, order gone forever                     | ✅ reverse entries in journal | ❌                        |
*/

export type OrderStatus = 'DRAFT' | 'OPEN' | 'INVOICED' | 'PAID' | 'CANCELED'; 
export const ORDER_STATUSES: OrderStatus[] = ['DRAFT','OPEN', 'INVOICED', 'PAID', 'CANCELED'];
export type StockType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT'

export interface Vendor {
  id: number
  companyId: number
  accountId1:   number
  accountId2:   number    
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
  extraData?: string | null

  apBalance: number // this will be filled by a query with aggregation
  
  company?: Company
  purchaseOrders?: PurchaseOrder[]
}

export interface PurchaseOrder {
  id: number
  companyId: number
  vendorId: number
  orderNumber: string
  transactionId?: number | null
  orderStatus: string
  totalAmount: number
  paidAmount: number
  discountAmount: number
  dateIssued: Date
  dueDate?: Date | null
  orderComments?:  string | null
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
  extraData?: string | null

  company?: Company
  vendor?: Vendor
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: number
  purchaseOrderId: number
  productId: number | null
  quantity: number
  unitCost: number
  totalCost: number
  discountAmount: number
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
  extraData?: string | null

  purchaseOrder?: PurchaseOrder
  product?: Product
}

export type PurchaseOrderStatus = 'DRAFT' | 'OPEN' | 'RECEIVED' | 'BILLED' | 'PAID' | 'CANCELED';
export const PURCHASEORDER_STATUSES: PurchaseOrderStatus[] = ['DRAFT', 'OPEN', 'RECEIVED', 'BILLED', 'PAID', 'CANCELED']; 

// Payroll Employee
export type PayrollEmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
export const PAYROLL_EMPLOYEE_STATUSES: PayrollEmployeeStatus[] = ['ACTIVE', 'INACTIVE', 'TERMINATED'];

// Salary Type
export type SalaryType = 'MONTHLY' | 'HOURLY';
export const SALARY_TYPES: SalaryType[] = ['MONTHLY', 'HOURLY'];

// Pay Item Type
export type PayItemType = 'ALLOWANCE' | 'DEDUCTION';
export const PAYITEM_TYPES: PayItemType[] = ['ALLOWANCE', 'DEDUCTION'];

// Pay Item Mode
export type PayItemMode = 'FIXED' | 'HOURLY';
export const PAYITEM_MODES: PayItemMode[] = ['FIXED', 'HOURLY'];

// PayRun Status
export type PayRunStatus = 'DRAFT' | 'APPROVED' | 'POSTED';
export const PAYRUN_STATUSES: PayRunStatus[] = ['DRAFT', 'APPROVED', 'POSTED'];

// PaySlip Status
export type PaySlipStatus = 'DRAFT' | 'APPROVED' | 'LOCKED';
export const PAYSLIP_STATUSES: PaySlipStatus[] = ['DRAFT', 'APPROVED', 'LOCKED'];

// Payroll Setting PayCycle
export type PayCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export const PAYCYCLES: PayCycle[] = ['DAILY', 'WEEKLY', 'MONTHLY'];

// Payroll Setting RoundingMode
export type RoundingMode = 'NONE' | 'NEAREST' | 'UP' | 'DOWN';
export const ROUNDING_MODES: RoundingMode[] = ['NONE', 'NEAREST', 'UP', 'DOWN'];

// ───────────────────────────────────────────────────────────────
// PAY ITEM
// ───────────────────────────────────────────────────────────────
export interface PayItem {
  id: number
  companyId: number
  company?: Company

  title: string
  type: PayItemType        // "ALLOWANCE" | "DEDUCTION"
  mode: PayItemMode        // "FIXED" | "HOURLY"
  amount: number

  createdAt: Date
  updatedAt: Date

  employeePayItems?: PayrollEmployeePayItem[]
  payslipItems?: PaySlipItem[]
}

// ───────────────────────────────────────────────────────────────
// PAYROLL EMPLOYEE
// ───────────────────────────────────────────────────────────────
export interface PayrollEmployee {
  id: number
  companyId: number
  company?: Company

  accountId1:   number
  accountId2:   number

  firstName: string
  lastName?: string | null
  email?: string | null
  phone?: string | null

  baseSalary: number
  salaryType: string         // "MONTHLY" | "HOURLY"
  joinDate: Date
  status: string  // ACTIVE | INACTIVE | TERMINATED

  createdAt: Date
  updatedAt: Date

  createdById: number
  updatedById: number

  assignedPayItems?: PayrollEmployeePayItem[]
  paySlips?: PaySlip[]
}

// ───────────────────────────────────────────────────────────────
// EMPLOYEE ↔ PAY ITEM ASSIGNMENT
// ───────────────────────────────────────────────────────────────
export interface PayrollEmployeePayItem {
  id: number
  companyId: number

  employeeId: number
  employee?: PayrollEmployee

  payItemId: number
  payItem?: PayItem

  customAmount?: number | null
  customMode?: PayItemMode | null  // override FIXED/HOURLY

  createdAt: Date
  updatedAt: Date
}

// ───────────────────────────────────────────────────────────────
// PAY RUN
// ───────────────────────────────────────────────────────────────
export interface PayRun {
  id: number
  companyId: number
  company?: Company

  periodStart: Date
  periodEnd: Date
  status: PayRunStatus       // "DRAFT" | "APPROVED" | "POSTED"

  approvedByUserId?: number | null
  approvedBy?: User | null

  postedToJournal: boolean
  transactionId?: number | null

  notes?: string | null

  createdAt: Date
  updatedAt: Date

  paySlips?: PaySlip[]
}

// ───────────────────────────────────────────────────────────────
// PAY SLIP
// ───────────────────────────────────────────────────────────────
export interface PaySlip {
  id: number

  payRunId: number
  payRun?: PayRun

  employeeId: number
  employee?: PayrollEmployee

  grossPay: number
  totalAllowances: number
  totalDeductions: number
  netPay: number

  status: PaySlipStatus    // "DRAFT" | "APPROVED" | "LOCKED"
  excluded: boolean

  createdAt: Date
  updatedAt: Date

  items?: PaySlipItem[]
}

// ───────────────────────────────────────────────────────────────
// PAY SLIP ITEM (individual allowance/deduction line)
// ───────────────────────────────────────────────────────────────
export interface PaySlipItem {
  id: number

  payslipId: number
  payslip?: PaySlip

  payItemId?: number | null
  payItem?: PayItem | null

  title: string
  type: PayItemType         // ALLOWANCE | DEDUCTION
  mode: PayItemMode         // FIXED | HOURLY
  amount: number

  createdAt: Date
  isDeleted: boolean
}

// ───────────────────────────────────────────────────────────────
// PAYROLL SETTINGS
// ───────────────────────────────────────────────────────────────
export interface PayrollSetting {
  id: number
  companyId: number
  company?: Company

  payCycle: PayCycle        // DAILY | WEEKLY | MONTHLY
  roundingMode: RoundingMode // NONE | NEAREST | UP | DOWN

  createdAt: Date
  updatedAt: Date
}

export interface PayrollEmployeeAttendance {
  id: number;
  companyId: number;

  employeeId: number;
  employee?: PayrollEmployee;

  date: Date;              // ISO string
  status: string;  // "PRESENT" | "ABSENT" | "HALFDAY" | "LEAVE";

  checkIn: Date | null;
  checkOut: Date | null;

  dailyNote?: string | null;

  createdAt: Date;
  updatedAt: Date;
}


export type SubscriptionPlan = {
    name: string;
    id: number;
    code: string;
    monthlyPrice: number | null;
    yearlyPrice: number | null;
    maxInvites: number | null;
    dailyTransactionLimit: number | null;
    monthlyBackupLimit: number | null;
    canViewAllReports: boolean;
    isAutoPlan: boolean;
    isAdminOnly: boolean;
    autoExpireDays: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export type SubscriptionRow = {
  companyId: number
  companyTitle: string
  planCode: string
  planName: string
  status: string
  billingCycle: string
  endsAt: Date | null
}


export type UpgradeRequestRow = {
  id: number

  companyId: number
  companyTitle: string

  currentPlanName: string
  requestedPlanName: string

  status: UpgradeRequestStatus

  requestedBy: string
  reviewedBy: string | null

  note: string | null

  createdAt: Date
  reviewedAt: Date | null
}

export enum UpgradeRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type CompanyUsageRow = {
  companyId: number
  companyTitle: string

  planName: string

  dailyLimit: number | null
  dailyUsed: number

  monthlyBackupLimit: number | null
  monthlyBackupUsed: number

  status: 'OK' | 'WARNING' | 'EXCEEDED'
}

export enum SubscriptionStatus {
  ACTIVE='ACTIVE',
  GRACE='GRACE',
  EXPIRED='EXPIRED'
}