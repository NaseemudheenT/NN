import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { BagProvider } from "@/components/shop/BagProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { Toaster } from "@/components/layout/Toaster";
import { BagMount } from "@/components/shop/BagMount";
import { env, shopifyReady } from "@/lib/env";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "Nero Noren — the art of dressing well",
    template: "%s — Nero Noren",
  },
  description:
    "European-inspired menswear, cut for Indian life. Eight considered pieces that work together, season after season. Walk the Nero Noren showroom in 3D.",
  applicationName: "Nero Noren",
  keywords: [
    "Nero Noren",
    "menswear",
    "Oxford shirt",
    "tailored trousers",
    "Indian menswear",
    "Collection 001",
  ],
  authors: [{ name: "Nero Noren Private Limited" }],
  openGraph: {
    type: "website",
    siteName: "Nero Noren",
    title: "Nero Noren — the art of dressing well",
    description:
      "European-inspired menswear, cut for Indian life. Walk the showroom in 3D, find your fit, and buy.",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#efe9dd",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Whether the shop is live is a server fact; the bag needs to know it to
  // decide between a Shopify cart and a device-only bag.
  const shopLive = shopifyReady();

  return (
    <html lang="en-IN" data-theme="light" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${hanken.variable} antialiased`}>
        <ThemeProvider>
          <BagProvider shopLive={shopLive}>
            <a className="nn-skip" href="#main">
              Skip to content
            </a>
            <Header />
            <main id="main">{children}</main>
            <Footer />
            <BagMount />
            <ConsentBanner />
            <Toaster />
          </BagProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
