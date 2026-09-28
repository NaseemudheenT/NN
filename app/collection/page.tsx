import type { Metadata } from "next";
import { getCatalog } from "@/lib/shopify";
import { PageHeader, Section } from "@/components/layout/PageHeader";
import { CollectionView } from "@/components/shop/CollectionView";
import { CatalogNotice } from "@/components/shop/CatalogNotice";

export const metadata: Metadata = {
  title: "Collection 001",
  description:
    "Collection 001 — The Foundations. Shirting and trousers from Nero Noren, cut to be worn together.",
};

export default async function CollectionPage() {
  const catalog = await getCatalog();

  return (
    <>
      <PageHeader
        eyebrow="Collection 001"
        title={["The Foundations"]}
        lede="Five shapes, made to be worn together — the shirt the wardrobe is built around, and the trouser that goes with all of it. Move between parts of the floor below."
      />
      <Section className="pb-28 md:pb-40">
        <CatalogNotice catalog={catalog} />
        <CollectionView products={catalog.products} />
      </Section>
    </>
  );
}
