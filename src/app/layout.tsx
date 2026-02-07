import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { AppProvider } from '@/context/AppContext';

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Farrukh Books",
  description:
    "Full-Stack double entry accounting system designed for everyone, small businesses, and accounting teams. Built with modern web technologies, it ensures accuracy, auditability, and scalability in managing financial records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={["light", "dark"]}
            storageKey="theme"
          >
            <AppProvider> 
              {children}
              {/* <SidebarProvider>
                <AppSidebar />
                <main className="w-full h-full flex flex-col">
                  <SidebarTrigger />
                  {children}
                </main>
              </SidebarProvider>               */}
            </AppProvider>  
            <Toaster expand={true} visibleToasts={9} duration={10000} />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
