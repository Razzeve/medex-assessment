import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Navbar } from "@/components/layout/navbar";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "MedEx",
  description: "Senior Frontend Technical Assessment implementation for MedEx.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased font-sans`}>
        <QueryProvider>
          <div className="flex min-h-screen flex-col bg-slate-50">
            <Navbar />
            <main className="flex-1 bg-slate-50">{children}</main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
