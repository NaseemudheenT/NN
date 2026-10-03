import type { Metadata } from "next";
import { StylistHero } from "@/components/stylist/StylistHero";
import { loadCatalogue } from "@/lib/catalog";
import { anthropicReady } from "@/lib/env";

export const metadata: Metadata = {
  title: "AI stylist",
  description: "Styling from the real Nero Noren collection — every piece one you can actually buy.",
};

export default async function StylistRoute() {
  const { products } = await loadCatalogue();
  return <StylistHero live={anthropicReady()} count={products.length} />;
}
