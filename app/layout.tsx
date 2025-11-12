import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stylr AI - E-Commerce Product Page Analyzer",
  description: "Free SEO and optimization tool for e-commerce product pages. Get instant analysis and AI-powered content enhancements.",
  icons: {
    icon: '/stylr_black.svg',
    shortcut: '/stylr_black.svg',
    apple: '/stylr_black.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

