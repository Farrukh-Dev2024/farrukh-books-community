'use client';

import * as React from 'react';
import updates from "@/update-notes.json";
import { useSession } from 'next-auth/react';

import NavBar from '@/features/navbar/NavBar'

import LoginForm from '@/features/auth/components/LoginForm'
import LogOutForm from '@/features/auth/components/LogoutForm';

import { loginAction, createuser, getuser, clearusermessages } from '@/features/auth/actions/authactions';
import { getProducts } from '../company/inventory/actions/productactions';
import { getCustomers } from '../company/sales/customers/actions/customeractions';

import { useParams, usePathname, useSearchParams } from 'next/navigation'
import UserSettingsForm from '../auth/components/UserSettingsForm';
import UserProfile from '../auth/components/UserProfile';
import WelcomePage from '../company/WelcomePage';

import { toast } from 'sonner'
import { Session } from 'next-auth';
import { useAppContext } from '@/context/AppContext';
import EditCompany from '../company/admin/components/EditCompany';
import ViewCompany from '../company/admin/components/ViewCompany';
import CreateCompany from '../company/admin/components/CreateCompany';
import InviteCompany from '../company/admin/components/InviteCompany';
import AccountList from '../company/accounts/components/AccountList';
import JournalEntryForm from '../company/accounts/journal/components/JournalEntryForm';
import { getaccounts } from '../company/accounts/actions/accountsactions';
import JournalList from '../company/accounts/journal/components/JournalList';
import { User, Company, Account, Journal, Image, CompanyInvite, Vendor, PurchaseOrder, Customer } from '@/types/prisma-types';
import GeneralLedger from '../company/accounts/ledger/components/GeneralLedger';
import TrialBalance from '../company/accounts/trialbalance/components/TrialBalance';
import IncomeStatement from '../company/accounts/incomestatement/components/IncomeStatement';
import BalanceSheet from '../company/accounts/balancesheet/components/BalanceSheet';
import CashFlowReport from '../company/accounts/cashflow/components/CashFlowReport';
import ProductList from '../company/inventory/components/ProductList';
import ProductForm from '../company/inventory/components/ProductForm';
import CategoryList from '../company/inventory/components/CategoryList';
import CategoryForm from '../company/inventory/components/CategoryForm';
// import StockMovementsPage from '../company/inventory/del-stockmovements/components/StockMovements';
// import StockMovementTable from '../company/inventory/del-stockmovements/components/StockMovementTable';
import CustomerForm from '../company/sales/customers/components/CustomerForm';
import CustomerList from '../company/sales/customers/components/CustomerList';
import CustomerCard from '../company/sales/customers/components/CustomerCard';
// import QuotePage from '../company/sales/del-quotes/components/QuotePage';
// import QuoteList from '../company/sales/del-quotes/components/QuoteList';
// import QuoteForm from '../company/sales/del-quotes/components/QuoteForm';
// import QuoteCard from '../company/sales/del-quotes/components/QuoteCard';
// import SalesInvoicePage from '../company/sales/del-invoices/components/SalesInvoicePage';
// import SalesInvoiceForm from '../company/sales/del-invoices/components/SalesInvoiceForm';
import SalesOrderPage from '../company/sales/orders/components/SalesOrderPage';
import SalesOrderForm from '../company/sales/orders/components/SalesOrderForm';
import VendorList from '../company/purchases/vendors/components/VendorList';
import VendorForm from '../company/purchases/vendors/components/VendorForm';
import VendorCard from '../company/purchases/vendors/components/VendorCard';
import PurchaseOrderList from '../company/purchases/purchaseorders/components/PurchaseOrderList';
import PurchaseOrderForm from '../company/purchases/purchaseorders/components/PurchaseOrderForm';
import PurchaseOrderCard from '../company/purchases/purchaseorders/components/PurchaseOrderCard';
import { getVendors } from '../company/purchases/vendors/actions/vendoractions';
import { getCategories } from '../company/inventory/actions/categoryactions';

import { PushNotificationManager, InstallPrompt } from './PushNotificationManager';
import CreateEmployeeDialog from '../company/payroll/employees/components/CreateEmployeeDialog';
import EditEmployeeDialog from '../company/payroll/employees/components/EditEmployeeDialog';
import EmployeeForm from '../company/payroll/employees/components/EmployeeForm';
import EmployeeList from '../company/payroll/employees/components/EmployeeList';
import YearCloseComponent from '../company/accounts/yearclose/components/YearCloseComponent';
import PayItemListPage from '../company/payroll/payitems/components/PayItemListPage';
import EmployeePayItemListPage from '../company/payroll/employeepayitems/components/EmployeePayItemListPage';
import { getEmployees } from '../company/payroll/employees/actions/employeeActions';
import EmployeeAttendance from '../company/payroll/employeeAttendance/components/EmployeeAttendance';
import PayRunForm from '../company/payroll/payrun/components/PayRunForm';
import PayRunPage from '../company/payroll/payrun/components/PayRunPage';
import PaySlipsList from '../company/payroll/payrun/components/PaySlipsList';
//import CompanyBackupsPage from '../backup/user/pages/company-backups-page';

