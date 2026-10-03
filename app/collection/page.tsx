import type { Metadata } from "next";
import { CollectionView } from "@/components/shop/CollectionView";
import { loadCatalogue } from "@/lib/catalog";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "The collection",
  description: "Collection 001 — The Foundations. Modern European menswear for men and boys.",
};

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [{ products }, params] = await Promise.all([loadCatalogue(), searchParams]);
  return <CollectionView products={products} initialCategory={params.category} />;
}
