import type { Metadata, Viewport } from "next";
import { Space_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

import { QueryProvider } from "../providers/QueryProvider";
import { AuthProvider } from "../lib/auth/AuthContext";
import { ToastProvider } from "../components/common/Toast";
import ComplianceGate from "../components/compliance/ComplianceGate";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

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
      <body className={`${spaceMono.variable} ${inter.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <ToastProvider>
              <QueryProvider>
                {children}
                {/* ComplianceGate: blocks FREE orgs that haven't selected 2 platforms yet.
                    Renders as null for PRO/BUSINESS orgs and already-compliant FREE orgs. */}
                <ComplianceGate />
              </QueryProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
