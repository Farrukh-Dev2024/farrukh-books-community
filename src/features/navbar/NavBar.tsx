"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {LucideIcon, Search, User, Building } from "lucide-react"
import { Menu, X, ChevronDown,Moon } from "lucide-react"
import { NotebookText } from 'lucide-react';
import { TbReportAnalytics } from "react-icons/tb";
import { BASE_PATH,ADMIN_PATH, UserRoles } from "@/types/project-types"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import logo from "@/assets/logo.png"
import {ThemeToggler} from "@/features/navbar/ThemeToggler";
import { User as Userdb } from "@/types/prisma-types"

interface MenuType1Submenu {
    href: string;
    title: string;
    description: string;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>; 
}
interface MenuType1{
    href: string; 
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>; 
    trigger: string;
    title: string;
    description: string;
    submenus: MenuType1Submenu[];
    isMobile?: boolean; // Optional property to indicate if it's for mobile view

}


const userMenu: MenuType1 = 
  {trigger:"User", title:"User", href: "#", description:"User menu", icon: User, submenus: [
      {href:`${BASE_PATH}?page=userprofile`, title:"Profile", description:"User profile"},
      {href:`${BASE_PATH}?page=usersettings`, title:"Settings", description:"User settings"},
      {href:`${BASE_PATH}?page=logout`, title:"LogOut", description:"Log Out"},
  ]};

const companyMenu: MenuType1 = 
  {trigger:"Company", title:"Company", href: "#", description:"Company menu", icon: Building, submenus: [
      {href:`${BASE_PATH}?page=welcomepage`, title:"Company", description:"Welcome Page"},
      {href:`${BASE_PATH}?page=createcompany`, title:"Create Company", description:"Create a new company"},
      {href:`${BASE_PATH}?page=viewcompany`, title:"View Company", description:"View Company"},
      {href:`${BASE_PATH}?page=editcompany`, title:"Edit Company", description:"Edit Company"},
      {href:`${BASE_PATH}?page=invites`, title:"Invites", description:"View Invites"},
      {href:`${BASE_PATH}?page=backups`, title:"Backups", description:"Access Backups"},
  ]};

const accountMenu: MenuType1 = 
  {trigger:"Account", title:"Account", href: "#", description:"Account menu", icon: NotebookText, submenus: [
      {href:`${BASE_PATH}?page=accountlist`, title:"List Accounts", description:"List Accounts"},
      {href:`${BASE_PATH}?page=viewjournal`, title:"View Journal", description:"View Journal"},
      {href:`${BASE_PATH}?page=journalentryform`, title:"Journal New Entry", description:"Journal New Entry"},
      {href:`${BASE_PATH}?page=yearclosing`, title:"YearClosing Entry", description:"YearClosing Entry"},      
      {href:`${BASE_PATH}?page=generalledger`, title:"General Ledger", description:"General Ledger"},
  ]};

const reportsMenu: MenuType1 = 
  {trigger:"Reports", title:"Reports", href: "#", description:"Reports menu", icon: TbReportAnalytics, submenus: [
      {href:`${BASE_PATH}?page=trialbalance`, title:"Trial Balance", description:"Trial Balance"},
      {href:`${BASE_PATH}?page=incomestatement`, title:"Income Statement", description:"Income Statement"},
      {href:`${BASE_PATH}?page=balancesheet`, title:"Balance Sheet", description:"Balance Sheet"},
      {href:`${BASE_PATH}?page=cashflow`, title:"CashFlow Statement", description:"CashFlow Statement"},
  ]};

