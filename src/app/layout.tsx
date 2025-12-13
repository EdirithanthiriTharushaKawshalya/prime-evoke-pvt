// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AOSInitializer } from "@/components/ui/AOSInitializer";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/seo/JsonLd";

const inter = Inter({ subsets: ["latin"] });

// --- SEO CONFIGURATION ---
export const metadata: Metadata = {
  metadataBase: new URL('https://primeevokeofficial.com'),
  title: {
    default: "Prime Evoke | Creative Production House",
    template: "%s | Prime Evoke"
  },
  description: "Professional photography, videography, and audio production services. Home to Evoke Gallery, Studio Zine, and Evoke Waves.",
  keywords: ["Photography", "Wedding Photography", "Studio Zine", "Evoke Gallery", "Music Production", "Sri Lanka"],
  authors: [{ name: "Prime Evoke Private Limited" }],
  creator: "Prime Evoke",
  // --- ADDED ICONS SECTION ---
  icons: {
    icon: '/icon.png', // The file in your public folder (192x192 recommended)
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png', // Optional: for iPhones (180x180)
  },
  // ---------------------------
  // --- UPDATED VERIFICATION ---
  verification: {
    // Paste ONLY the code inside the content="" quotes
    google: 'IB8ZGnFFxTrof-mNspRRClDTxoZGmiazDHgWFLJdO1I', 
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://primeevokeofficial.com",
    siteName: "Prime Evoke",
    title: "Prime Evoke - Capturing Moments, Crafting Sound",
    description: "The professional hub for Prime Evoke's creative ventures in photography, visual storytelling, and music production.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Prime Evoke Preview",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <JsonLd />
        <div className="relative flex min-h-screen flex-col">
          <AOSInitializer />
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}