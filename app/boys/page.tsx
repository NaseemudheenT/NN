import type { Metadata } from "next";
import { CollectionView } from "@/components/shop/CollectionView";
import { loadCatalogue } from "@/lib/catalog";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Boys",
  description: "The same cloth and the same cut, scaled. Nero Noren for boys.",
};

export default async function BoysPage() {
  const { products } = await loadCatalogue();
  return (
    <CollectionView
      products={products}
      title="Boys"
      blurb="The same cloth and the same cut, scaled."
    />
  );
}