const productsMenu: MenuType1 = 
  {trigger:"Products", title:"Products", href: "#", description:"Products menu", icon: TbReportAnalytics, submenus: [
      {href:`${BASE_PATH}?page=categorylist`, title:"Category List", description:"Category List"},
      // {href:`${BASE_PATH}?page=categoryform`, title:"Category Form", description:"Category Form"},
      {href:`${BASE_PATH}?page=productslist`, title:"Products List", description:"Products List"},
      // {href:`${BASE_PATH}?page=productsform`, title:"Products Form", description:"Products Form"},
      // {href:`${BASE_PATH}?page=stockmovements`, title:"Stock Movements", description:"Stock Movements"},
      // {href:`${BASE_PATH}?page=stockmovementtable`, title:"Stock MovementsTable", description:"Stock MovementsTable"},
  ]};

const salesMenu: MenuType1 = 
  {trigger:"Sales", title:"Sales", href: "#", description:"Sales menu", icon: TbReportAnalytics, submenus: [
      // {href:`${BASE_PATH}?page=customerform`, title:"Customer Form", description:"Customer Form"},
      {href:`${BASE_PATH}?page=customerslist`, title:"Customers List", description:"Customers List"},
      // {href:`${BASE_PATH}?page=customercard`, title:"Customer Card", description:"Customer Card"},
      // {href:`${BASE_PATH}?page=quotepage`, title:"Quote Page", description:"Quote Page"},
      // {href:`${BASE_PATH}?page=quotelist`, title:"Quote List", description:"Quote List"},
      // {href:`${BASE_PATH}?page=quoteform`, title:"Quote Form", description:"Quote Form"},
      // {href:`${BASE_PATH}?page=quotecard`, title:"Quote Card", description:"Quote Card"},
      {href:`${BASE_PATH}?page=salesorderpage`, title:"SalesOrder Page", description:"SalesOrder Page"},
      // {href:`${BASE_PATH}?page=salesorderform`, title:"SalesOrder Form", description:"SalesOrder Form"},
      // {href:`${BASE_PATH}?page=salesinvoicepage`, title:"SalesInvoice Page", description:"SalesInvoice Page"},
      // {href:`${BASE_PATH}?page=salesinvoiceform`, title:"SalesInvoice Form", description:"SalesInvoice Form"},      
  ]};    

const purchasesMenu: MenuType1 = 
  {trigger:"Purchases", title:"Purchases", href: "#", description:"Purchases menu", icon: TbReportAnalytics, submenus: [
      {href:`${BASE_PATH}?page=vendorslist`, title:"Vendors List", description:"Vendors List"},
      // {href:`${BASE_PATH}?page=vendorform`, title:"Vendor Form", description:"Vendor Form"},
      // {href:`${BASE_PATH}?page=vendorcard`, title:"Vendor Card", description:"Vendor Card"},
      {href:`${BASE_PATH}?page=purchaseorderslist`, title:"Purchase Orders", description:"Purchase Orders List"},
      // {href:`${BASE_PATH}?page=purchaseorderform`, title:"Purchase OrderForm", description:"Purchase OrderForm"},
      // {href:`${BASE_PATH}?page=purchaseordercard`, title:"Purchase OrderCard", description:"Purchase OrderCard"},
  ]};

const payrollMenu: MenuType1 = 
  {trigger:"PayRoll", title:"PayRoll", href: "#", description:"PayRoll menu", icon: TbReportAnalytics, submenus: [
      // {href:`${BASE_PATH}?page=createemployee`, title:"Create Employee", description:"Create Employee"},
      // {href:`${BASE_PATH}?page=editemployee`, title:"Edit Employee", description:"Edit Employee"},
      // {href:`${BASE_PATH}?page=employeeform`, title:"Employee Form", description:"Employee Form"},
      {href:`${BASE_PATH}?page=employeelist`, title:"Employee List", description:"Employee List"},
      {href:`${BASE_PATH}?page=payitemslist`, title:"PayItems List", description:"PayItems List"},
      {href:`${BASE_PATH}?page=employeepayitemslist`, title:"EmployeePay Assignment", description:"EmployeePay Assignment"},
      {href:`${BASE_PATH}?page=employeeattendance`, title:"Employee Attendance", description:"Employee Attendance"},

      // {href:`${BASE_PATH}?page=generatedraftbutton`, title:"GenerateDraftButton", description:"GenerateDraftButton"},
      // {href:`${BASE_PATH}?page=payrunform`, title:"PayRunForm", description:"PayRunForm"},
      {href:`${BASE_PATH}?page=payrunpage`, title:"PayRunPage", description:"PayRunPage"},
      // {href:`${BASE_PATH}?page=paysliplist`, title:"PaySlipsList", description:"PaySlipsList"},

  ]};
