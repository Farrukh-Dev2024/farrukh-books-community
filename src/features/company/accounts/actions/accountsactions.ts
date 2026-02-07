/*
    accountsactions.ts
    All server actions related to accounts will go here
*/
'use server'
import { prisma } from '../../../../lib/prisma'
import { CompanyRoles, PrevState, UserRoles } from '@/types/project-types'
import { escapeHtml } from '@/lib/htmlfunctions';
import { z } from "zod";
import { AccountTypes, AccountSubTypes } from '@/types/project-types'
import { canManageAccounts,canUseAccounts } from '@/lib/permissions/permissions'
import { getAuthUserCompanyOrThrow } from '@/lib/permissions/helperfunctions'

const defaultAccounts = [
  //US GAAP friendly generally accepted accounting principles
  // ASSETS - Current Assets
  { title: "Cash", description: "Petty cash, cash in safe", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.Bank },
  { title: "Bank Accounts", description: "Checking account, savings account", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.Bank },
  { title: "Accounts Receivable", description: "Customer invoices", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.Receivable },
  { title: "Prepaid Expenses", description: "Insurance paid in advance", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.OtherCurrentAsset },
  { title: "Short-term Investments", description: "3-month treasury bills", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.OtherCurrentAsset },

  /*
  | Account Title             | Type        | SubType                  | Side   | Notes                                      |
  | ------------------------- | ----------- | ------------------------ | ------ | ------------------------------------------ |
  | Stock                     | Asset (1)   | OtherCurrentAsset (4)    | Debit  | Tracks current inventory balance.          |
  | Stock Purchases           | Expense (5) | Expense (11)             | Debit  | Purchases of stock.                        |
  | Stock Adjustment          | Expense (5) | InventoryAdjustment (12) | Debit  | For losses, write-offs, shrinkage.         |
  | Stock Transfer            | Asset (1)   | OtherCurrentAsset (4)    | Debit  | Moving stock between warehouses/locations. |
  | Cost of Goods Sold (COGS) | Expense (5) | Expense (11)             | Debit  | For reporting sold stock cost.             |
  | Stock Returns         | Asset (1)   | OtherCurrentAsset (4)    | Debit  | Stock returned to inventory.               |
  | Stock Contra Account  | Contra (6)  | ContraAsset (13)         | Credit | To offset inventory adjustments if needed. |
 
  */
  //inventory and its sub types together
  // Stock / Inventory assets
  { title: "Stock", description: "Raw materials, finished goods", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.OtherCurrentAsset },
  // Stock-related expenses
  { title: "Stock Purchases", description: "Purchases of stock for resale", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Stock Adjustment", description: "Write-offs, shrinkage, corrections", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.InventoryAdjustment },
  // Stock transfers and returns (asset accounts)
  { title: "Stock Transfer", description: "Transfer of stock between locations", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.OtherCurrentAsset },
  { title: "Stock Returns", description: "Stock returned to inventory", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.OtherCurrentAsset },
  // Contra account for stock adjustments
  { title: "Stock Contra Account", description: "Contra account for stock adjustments", side: false, accountType: AccountTypes.Contra, subType: AccountSubTypes.ContraAsset },
  // Expenses - Cost of Sales
  { title: "Cost of Goods Sold", description: "Materials purchased for products sold", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },

  //discound accounts
  { title: "Sales Discounts", description: "Discounts given to customers", side: true, accountType: AccountTypes.Contra, subType: AccountSubTypes.ContraIncome },
  { title: "Purchase Discounts", description: "Discounts received from suppliers", side: false, accountType: AccountTypes.Contra, subType: AccountSubTypes.ContraExpense },
  
  // ASSETS - Non-current Assets
  { title: "Land", description: "Office land plot", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.OtherFixedAsset },
  { title: "Buildings", description: "Office building", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.OtherFixedAsset },
  { title: "Furniture & Fixtures", description: "Office desks, shelves", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.OtherFixedAsset },
  { title: "Vehicles", description: "Delivery van", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.OtherFixedAsset },
  { title: "Computers & Equipment", description: "Laptops, printers", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.OtherFixedAsset },
  { title: "Long-term Investments", description: "Stocks held >1 year", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.OtherFixedAsset },
  { title: "Intangible Assets", description: "Trademark, patent", side: true, accountType: AccountTypes.Asset, subType: AccountSubTypes.OtherFixedAsset },

  // LIABILITIES - Current Liabilities
  { title: "Accounts Payable", description: "Supplier bills", side: false, accountType: AccountTypes.Liability, subType: AccountSubTypes.Payable },
  { title: "Credit Cards", description: "Corporate credit card balance", side: false, accountType: AccountTypes.Liability, subType: AccountSubTypes.CreditCard },
  { title: "Accrued Expenses", description: "Salaries payable, utilities payable", side: false, accountType: AccountTypes.Liability, subType: AccountSubTypes.OtherCurrentLiability },
  { title: "Short-term Loans", description: "Bank overdraft, short-term note", side: false, accountType: AccountTypes.Liability, subType: AccountSubTypes.OtherCurrentLiability },
  { title: "Unearned Revenue", description: "Advance payment from customer", side: false, accountType: AccountTypes.Liability, subType: AccountSubTypes.OtherCurrentLiability },

  // LIABILITIES - Non-current Liabilities
  { title: "Long-term Loans", description: "5-year bank loan", side: false, accountType: AccountTypes.Liability, subType: AccountSubTypes.OtherLongTermLiability },
  { title: "Lease Obligations", description: "Office equipment lease", side: false, accountType: AccountTypes.Liability, subType: AccountSubTypes.OtherLongTermLiability },
  { title: "Bonds Payable", description: "Corporate bond issuance", side: false, accountType: AccountTypes.Liability, subType: AccountSubTypes.OtherLongTermLiability },

  // EQUITY
  { title: "Owner’s Capital", description: "Initial investment", side: false, accountType: AccountTypes.Equity, subType: AccountSubTypes.Equity },
  { title: "Owner’s Drawings", description: "Withdrawals by owner", side: true, accountType: AccountTypes.Equity, subType: AccountSubTypes.Equity },
  { title: "Common Stock", description: "Shares issued to investors", side: false, accountType: AccountTypes.Equity, subType: AccountSubTypes.Equity },
  { title: "Preferred Stock", description: "Shares with fixed dividends", side: false, accountType: AccountTypes.Equity, subType: AccountSubTypes.Equity },
  { title: "Retained Earnings", description: "Accumulated profit", side: false, accountType: AccountTypes.Equity, subType: AccountSubTypes.Equity },
  { title: "Dividends", description: "Dividend payments to shareholders", side: true, accountType: AccountTypes.Equity, subType: AccountSubTypes.Equity },

  // INCOME - Operating
  { title: "Sales Revenue", description: "Product sales", side: false, accountType: AccountTypes.Income, subType: AccountSubTypes.Income },
  { title: "Service Revenue", description: "Consulting services", side: false, accountType: AccountTypes.Income, subType: AccountSubTypes.Income },
  { title: "Rental Income", description: "Rent from sublet", side: false, accountType: AccountTypes.Income, subType: AccountSubTypes.Income },

  // INCOME - Non-operating
  { title: "Interest Income", description: "Bank interest", side: false, accountType: AccountTypes.Income, subType: AccountSubTypes.Income },
  { title: "Commission Income", description: "Referral commissions", side: false, accountType: AccountTypes.Income, subType: AccountSubTypes.Income },
  { title: "Gain on Asset Sale", description: "Sale of old equipment", side: false, accountType: AccountTypes.Income, subType: AccountSubTypes.Income },


  // EXPENSES - Operating
  { title: "Salaries Expense", description: "Staff salaries expense", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Salaries Payable", description: "Staff salaries liability", side: true, accountType: AccountTypes.Liability, subType: AccountSubTypes.Payable },

  { title: "Rent Expense", description: "Office rent", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Utilities", description: "Electricity, water", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Office Supplies", description: "Stationery", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Advertising & Marketing", description: "Google ads, flyers", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Insurance Expense", description: "Liability insurance", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Depreciation Expense", description: "Annual depreciation of assets", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Repairs & Maintenance", description: "Equipment repair", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Bank Fees", description: "Monthly service fees", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Travel & Entertainment", description: "Business trip costs", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Professional Fees", description: "Legal, accounting services", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Interest Expense", description: "Loan interest", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },
  { title: "Taxes Expense", description: "Corporate income tax", side: true, accountType: AccountTypes.Expense, subType: AccountSubTypes.Expense },

  // CONTRA ASSET
  { title: "Accumulated Depreciation", description: "Total depreciation on fixed assets", side: false, accountType: AccountTypes.Contra, subType: AccountSubTypes.ContraAsset },
  { title: "Allowance for Doubtful Accounts", description: "Estimated uncollectible receivables", side: false, accountType: AccountTypes.Contra, subType: AccountSubTypes.ContraAsset },

  // CONTRA LIABILITY
  { title: "Discount on Bonds Payable", description: "Difference between par and issue price", side: true, accountType: AccountTypes.Contra, subType: AccountSubTypes.ContraLiability },

  // CONTRA EQUITY
  { title: "Treasury Stock", description: "Company’s own stock repurchased", side: true, accountType: AccountTypes.Contra, subType: AccountSubTypes.ContraEquity },

  // CONTRA INCOME
  { title: "Sales Returns & Allowances", description: "Refunds and allowances given to customers", side: true, accountType: AccountTypes.Contra, subType: AccountSubTypes.ContraIncome },

  // CONTRA EXPENSE

];

export async function addDefaultAccounts(companyId: number) {
  'use server'
  // const session = await auth();

  // //check if user is loged in
  // if (!session || !session.user) { return { success: false, message: "User not logged in,", errors: {} } }

  // //get user from db and check if he alread has a company
  // const tmpform = new FormData(); tmpform.append("email", session?.user?.email || "");
  // const userdb = await getuser({}, tmpform);

  const userdb = await getAuthUserCompanyOrThrow();
  if (!userdb) { return { success: false, message: "database user not found,", errors: {} }; }
  if (userdb.companyId == null) { return { success: false, message: "Cannot add accounts to this user, dont have     company", errors: {} }; }
  //  if (userdb.companyRole < CompanyRoles.FullAccess) {return{success:false,message:"this user dont have rights to addDefaultAccounts",errors:{}};}
  if (!canManageAccounts(userdb)) { return { success: false, message: "this user dont have rights to addDefaultAccounts", errors: {} }; }
  //const companyId = userdb.companyId; // Change as needed

  for (const acc of defaultAccounts) {
    await prisma.account.create({
      data: {
        companyId,
        accountType: Number(acc.accountType),
        accountSubType: Number(acc.subType),
        title: acc.title,
        description: acc.description,
        side: acc.side,
        balance: (0),
        isDeleted: false
      }
    });
  }

  console.log("✅ Chart of Accounts seeded successfully!");
}
//list all accounts 
//add account
//modify account
//delete account

// title:          formData.get("title"),
// description:    formData.get("description"),
// avatarUrl:      formData.get("avatarUrl"),
// balance:        formData.get("balance");

const accountSchema = z.object({
  title: z
    .string()
    .min(1, "Account name is required")
    .refine(
      (val) => val.trim().split(/\s+/).length <= 50,
      { message: "Account name must be 50 words or fewer" }
    )
    .refine(
      (val) => /^[a-zA-Z0-9. ]+$/.test(val),
      { message: "Account name can only contain letters, numbers, spaces, and dots" }
    ),

  description: z
    .string()
    .min(1, "Account Description is required")
    .max(10000, "Too long, max 10000 chars") // Just to prevent excessive input
    .refine(
      (val) => /^[a-zA-Z0-9. ]+$/.test(val),
      { message: "Account description name can only contain letters, numbers, spaces, and dots" }
    ),

  avatarUrl: z
    .string()
    .refine(
      (val) =>
        val === '' ||
        z.string().url().safeParse(val).success ||
        val.startsWith('/'),
      { message: "Avatar URL must be empty, a valid URL, or a relative path" }
    ),
  balance: z
    .number({
      required_error: "Balance is required",
      invalid_type_error: "Balance must be a number",
    }),
  accountType: z
    .number({
      required_error: "Account type is required",
      invalid_type_error: "Account type must be a number",
    }),
  accountSubType: z
    .number({
      required_error: "Account sub type is required",
      invalid_type_error: "Account sub type must be a number",
    }),
  side: z
    .boolean({
      required_error: "Side is required",
      invalid_type_error: "Side must be true or false",
    })
});

/* -------------------------------------------------------------------------- */
/*                               Create Account                               */
/* -------------------------------------------------------------------------- */
export async function createaccount(prevState: PrevState, formData: FormData) {
  'use server'

  try {
    // const session = await auth();
    // if (!session?.user) return { success: false, message: "User not logged in", errors: {} };

    // const tmpform = new FormData();
    // tmpform.append("email", session.user.email || "");
    // const userdb = await getuser({}, tmpform);

    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb) return { success: false, message: "Database user not found", errors: {} };
    if (!userdb.companyId) return { success: false, message: "User has no company", errors: {} };
    //if (userdb.companyRole < CompanyRoles.Accountant && userdb.userRole < UserRoles.Admin) return { success: false, message: "User lacks rights to create account", errors: {} };
    if (!canManageAccounts(userdb)) return { success: false, message: "User lacks rights to create account", errors: {} };

    const input = {
      title: formData.get("title")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      avatarUrl: formData.get("avatarUrl")?.toString() || "",
      balance: Number(formData.get("balance")) || 0,
      accountType: Number(formData.get("accountType")?.toString()) || 0,
      accountSubType: Number(formData.get("accountSubType")?.toString()) || 0,
      side: formData.get("side") === "true" ? true : false,
    };

    const result = accountSchema.safeParse(input);
    if (!result.success) {
      return { success: false, errors: result.error.flatten().fieldErrors };
    }

    const { title, description, avatarUrl, balance, accountType, accountSubType, side } = result.data;

    const res = await prisma.account.create({
      data: {
        title,
        description,
        avatarUrl,
        balance,
        accountType,
        accountSubType,
        side,
        companyId: userdb.companyId,
      },
    });

    const safeAccount = {
      ...res,
      balance: res.balance.toNumber(), // ✅ convert Decimal to number
    }
    return { success: true, message: "Account created successfully" , account: safeAccount };
  } catch (error) {
    console.error("Error creating account:", error);
    return { success: false, message: "Error creating account", errors: {} };
  }
}


/* -------------------------------------------------------------------------- */
/*                               Update Account                               */
/* -------------------------------------------------------------------------- */
export async function updateaccount(prevState: PrevState, formData: FormData): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return { success: false, message: 'User not logged in', errors: {} }

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)

    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return { success: false, message: 'User has no company', errors: {} }
    //if (userdb.companyRole < CompanyRoles.Accountant && userdb.userRole < UserRoles.Admin) return { success: false, message: "User lacks rights to create account", errors: {} };
    if (!canManageAccounts(userdb)) return { success: false, message: 'User lacks rights to update account', errors: {} }

    const accountId = Number(formData.get('id'))
    if (!accountId) return { success: false, message: 'Invalid account ID', errors: {} }

    const input = {
      title: formData.get('title')?.toString() || '',
      description: formData.get('description')?.toString() || '',
      avatarUrl: formData.get('avatarUrl')?.toString() || '',
      balance: Number(formData.get('balance')) || 0,
      accountType: Number(formData.get('accountType')) || 0,
      accountSubType: Number(formData.get('accountSubType')) || 0,
      side: formData.get('side') === 'true' ? true : false,
    };

    const parsed = accountSchema.safeParse(input)
    if (!parsed.success) return { success: false, errors: parsed.error.flatten().fieldErrors }

    const existing = await prisma.account.findFirst({
      where: { id: accountId, companyId: userdb.companyId, isDeleted: false },
    })
    if (!existing) return { success: false, message: 'Account not found or unauthorized', errors: {} }

    await prisma.account.update({
      where: { id: accountId },
      data: parsed.data,
    })

    return { success: true, message: 'Account updated successfully' }
  } catch (error) {
    console.error('Error updating account:', error)
    return { success: false, message: 'Error updating account', errors: {} }
  }
}