/*interface IMainPageProps {
}*/
/* in client component
     useParams /app/user/[id]/page.tsx 
    useSearchParams // example: ?filter=active
    usePathname // /dashboard/settings
*/

/* in server component 
    export default function Page({ params }: { params: { id: string } }) {
*/

const MainPage: React.FunctionComponent = (props) => {
  const { data: session, status } = useSession();
  const [loaded, setLoaded] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [company, setCompany] = React.useState<Company | null>(null);

  const { id } = useParams()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const page = searchParams.get('page') || '';

  const [userMessages, setUserMessages] = React.useState<string>("");
  const { appData, setAppData } = useAppContext();
  const prevRefreshCountRef = React.useRef<boolean>(appData.userUpdated);

  let CompanyBackupsPage: React.ComponentType<any> | null = null;
  let PremiumFeaturesEnabled = false;
  try {

    CompanyBackupsPage = require('@/features//backup/user/pages/company-backups-page').CompanyBackupsPage;
    PremiumFeaturesEnabled = true;

  } catch (error) {
    //console.error("Failed to load CompanyBackupsPage:", error);
  }


  React.useEffect(() => {
    const parsedMessages = userMessages.split(';').map((msg) => msg.trim()).filter((msg) => msg !== '');
    parsedMessages.forEach((msg) => {
      toast.success(msg)
      console.log(msg); // Log each message to the console
    });
  }, [userMessages]);

  React.useEffect(() => {
    const prevuserUpdated = prevRefreshCountRef.current;
    const userUpdated = appData.userUpdated;

    const fetchUser = async () => {
      const tmpform = new FormData(); tmpform.append("email", session?.user?.email || "");
      const tmpuser = await getuser({}, tmpform)
      //console.log("tmpuser %o",tmpuser);
      setLoaded(true);
      if (tmpuser) {
        setUser(tmpuser);
        setCompany(tmpuser.company);
        setAppData((prev) => ({ ...prev, user: tmpuser, session: session || null, company: tmpuser.company || null }));
        if (tmpuser.messages && tmpuser.messages !== "") {
          // Handle messages if needed, e.g., show a notification
          const messages = tmpuser.messages;
          setUserMessages(messages);
          await clearusermessages({}, tmpform);
        }
        if (tmpuser.companyId) {
          const accounts = await getaccounts();
          const products = await getProducts();
          const customers = await getCustomers();
          const vendors = await getVendors();
          const productCategories = await getCategories();
          const employees = (await getEmployees()).data;
          setAppData((prev) => ({
            ...prev,
            accounts: accounts || null,
            productCategories: productCategories || null,
            products: products || null,
            customers: customers || null,
            vendors: vendors || null,
            payrollemployees: employees || null,
          }));
        }
      } else {
        setUser(null);
      }
    }
    if (prevuserUpdated !== userUpdated && userUpdated == true && user) {
      // Refresh count has changed, fetch user data
      fetchUser();
      setAppData((prev) => ({ ...prev, userUpdated: false }));
    }
    if (!user && session?.user) {
      fetchUser();
    }


    const createUserIfNeeded = async () => {
      const tmpform = new FormData(); tmpform.append("email", session?.user?.email || "");
      await createuser({}, tmpform);
      const tmpuser = await getuser({}, tmpform)
      if (tmpuser) {
        setUser(tmpuser);
        setAppData((prev) => ({ ...prev, user: tmpuser, session: session || null }));
        if (tmpuser.messages && tmpuser.messages !== "") {
          // Handle messages if needed, e.g., show a notification
          const messages = tmpuser.messages;
          setUserMessages(messages);
          await clearusermessages({}, tmpform);
        }

      } else {
        setUser(null);
      }

    }
    if (session?.user && !user && loaded) {
      createUserIfNeeded();
    }


  }, [status, session, loaded, user, appData.userUpdated, appData.companyUpdated, appData.accounts]);
  if (status === "loading") return null;
  //return (<JournalEntryForm accounts={appData.accounts??[]} />)
  // return (<JournalList />);
  return (
    <>
      {/* <div>
        <PushNotificationManager />
        <InstallPrompt />
      </div>     */}
      <main className="flex flex-col  min-h-svh min-w-75 bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark">
        <div className="w-full flex flex-col items-center justify-center">
          <div className="w-full">
            <NavBar user={user || null} />
          </div>
          {!session?.user && (<> <LoginForm /> </>)}
          {loaded && (
            <>
              {session?.user && (
                <>
                  {page === 'userprofile' && user && (<> <UserProfile /> </>)}
                  {page === 'usersettings' && user && (<> <UserSettingsForm email={user?.email || ""} name={user?.name || ""} /> </>)}
                  {page === 'logout' && (<> <LogOutForm /> </>)}

                  {/* if page is not specified or is welcome , then show welcome */}
                  {(page === 'welcomepage' || page === '') && user && (<> <WelcomePage /> </>)}

                  {(page === 'createcompany') && user && (<> <CreateCompany /> </>)}
                  {(page === 'invites') && user && (<> <InviteCompany /> </>)}

                  {(page === 'viewcompany') && user && company && (<><ViewCompany /></>)}
                  {(page === 'viewcompany') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'editcompany') && user && company && (<><EditCompany /></>)}
                  {(page === 'editcompany') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'accountlist') && user && company && (<><AccountList /></>)}
                  {(page === 'accountlist') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'generalledger') && user && company && (<> <GeneralLedger accounts={appData.accounts ?? []} /> </>)}
                  {(page === 'generalledger') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'viewjournal') && user && company && (<> <JournalList /> </>)}
                  {(page === 'viewjournal') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'journalentryform') && user && company && (<> <JournalEntryForm accounts={appData.accounts ?? []} /> </>)}
                  {(page === 'journalentryform') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'yearclosing') && user && company && (<><YearCloseComponent companyId={user.companyId?.toString() ?? ''} /></>)}
                  {(page === 'yearclosing') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'trialbalance') && user && company && (<> <TrialBalance /> </>)}
                  {(page === 'trialbalance') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'incomestatement') && user && company && (<> <IncomeStatement /> </>)}
                  {(page === 'incomestatement') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'balancesheet') && user && company && (<> <BalanceSheet /> </>)}
                  {(page === 'balancesheet') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'cashflow') && user && company && (<> <CashFlowReport /> </>)}
                  {(page === 'cashflow') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'categorylist') && user && company && (<> <CategoryList /> </>)}
                  {(page === 'categorylist') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'categoryform') && user && company && (<> <CategoryForm /> </>)}
                  {(page === 'categoryform') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'productslist') && user && company && (<> <ProductList /> </>)}
                  {(page === 'productslist') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'productsform') && user && company && (<> <ProductForm /> </>)}
                  {(page === 'productsform') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'customerform') && user && company && (<> <CustomerForm /> </>)}
                  {(page === 'customerform') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'customerslist') && user && company && (<> <CustomerList /> </>)}
                  {(page === 'customerslist') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'customercard') && user && company && (<> <CustomerCard customer={{ id: 0, name: '', email: undefined, phone: undefined, address: undefined, city: undefined, country: undefined }} /> </>)}
                  {(page === 'customercard') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'salesorderpage') && user && company && (<> <SalesOrderPage /> </>)}
                  {(page === 'salesorderpage') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'salesorderform') && user && company && (<> <SalesOrderForm mode={'create'} onSuccess={function (): void { }} /> </>)}
                  {(page === 'salesorderform') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'vendorslist') && user && company && (<> <VendorList /> </>)}
                  {(page === 'vendorslist') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'vendorform') && user && company && (<> <VendorForm /> </>)}
                  {(page === 'vendorform') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'purchaseorderslist') && user && company && (<> <PurchaseOrderList /> </>)}
                  {(page === 'purchaseorderslist') && user && !company && (<><WelcomePage /></>)}


                  {(page === 'createemployee') && user && company && (<> <CreateEmployeeDialog /> </>)}
                  {(page === 'createemployee') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'employeeform') && user && company && (<> <EmployeeForm /> </>)}
                  {(page === 'employeeform') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'employeelist') && user && company && (<> <EmployeeList /> </>)}
                  {(page === 'employeelist') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'payitemslist') && user && company && (<> <PayItemListPage /> </>)}
                  {(page === 'payitemslist') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'employeepayitemslist') && user && company && (<> <EmployeePayItemListPage /> </>)}
                  {(page === 'employeepayitemslist') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'employeeattendance') && user && company && (<> <EmployeeAttendance /> </>)}
                  {(page === 'employeeattendance') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'payrunform') && user && company && (<> <PayRunForm /> </>)}
                  {(page === 'payrunform') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'payrunpage') && user && company && (<> <PayRunPage companyId={user.companyId!} /> </>)}
                  {(page === 'payrunpage') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'paysliplist') && user && company && (<> <PaySlipsList payRunId={1} /> </>)}
                  {(page === 'paysliplist') && user && !company && (<><WelcomePage /></>)}

                  {(page === 'backups') && user && company && CompanyBackupsPage !== null && PremiumFeaturesEnabled &&(<> <CompanyBackupsPage /> </>)}
                  {(page === 'backups') && user && (!company || !PremiumFeaturesEnabled) && (<><WelcomePage /></>)}


                </>
              )}
            </>
          )}

        </div>

        {/* --- Update Notes GO HERE --- */}
        <div className="mt-auto w-full text-center py-4 opacity-60 text-sm max-w-3xl mx-auto p-4 ">
          <h6 className="text-xs font-semibold mb-2">
            Version: {updates.version}
          </h6>
          <h6 className="text-xs">
            Lastupdated: {updates.timestamp}
          </h6>
          <h6>
            Farrukh-Books © 2026 by Mian Farrukh Aleem
          </h6>

        </div>

      </main>


    </>
  );
};

export default MainPage;
