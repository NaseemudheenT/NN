import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { BagProvider } from "@/components/shop/BagProvider";
import { LiveAtmosphere } from "@/components/atmosphere/LiveAtmosphere";
import { ShowroomBackdrop } from "@/components/atmosphere/ShowroomBackdrop";
import { ShowroomEntry } from "@/components/atmosphere/ShowroomEntry";
import { PointerLight } from "@/components/motion/PointerLight";
import { LiquidFilter } from "@/components/ui/glass/LiquidFilter";
import { GlassNav } from "@/components/ui/navigation/GlassNav";
import { GlassDock } from "@/components/ui/navigation/GlassDock";
import { Footer } from "@/components/layout/Footer";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { Toaster } from "@/components/layout/Toaster";
import { BagMount } from "@/components/shop/BagMount";
import { StylistMount } from "@/components/stylist/StylistMount";
import { env, shopifyReady } from "@/lib/env";
import { readShowroomSettings } from "@/lib/supabase";

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
    "European-inspired menswear for men and boys, cut for Indian life. Walk the Nero Noren showroom, find your fit, and buy.",
  applicationName: "Nero Noren",
  keywords: ["Nero Noren", "menswear", "men and boys", "Oxford shirt", "tailored trousers", "Collection 001"],
  authors: [{ name: "Nero Noren Private Limited" }],
  openGraph: {
    type: "website",
    siteName: "Nero Noren",
    title: "Nero Noren — timeless style builds character",
    description:
      "European-inspired menswear for men and boys. Walk the showroom, find your fit, and buy.",
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
  colorScheme: "dark light",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const shopLive = shopifyReady();
  // The owner can pin a time of day for everyone from the console.
  const { settings } = await readShowroomSettings();

  return (
    <html lang="en-IN" data-theme="night" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${hanken.variable} antialiased`}>
        <ThemeProvider housePhase={settings.forcedPhase}>
          <BagProvider shopLive={shopLive}>
            {/* ── the app shell ──────────────────────────────────────
                The atmosphere sits behind everything and outside the
                page, so it survives navigation: moving between routes
                should feel like walking between areas of one building,
                and that is only true if the light does not restart at
                every door.                                         */}
            {/* The CSS room, which is always there and is complete on its
                own, and the real one behind it where the device can carry
                it — see components/atmosphere/ShowroomBackdrop. */}
            <LiveAtmosphere />
            <ShowroomBackdrop />

            {/* one pointer listener, feeding every glass surface */}
            <PointerLight />

            {/* the refraction the glass bends its backdrop through */}
            <LiquidFilter />

            <a className="nn-skip" href="#main">
              Skip to content
            </a>

            <GlassNav />

            <main id="main">{children}</main>

            <Footer />

            <GlassDock />
            <BagMount />
            <StylistMount />
            <ConsentBanner />
            <Toaster />

            {/* last in the tree, first on the screen */}
            <ShowroomEntry />
          </BagProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
