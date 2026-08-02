import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

import { QueryProvider } from "../providers/QueryProvider";
import { AuthProvider } from "../lib/auth/AuthContext";
import { ToastProvider } from "../components/common/Toast";

export const metadata: Metadata = {
  title: "WithUs",
  description: "WithUs Enterprise Vault",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <ToastProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
