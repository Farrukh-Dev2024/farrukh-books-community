import React from "react";
import Image from "next/image";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Users, FileText, ShieldCheck, Box, Cpu } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import logo from "@/assets/logo.png";
import a1stPageGif from "@/assets/a1stPageGif.gif";
import styles from './LandingPage.module.css';
import { ThemeToggler } from "@/features/navbar/ThemeToggler";

export const metadata: Metadata = {
  title: "FarrukhBooks — Modern Double-Entry Accounting for Small Businesses",
  description: "FarrukhBooks is a modern double-entry accounting system for small businesses...",
};

const FeatureCard: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = async ({ title, children, icon }) => {
  return (
    <Card className={`${styles.featureCard} p-6 shadow-lg border border-gray-100 dark:border-gray-800 rounded-2xl`}>
      <div className="flex items-start gap-4">
        <div className={styles.iconContainer}>{icon}</div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{children}</p>
        </div>
      </div>
    </Card>
  );
};

export default async function LandingPage() {
  'use server';
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FarrukhBooks",
    url: process.env.NEXTAUTH_URL,
    description: "FarrukhBooks is a modern double-entry accounting system...",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    author: { "@type": "Person", name: "Farrukh" },
  };

    const session = await auth();
  if (session?.user) redirect("/main");

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <header className="max-w-6xl mx-auto p-6 flex items-center justify-between relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image src={logo} alt="Company Logo" width={64} height={64} className="object-contain" />
          <div>
            <h1 className="text-lg font-semibold">FarrukhBooks</h1>
            <p className="text-xs text-muted-foreground">Modern double-entry accounting for teams</p>
          </div>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-3 ml-auto">
          <ThemeToggler />
          <a href="#features" className="text-sm hover:underline">Features</a>
          <a href="#pricing" className="text-sm hover:underline">Pricing</a>
          <a href="/contact" className="text-sm hover:underline">Contact</a>

          <a className={styles.srbutton } href="/main"><span className="text-black dark:text-white">Get Started</span></a>
          {/* <Button asChild><a className="srbutton" >Get Started</a></Button> */}
        </nav>

        {/* Mobile Hamburger (CSS Only) */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <ThemeToggler />
          </div>

          <input id="menu-toggle" type="checkbox" className="peer hidden" />
          <label htmlFor="menu-toggle" className="md:hidden cursor-pointer flex flex-col gap-1">
            <span className="block w-6 h-0.5 bg-foreground"></span>
            <span className="block w-6 h-0.5 bg-foreground"></span>
            <span className="block w-6 h-0.5 bg-foreground"></span>
          </label>

          {/* Mobile Dropdown */}
          <nav
            className="
    absolute right-6 top-20 w-48 rounded-xl border border-gray-100 dark:border-gray-800
    bg-background shadow-lg p-4 space-y-3
    hidden peer-checked:flex flex-col md:hidden
    z-50
             "
          >
            <a href="#features" className="text-sm hover:underline">Features</a>
            <a href="#pricing" className="text-sm hover:underline">Pricing</a>
            <a href="/contact" className="text-sm hover:underline">Contact</a>
            <Button asChild className="w-full"><a href="/main">Get Started</a></Button>
          </nav>
        </div>

      </header>


      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-sm uppercase text-green-400 font-medium">Accounting · Secure · Scalable</p>
          <h2 className={`mt-4 text-4xl font-extrabold leading-tight ${styles.fadeIn}`}>
            Double-entry accounting made simple for growing teams
          </h2>
          <p className={`mt-4 text-lg text-muted-foreground ${styles.fadeIn} ${styles.fadeInDelay}`}>
            FarrukhBooks provides reliable financial controls, clean reporting, and a UX designed for accountants and founders.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {/* <Button asChild><a href="/main">View Demo</a></Button> */}
            <a className={styles.srbutton} href="/main"><span className="text-black dark:text-white">Get Started</span></a>
            <Button variant="outline" asChild><a href="/docs">Documentation</a></Button>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Journals & Auto-balancing</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Trial Balance & Reports</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Multi-tenant & RBAC</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4" /> Payroll & Invoicing</li>
          </ul>
        </div>

        
        <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-md bg-white dark:bg-black">
          <div className="w-full h-80 relative bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black flex items-center justify-center">
            <div className="text-center">
              {/* <div className="mb-4 text-sm text-muted-foreground">Live demo preview</div>
              <div className="w-80 h-44 rounded-lg bg-white/60 dark:bg-white/5 border border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Dashboard screenshot placeholder</span>
              </div> */}
              <Image src={a1stPageGif} alt="Demo Preview" className="rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm" unoptimized />  
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-12">
        <h3 className="text-2xl font-semibold">Core capabilities</h3>
        <p className="mt-2 text-muted-foreground">Everything you need to keep accurate books and scale accounting operations.</p>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          <FeatureCard title="Multi-tenant Companies" icon={<Users className="w-5 h-5" />}>
            Create and manage multiple companies with isolated data, company-specific settings, and granular access control.
          </FeatureCard>
          <FeatureCard title="Role-Based Permissions" icon={<ShieldCheck className="w-5 h-5" />}>
            Flexible global and company-level roles so accountants, finance managers, and read-only users get the right access every time.
          </FeatureCard>
          <FeatureCard title="Journals & Audit Trail" icon={<FileText className="w-5 h-5" />}>
            Multi-line journal entries, attachments, audit logs, and locked accounting periods — built for compliance and audit readiness.
          </FeatureCard>
          <FeatureCard title="Financial Reports" icon={<Box className="w-5 h-5" />}>
            Trial Balance, Balance Sheet, Income Statement, Cash Flow — exportable to PDF and Excel.
          </FeatureCard>
          <FeatureCard title="Payroll & Payslips" icon={<Users className="w-5 h-5" />}>
            Employee payslips, pay runs, and automatic posting of payroll journal entries.
          </FeatureCard>
          <FeatureCard title="Integrations & Security" icon={<Cpu className="w-5 h-5" />}>
            NextAuth, OAuth providers, secure server actions and role-aware APIs. Built with Prisma and Postgres.
          </FeatureCard>
        </div>
      </section>

      {/* Business Modules / Sales, Purchases & Payroll */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h3 className="text-2xl font-semibold mb-4">Business Modules</h3>
        <p className="text-muted-foreground mb-6">
          Sales, purchases, payroll and more — with automatic posting to the accounting engine.
        </p>

        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 shadow-lg border border-gray-100 dark:border-gray-800 rounded-2xl hover:shadow-xl transform transition hover:-translate-y-1">
            <h5 className="font-semibold text-lg">Sales & Invoicing</h5>
            <p className="text-sm text-muted-foreground mt-2">
              Create invoices, record receipts, and post payments to the general ledger automatically.
            </p>
          </Card>

          <Card className="p-6 shadow-lg border border-gray-100 dark:border-gray-800 rounded-2xl hover:shadow-xl transform transition hover:-translate-y-1">
            <h5 className="font-semibold text-lg">Purchases & Bills</h5>
            <p className="text-sm text-muted-foreground mt-2">
              Manage vendors, track bills, and handle payments with full auditability.
            </p>
          </Card>

          <Card className="p-6 shadow-lg border border-gray-100 dark:border-gray-800 rounded-2xl hover:shadow-xl transform transition hover:-translate-y-1">
            <h5 className="font-semibold text-lg">Payroll</h5>
            <p className="text-sm text-muted-foreground mt-2">
              Earnings, deductions, payruns and payslips with journal automation for payroll expenses and liabilities.
            </p>
          </Card>
        </div>
      </section>
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-12">
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-8 text-center shadow-lg">
          <h3 className="text-2xl font-semibold">Simple pricing for growing teams</h3>
          <p className="mt-2 text-muted-foreground">
            Free trial, then pay-per-company. No hidden fees. Custom enterprise plans available.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {/* <Button asChild>
              <a href="/main">Start Free Trial</a>
            </Button> */}
            <a className={styles.srbutton} href="/main"><span className="text-black dark:text-white">Start Free Trial</span></a>
            <Button variant="outline" asChild>
              <a href="/contact">Contact Sales</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer & JSON-LD */}
      <footer className="mt-12 border-t border-gray-100 dark:border-gray-800 bg-background-alt">
        <div className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold">FarrukhBooks</h4>
            <p className="text-sm text-muted-foreground mt-2">© {new Date().getFullYear()} FarrukhBooks</p>
          </div>
          <div>
            <h5 className="font-semibold">Product</h5>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1">
              <li><a href="/docs">Docs</a></li>
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold">Contact</h5>
            <p className="text-sm text-muted-foreground mt-2">farrukhaleem.dev2024@gmail.com</p>
          </div>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        key="ld-json"
      />
    </main>
  );
}