/* -------------------------------------------------------------------------- */
/*                               Delete Account                               */
/* -------------------------------------------------------------------------- */
export async function deleteaccount(prevState: PrevState, formData: FormData): Promise<PrevState> {
  'use server'
  try {
    // const session = await auth();
    // if (!session?.user) return { success: false, message: 'User not logged in', errors: {} };

    // const tmpform = new FormData();
    // tmpform.append('email', session.user.email || '');
    // const userdb = await getuser({}, tmpform);

    const userdb = await getAuthUserCompanyOrThrow();
    if (!userdb?.companyId) return { success: false, message: 'User has no company', errors: {} };
    // if (userdb.companyRole < CompanyRoles.Accountant && userdb.userRole < UserRoles.Admin)
    //   return { success: false, message: 'User lacks rights to delete account', errors: {} };
    if (!canManageAccounts(userdb)) return { success: false, message: 'User lacks rights to delete account', errors: {} };
    
    const accountId = Number(formData.get('id'));
    if (!accountId) return { success: false, message: 'Invalid account ID', errors: {} };

    const account = await prisma.account.findFirst({
      where: { id: accountId, companyId: userdb.companyId, isDeleted: false },
    });
    if (!account) return { success: false, message: 'Account not found or unauthorized', errors: {} };

    await prisma.account.update({
      where: { id: accountId },
      data: { isDeleted: true },
    });

    return { success: true, message: 'Account deleted successfully' };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, message: 'Error deleting account', errors: {} };
  }
}


