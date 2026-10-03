import type { Metadata } from "next";
import { loadCatalogue } from "@/lib/catalog";
import { summariseBusiness } from "@/lib/business";
import { readShowroomSettings } from "@/lib/supabase";
import { env, supabaseReady } from "@/lib/env";
import { OwnerConsole, type OwnerData } from "@/components/owner/OwnerConsole";

export const metadata: Metadata = {
  title: "Owner console",
  robots: { index: false, follow: false, nocache: true },
};

/** Never cached: these are live business figures. */
export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const { products, source } = await loadCatalogue();
  const business = await summariseBusiness(products);
  const { settings, note } = await readShowroomSettings();

  const data: OwnerData = {
    metrics: business.metrics,
    products: business.products.map((p) => ({
      handle: p.handle,
      title: p.title,
      /* null means "we do not know" — Shopify orders are not connected, or
         there are too few views for a rate to mean anything. The console
         prints an em dash for these rather than a zero, because a zero is a
         claim and a dash is not. */
      unitsSold: p.unitsSold,
      revenueMinor: p.revenueMinor,
      views: p.views,
      addsToBag: p.addsToBag,
      addRate: p.addRate,
    })),
    gaps: business.gaps,
    windowDays: business.windowDays,
    analyticsSource:
      business.analytics.source === "supabase" ? "stored in Supabase" : "held in server memory",
    catalogueSource:
      source === "shopify" ? "live Shopify data" : "the Collection 001 reference seed",
    currency: products[0]?.currency ?? "INR",
  };

  return (
    <OwnerConsole
      data={data}
      products={products}
      supabaseConfigured={supabaseReady()}
      /* The anon key is publishable by design — it is what the browser needs to
         start a magic-link sign-in. The service role key never leaves the server. */
      supabaseUrl={env.supabaseUrl}
      supabaseAnonKey={env.supabaseAnonKey}
      ownerListConfigured={env.ownerEmails.length > 0}
      settings={settings}
      settingsNote={note}
    />
  );
}
