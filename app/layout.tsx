import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

import { Shell } from "@/components/shell/Shell";
import { Footer } from "@/components/shell/Footer";
import { BagProvider } from "@/lib/bag/BagProvider";
import { loadCatalogue } from "@/lib/catalog";
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
    default: "Nero Noren — timeless style builds character",
    template: "%s — Nero Noren",
  },
  description:
    "Modern European menswear for men and boys. Walk the Nero Noren showroom, find your fit, and buy.",
  applicationName: "Nero Noren",
  keywords: ["Nero Noren", "menswear", "men and boys", "European tailoring", "Collection 001"],
  authors: [{ name: "Nero Noren Private Limited" }],
  openGraph: {
    type: "website",
    siteName: "Nero Noren",
    title: "Nero Noren — timeless style builds character",
    description: "Modern European menswear for men and boys. Walk the showroom, find your fit, and buy.",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
  colorScheme: "light",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  /* The catalogue is loaded once, here, and handed to the shell. The search
     palette, the stylist's product cards and the bag all read the same eight
     pieces — one fetch for the whole session rather than one per overlay. */
  const { products } = await loadCatalogue();

  /* The font variables go on <html>, not <body>.
     tokens.css declares `--serif: var(--font-cormorant), ...` on :root,
     which IS <html>. With the variables one node below, --font-cormorant
     did not exist where --serif was computed, so --serif resolved to the
     guaranteed-invalid value — and an invalid custom property inherits as
     invalid rather than being re-substituted further down the tree. The
     effect was that `font-family: var(--serif)` failed on every element on
     the site, and Cormorant Garamond — the brand's display face — never
     rendered once. Moving them up one node fixes the whole cascade. */
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${hanken.variable}`} suppressHydrationWarning>
      <body>
        <BagProvider shopLive={shopifyReady()}>
          <Shell catalogue={products} footer={<Footer />}>
            {children}
          </Shell>
        </BagProvider>
      </body>
    </html>
  );
}
