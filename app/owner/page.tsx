import type { Metadata } from "next";
import { currentOwner, ownerAuthReady } from "@/lib/owner";
import { getCatalog } from "@/lib/shopify";
import { integrations } from "@/lib/env";
import { OwnerGate } from "@/components/owner/OwnerGate";
import { Console } from "@/components/owner/Console";

export const metadata: Metadata = {
  title: "Operations",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const owner = await currentOwner();

  if (!owner) {
    return <OwnerGate configured={ownerAuthReady()} />;
  }

  const catalog = await getCatalog();

  const statuses = [
    {
      label: "Shopify",
      connected: integrations.shopify(),
      detail: "Pieces, prices, stock, photography and size charts.",
      vars: ["SHOPIFY_STORE_DOMAIN", "SHOPIFY_STOREFRONT_TOKEN"],
    },
    {
      label: "Razorpay",
      connected: integrations.razorpay(),
      detail: "Takes payment and verifies every signature on the server.",
      vars: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
    },
    {
      label: "Stylist",
      connected: integrations.anthropic(),
      detail: "Answers only from the live catalogue, rate-limited per visitor.",
      vars: ["ANTHROPIC_API_KEY"],
    },
    {
      label: "Supabase",
      connected: integrations.supabase(),
      detail: "Sends the one-time link that opens this console.",
      vars: ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
    },
  ];

  return <Console email={owner} catalog={catalog} statuses={statuses} />;
}
