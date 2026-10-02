import type { Metadata } from "next";
import { loadCatalogue } from "@/lib/catalog";
import { BagPage as BagPageView } from "@/components/shop/BagPage";

export const metadata: Metadata = {
  title: "Your bag",
  description: "The pieces you have chosen.",
  robots: { index: false, follow: false },
};

export default async function BagRoute() {
  const { products } = await loadCatalogue();
  return <BagPageView catalogue={products} />;
}