const adminMenu: MenuType1 = 
  {trigger:"Admin", title:"Admin", href: "#", description:"Admin menu", icon: TbReportAnalytics, submenus: [
      {href:`${ADMIN_PATH}`, title:"Admin Dashboard", description:"Admin Dashboard"},
  ]};

interface INavBarProps {
  //email: string,
  user: Userdb | null;
};

export default function NavBar(props: INavBarProps) {

  let isAdmin = false;
  if (props.user?.userRole !== undefined && props.user?.userRole !== null) {
    isAdmin = props.user?.userRole === UserRoles.Admin || props.user?.userRole === UserRoles.SuperAdmin;   
  }
  
  return (
    // <div className="w-full min-w-md bg-white dark:bg-black shadow-md">
    <div className="w-full bg-white dark:bg-black shadow-md dark:shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
      <div className="container mx-auto flex flex-wrap items-center justify-center-safe px-4 py-4 gap-4">
        <CreateLogo companyName="FarrukhBooks" />

        <div className="flex items-center gap-4">
          
          {/* <Moon className="hidden md:flex" /> */}
          {/* Navigation Menu */}
          <div className="justify-center hidden md:flex z-50">
            <NavigationMenu viewport={false} >
              <NavigationMenuList className="flex flex-wrap">
                <div className="hidden md:flex md:flex-wrap"><ThemeToggler /></div>
                <CreateMenuType1 {...userMenu} isMobile={false} />
                <CreateMenuType1 {...companyMenu} isMobile={false} />
                <CreateMenuType1 {...accountMenu} isMobile={false} />
                <CreateMenuType1 {...reportsMenu} isMobile={false} />
                <CreateMenuType1 {...productsMenu} isMobile={false} />
                <CreateMenuType1 {...salesMenu} isMobile={false} />
                <CreateMenuType1 {...purchasesMenu} isMobile={false} />
                <CreateMenuType1 {...payrollMenu} isMobile={false} />
                {isAdmin && <CreateMenuType1 {...adminMenu} isMobile={false} />}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          {/* <CreateSeachBar/> */}
        </div>
        


        {/* Mobile Menu - Sheet with Dropdown */}
        <div className="flex items-center md:hidden">
          {/* <Moon className="flex md:hidden" /> */}
          <div className="flex md:hidden"><ThemeToggler /></div>
          
          {/* Mobile Navigation Toggle */}
          <Sheet>
            <SheetTrigger className="md:hidden ">
              <Menu className="ml-5 w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] min-w-[260px]">
              {/* add a scroll bar here  */}
              <div className="overflow-y-auto mt-2"> 
                <SheetHeader>
                  <SheetTitle></SheetTitle>
                  {/* optional: <SheetDescription>Navigation menu</SheetDescription> */}
                </SheetHeader>
                {/* <CreateSeachBar isMobile={true}/> */}
                <nav className="flex flex-col gap-4 mt-6 ml-5">
                  <CreateMenuType1 {...userMenu} isMobile={true} />
                  <CreateMenuType1 {...companyMenu} isMobile={true} />
                  <CreateMenuType1 {...accountMenu} isMobile={true} />
                  <CreateMenuType1 {...reportsMenu} isMobile={true} />
                  <CreateMenuType1 {...productsMenu} isMobile={true} />
                  <CreateMenuType1 {...salesMenu} isMobile={true} />
                  <CreateMenuType1 {...purchasesMenu} isMobile={true} />
                  <CreateMenuType1 {...payrollMenu} isMobile={true} />
                  {isAdmin && <CreateMenuType1 {...adminMenu} isMobile={true} />}
                </nav>

              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </div>
  )
}
function CreateLogo(props: {companyName: string}) {
  return (
    <>
      {/* Logo Section */}
      <Link href="/" className="flex items-center gap-2">
        <Image src={logo} alt="Company Logo" width={64} height={64} className="object-contain" />
        <span className="ml-3 mr-3 text-xl font-semibold text-black dark:text-white">
          {props.companyName}
        </span>
      </Link>      
    </>
  );

}
function CreateSeachBar(props :{isMobile?: boolean}) {
  /**
   * This function will create a search bar with a button.
   * It can be used in both mobile and desktop views.
   */
  if (props.isMobile) {
    return (
      <>
        {/* Search Bar */}
        <div className="relative max-w-[250px] mr-3 ml-3">
          <Input
            type="text"
            placeholder="Search..."
            className="h-10 w-full bg-gray-100 dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-10"
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />          
        </div>      
      </>
    );
  }  
  return(
    <>
      {/* Search Bar */}
      <div className="relative max-w-sm hidden md:flex items-center z-1">
        <Input
          type="text"
          placeholder="Search..."
          className="h-10 w-full bg-gray-100 dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-10"
        />
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
      </div>
    </>
  );
}

