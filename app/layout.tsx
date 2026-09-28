import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { getCatalog } from "@/lib/shopify";
import { env } from "@/lib/env";
import { TAGLINE } from "@/lib/tokens";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl()),
  title: {
    default: "Nero Noren — Men & Boys",
    template: "%s · Nero Noren",
  },
  description: `${TAGLINE}. The Nero Noren digital showroom: Collection 001, the trial room and the house stylist.`,
  openGraph: {
    type: "website",
    siteName: "Nero Noren",
    title: "Nero Noren — Men & Boys",
    description: `${TAGLINE}.`,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8e4da" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * The phase is written to <html> before paint so the first frame is already
 * the right hour of the showroom — no flash of the wrong light.
 */
const PHASE_BOOT = `(function(){try{var o=localStorage.getItem("nn.phase");var q=new URLSearchParams(location.search).get("phase");var p=q||o;if(!p){var h=new Date().getHours();p=h>=6&&h<12?"morning":h>=12&&h<17?"afternoon":h>=17&&h<20?"evening":"night";}document.documentElement.dataset.phase=p;}catch(e){document.documentElement.dataset.phase="night";}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const catalog = await getCatalog();

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${hanken.variable} h-full`}
      data-phase="night"
      // The boot script below sets the real phase before paint; the server
      // cannot know the visitor's clock, so this one attribute is expected
      // to differ until hydration.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PHASE_BOOT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="nn-label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-sm focus:bg-ink focus:px-4 focus:py-3 focus:text-bg"
        >
          Skip to content
        </a>
        <AppShell catalog={catalog}>{children}</AppShell>
      </body>
    </html>
  );
}
