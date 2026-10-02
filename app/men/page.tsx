import type { Metadata } from "next";
import { CollectionView } from "@/components/shop/CollectionView";
import { loadCatalogue } from "@/lib/catalog";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Men",
  description: "Modern European menswear, cut for Indian life. Collection 001 — The Foundations.",
};

export default async function MenPage() {
  const { products } = await loadCatalogue();
  return (
    <CollectionView
      products={products}
      title="Men"
      blurb="The Foundations — shirts and trousers cut to go with each other."
    />
  );
}
