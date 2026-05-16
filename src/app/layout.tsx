import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClariFi - Premium Stock Portfolio Tracker for Indian Investors",
  description: "Track your stock portfolio, mutual funds, dividends, and capital gains with AI-powered insights. Built for Indian retail investors.",
  keywords: "stock portfolio tracker, Indian stocks, NSE, BSE, mutual funds, tax calculator, capital gains, XIRR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
