import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NotificationBar from "@/components/layout/NotificationBar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030306",
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
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen text-white relative" suppressHydrationWarning={true}>
        {/* Holographic matrix background grid */}
        <div className="cyber-grid fixed inset-0 pointer-events-none -z-50" aria-hidden="true" />
        {/* CRT scanlines overlay */}
        <div className="cyber-scanlines pointer-events-none fixed inset-0 z-[9999] mix-blend-multiply" aria-hidden="true" />
        <TooltipProvider>
          <NotificationBar />
          <Navbar />
          <main id="main-content" className="min-h-screen">{children}</main>
          <Footer />
        </TooltipProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
