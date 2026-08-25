import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Plus_Jakarta_Sans({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Workers Conference | Registration & Verification",
  description: "Enterprise Authentication & Conference Management System",
  icons: { icon: "/dclmlogo.JPG" },
};

import { QueryProvider } from "@/lib/query-provider";
import { ToastProvider } from "@/components/ui/toast";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()` }} />
      </head>
      <body className="min-h-full flex flex-col bg-[#f8f9ff] dark:bg-[#020617] text-slate-900 dark:text-slate-100">
        <QueryProvider><ToastProvider>{children}</ToastProvider></QueryProvider>
      </body>
    </html>
  );
}
