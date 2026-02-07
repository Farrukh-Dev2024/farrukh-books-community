'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from 'next-auth';
import { User,Company,Account,Product,Customer,Vendor,Journal,Image,CompanyInvite, ProductCategory,PayrollEmployee } from '@/types/prisma-types';
interface IAppData {
  user: User | null;
  session: Session | null;
  company: Company | null; // 
  accounts: Account[] | null; // accounts of the company
  productCategories: ProductCategory[] | null; // product categories
  products: Product[] | null;
  customers: Customer[] | null;
  vendors: Vendor[] | null;
  payrollemployees: PayrollEmployee[] | null;
  userUpdated: boolean; // user is updated in db flag to re-render components
  companyUpdated: boolean; // company is updated in db flag to re-render components

}

interface IAppContext {
  appData: IAppData;
  setAppData: React.Dispatch<React.SetStateAction<IAppData>>;
}

const AppContext = React.createContext<IAppContext | undefined>(undefined);

// Custom hook to use the AppContext
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

//following function will be used in layout
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [appData, setAppData] = React.useState<IAppData>({ user: null, session: null,company: null,productCategories: null, products: null,customers: null ,vendors: null, userUpdated: false, companyUpdated: false, accounts: null , payrollemployees: null});
  return (
    <AppContext.Provider value={{ appData, setAppData }}>
      {children}
    </AppContext.Provider>
  );
};
