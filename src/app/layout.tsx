import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const title = "Shopper Match.AI | Turn Every Mystery Shop Into a Scheduled Shop.";
const description = "Stop Chasing Shoppers. Start Scheduling Automatically.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3110"),
  title,
  description,
  applicationName: "Shopper Match.AI",
  authors: [{ name: "iSN" }],
  openGraph: {
    type: "website",
    siteName: "Shopper Match.AI",
    title: "Turn Every Mystery Shop Into a Scheduled Shop.",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Turn Every Mystery Shop Into a Scheduled Shop.",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#20130b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${space.variable} ${inter.variable}`}>
      <body>
        {children}
        {/* Shopper Match chatbot widget */}
        <Script
          src="https://chat.isngs.com/widget.js"
          data-client-key="pk_LkLE4bq4DQ5soDaJaAaX7DM8N_mVUqcQ"
          data-api-base="https://159-89-230-107.nip.io"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