function CreateMenuType1(MenuType1: MenuType1) {
  /*
    Function draws a menu with left side spanning vertically and right side with 3 stacked items.
    The left side contains a link with a title and description, while the right side contains multiple links with titles and descriptions.
  */
  if (MenuType1.isMobile==true && (MenuType1.submenus.length === 0 || MenuType1.submenus === undefined || MenuType1.submenus === null) ) {
    return(
      <>
        <Link href={MenuType1.title} className="text-lg">{MenuType1.trigger}</Link>
      </>
    );
  }
  if (MenuType1.isMobile==true && MenuType1.submenus.length > 0) {
    return(
      <>
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between text-lg w-full">
            {MenuType1.trigger}
            <ChevronDown className="h-4 w-4 mr-5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="ml-4 mt-2 flex flex-col gap-1">
             {(MenuType1.submenus || []).map((submenu) => {
                return (
                  <Link key={submenu.title} href={submenu.href} className="text-sm">
                    {submenu.title}
                  </Link>
              );
             })}
          </CollapsibleContent>
        </Collapsible>      
      </>
    );
  }
  if (MenuType1.isMobile==true ) { 
    return(
      <>
        <h1>escaped here</h1>
      </>
    );
  }  
  return (
    <>
      <NavigationMenuItem >
          <NavigationMenuTrigger>{MenuType1.trigger}</NavigationMenuTrigger>
          <NavigationMenuContent className="z-50 left-0 translate-x-0left-1/2 -translate-x-1/2">
            <ul className="flex gap-2 md:w-[400px]">
              {/* Left (spanning vertically) */}
              <li className="flex-[0.75]">
                <NavigationMenuLink asChild>
                  <div className="relative w-32 h-32 bg-muted rounded-md overflow-hidden">
                    {/* User Icon */}
                    {MenuType1.icon && (
                      <MenuType1.icon className="!w-full !h-full text-muted-foreground " />
                    )}
                    
                    {/* Overlay shown only on hover */}
                    <div className="absolute bottom-0 w-full bg-muted/80 text-center px-2 py-1 opacity-0 hover:opacity-100 transition-opacity duration-1000">
                      <div className="text-lg font-medium">{MenuType1.title}</div>
                      <p className="text-muted-foreground text-sm leading-tight">
                        {MenuType1.description}
                      </p>
                    </div>
                  </div>
                  {/* <a
                    className="flex h-28 w-full flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none select-none focus:shadow-md"
                    href="/"
                  > */}
                  {/* </a> */}
                </NavigationMenuLink>
              </li>

              {/* Right (3 stacked items) */}
              <div className="flex flex-col gap-2 flex-1">
                {MenuType1.submenus.map((submenu) => (
                    <li key={submenu.title} >
                      <NavigationMenuLink asChild>
                        <Link href={submenu.href}>
                          <div className="text-sm leading-none font-medium">{submenu.title}</div>
                          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                            {submenu.description}
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li> 
                ))}
              </div>
            </ul>
          </NavigationMenuContent>            
      </NavigationMenuItem>    
    </>
  );
}
//function CreateMenuType1(props: {isMobile?: boolean,MenuType1: MenuType1}) {
function CreateMenuType2(props: {MenuType1Submenu: MenuType1Submenu[],trigger: string}) {
  /*
  
  */
  const {MenuType1Submenu,trigger} = props;
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{props.trigger}</NavigationMenuTrigger>
      <NavigationMenuContent className="z-50">
      <ul className="flex flex-wrap w-[400px] gap-2">
        {MenuType1Submenu.map((component) => (
          <li key={component.title} className="w-[180px]">
            <NavigationMenuLink asChild>
              <Link href={component.href}>
                <div className="text-sm leading-none font-medium">{component.title}</div>
                <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                  {component.description}
                </p>
              </Link>
            </NavigationMenuLink>
          </li>            
        ))}
      </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

function CreateMenuLink(props:{href :string, title: string}) {
  /**
   * This function will create a simple menu link with a title and href.
   */
  const {href,title}=props;
  return (
    <NavigationMenuItem>
      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
        <Link href={href}>{title}</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>

  );
}

function CreateMenuType3(props: MenuType1) {
  /**
   * This function will create a simple menu with trigger title and content.
  */
  return (
    <>
      <NavigationMenuItem>
          <NavigationMenuTrigger>{props.trigger}</NavigationMenuTrigger>
          <NavigationMenuContent className="z-50">
            <ul className="flex gap-2 w-[300px]">
              <div className="flex flex-col gap-2 flex-1">
                {props.submenus.map((submenu) => (
                    <li key={submenu.title} >
                      <NavigationMenuLink asChild>
                        <Link href={submenu.href}>
                          <div className="text-sm leading-none font-medium">{submenu.title}</div>
                          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                            {submenu.description}
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li> 
                ))}
              </div>
            </ul>
          </NavigationMenuContent>            
      </NavigationMenuItem>    
    </>
  );
}

function CreateMenuType4(props: MenuType1) {
  /**
   *  This function will create a simple menu with a trigger and content.
   *  simple list menu
   */
  return (
    <>
      <NavigationMenuItem>
        <NavigationMenuTrigger>{props.trigger}</NavigationMenuTrigger>
        <NavigationMenuContent className="z-50">
          <ul className="flex flex-col w-[300px] gap-2 p-2">
            {props.submenus.map((item) => (
              <li key={item.title}>
                <NavigationMenuLink asChild>
                  <Link href={item.href}>
                    <div className="text-sm leading-none font-medium">{item.title}</div>
                    {/* <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                      {item.description}
                    </p> */}
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}        
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </>
  );
}

function CreateMenuType5(props: MenuType1) {
  /**
   *  This function will create a simple menu with a trigger and ICON and content.
   *  simple list menu
   */
  return (
    <>
      <NavigationMenuItem>
        <NavigationMenuTrigger>{props.trigger}</NavigationMenuTrigger>
        <NavigationMenuContent className="z-50">
          <ul className="flex flex-col w-[200px] gap-2 p-2">
            <li>
              {props.submenus.map((item) => (
                <NavigationMenuLink asChild key={item.title}>
                  <Link href={item.href} className="flex flex-row items-center gap-2">
                    {item.icon && <item.icon className="w-4 h-4" />}
                    <span>{item.title}</span>
                  </Link>
                </NavigationMenuLink>
              ))}
            </li>  
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>

    </>
  );
}