/* -------------------------------------------------------------------------- */
/*                               Get Accounts                                 */
/* -------------------------------------------------------------------------- */
export async function getaccounts() {
  'use server'
  try {
    // const session = await auth()
    // if (!session?.user) return []

    // const tmpform = new FormData()
    // tmpform.append('email', session.user.email || '')
    // const userdb = await getuser({}, tmpform)
    const userdb = await getAuthUserCompanyOrThrow();    
    if (!userdb?.companyId) return []

    const accounts = await prisma.account.findMany({
      where: { companyId: userdb.companyId, isDeleted: false },
      orderBy: { title: 'asc' },
    })

    // Group totals
    const debitSums = await prisma.journal.groupBy({
      by: ['accountId'],
      where: { companyId: userdb.companyId, side: true, isDeleted: false },
      _sum: { amount: true },
    })

    const creditSums = await prisma.journal.groupBy({
      by: ['accountId'],
      where: { companyId: userdb.companyId, side: false, isDeleted: false },
      _sum: { amount: true },
    })

    // Merge and compute balance per account
    const safeAccounts = accounts.map((acc) => {
      const debit = debitSums.find(d => d.accountId === acc.id)?._sum.amount ?? 0
      const credit = creditSums.find(c => c.accountId === acc.id)?._sum.amount ?? 0

      // ✅ Use account's own side to decide direction
      const balance: number = acc.side
        ? Number(debit) - Number(credit)   // debit-type account
        : Number(credit) - Number(debit)   // credit-type account

      return { ...acc, balance }
    })

    return safeAccounts
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return []
  }
}