import type { Metadata } from "next";
import { Space_Mono, Inter, Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

import { QueryProvider } from "../providers/QueryProvider";
import { AuthProvider } from "../lib/auth/AuthContext";
import { ToastProvider } from "../components/common/Toast";
import ComplianceGate from "../components/compliance/ComplianceGate";
import { LenisProvider } from "../providers/LenisProvider";

export const metadata: Metadata = {
  title: "WithUs",
  description: "WithUs Enterprise Vault",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} ${geistSans.variable} ${geistMono.variable} ${spaceMono.variable} ${inter.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <ToastProvider>
              <QueryProvider>
                <LenisProvider>
                  {children}
                  {/* ComplianceGate: blocks FREE orgs that haven't selected 2 platforms yet.
                      Renders as null for PRO/BUSINESS orgs and already-compliant FREE orgs. */}
                  <ComplianceGate />
                </LenisProvider>
              </QueryProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
