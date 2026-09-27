import type { Metadata } from "next";
import { loadCatalogue } from "@/lib/catalog";
import { BagPage as BagPageView } from "@/components/shop/BagPage";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Your bag",
  description: "The pieces you have chosen from Collection 001.",
  robots: { index: false, follow: true },
};

export default async function BagPage() {
  const { products } = await loadCatalogue();
  return (
    <>
      <PageHeader eyebrow="Your bag" title="What you have chosen" />
      <BagPageView products={products} />
    </>
  );
}
