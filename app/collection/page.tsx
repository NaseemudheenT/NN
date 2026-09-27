import type { Metadata } from "next";
import Link from "next/link";
import { loadCatalogue } from "@/lib/catalog";
import { CatalogueNotice } from "@/components/shop/CatalogueNotice";
import { CollectionFilters } from "@/components/shop/CollectionFilters";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Collection 001 — The Foundations",
  description:
    "The whole Nero Noren range: Oxford and Poplin shirts, the Stripe, and Tailored and Pleated trousers. Eight pieces made to be worn together.",
  alternates: { canonical: "/collection" },
};

export const revalidate = 3600;

/**
 * The 2D shop. This page is the one that has to work everywhere: no 3D, no
 * WebGL, no JavaScript beyond the filters. It is what the "Shop in 2D" button
 * in the showroom exists to reach.
 */
export default async function CollectionPage() {
  const catalogue = await loadCatalogue();

  return (
    <>
      <PageHeader
        eyebrow="Ready to wear"
        title="Collection 001"
        lede="The Foundations. Eight pieces, one price each, held. Every shirt here meets every trouser here — that is the whole idea."
      />

      <CatalogueNotice catalogue={catalogue} />

      <section className="nn-wrap pb-24">
        <CollectionFilters products={catalogue.products} />
      </section>

      <section className="nn-wrap pb-24">
        <div
          className="border p-8 md:p-12"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}
        >
          <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-center">
            <div>
              <h2 className="text-title">Not sure of your size?</h2>
              <p className="mt-4 max-w-[48ch] text-[var(--ink-soft)]">
                The trial room scales a body to your measurements and works out how much room
                each size leaves you at the chest, the waist and the hip. It tells you what it
                estimated and what you told it.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href="/trial-room" className="nn-btn nn-btn--gold">
                <span>Enter the trial room</span>
              </Link>
              <Link href="/stylist" className="nn-btn nn-btn--quiet">
                <span>Ask the stylist</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
