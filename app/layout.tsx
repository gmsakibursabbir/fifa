import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NotificationBar from "@/components/layout/NotificationBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "FIFA Live Hub — Live Scores & IPTV Streaming",
  description:
    "Watch live football scores, match stats, lineups and stream live TV channels. Premier League, Champions League, La Liga and more — all free.",
  keywords: "football live scores, IPTV streaming, Premier League, Champions League, live match, football stats",
  authors: [{ name: "FIFA Live Hub" }],
  openGraph: {
    title: "FIFA Live Hub — Live Scores & IPTV Streaming",
    description: "The ultimate football live score and IPTV streaming platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased bg-[#000000] min-h-screen`} suppressHydrationWarning={true}>
        <TooltipProvider>
          <NotificationBar />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </TooltipProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
