import type { Metadata } from "next";
import Link from "next/link";
import { loadCatalogue } from "@/lib/catalog";
import { CollectionFilters } from "@/components/shop/CollectionFilters";
import { CatalogueNotice } from "@/components/shop/CatalogueNotice";
import { GlassButton } from "@/components/ui/glass/GlassButton";

export const metadata: Metadata = {
  title: "Collection 001 — The Foundations",
  description:
    "The whole Nero Noren range: Oxford and Poplin shirts, the Stripe, and Tailored and Pleated trousers. Eight pieces made to be worn together.",
  alternates: { canonical: "/collection" },
};

export const revalidate = 3600;

/**
 * The 2D shop.
 *
 * This is the page that has to work everywhere — no 3D, no WebGL, and no
 * JavaScript beyond the filters. It is what the showroom's "Shop in 2D"
 * exists to reach, and what a customer on a weak connection gets.
 */
export default async function CollectionPage() {
  const catalogue = await loadCatalogue();

  return (
    <>
      <header className="nn-pagehead">
        <div className="nn-wrap">
          <p className="nn-label nn-label--metal">Ready to wear</p>
          <h1 className="nn-pagehead__title">Collection 001</h1>
          <p className="nn-pagehead__lede">
            The Foundations. Eight pieces, one price each, held. Every shirt here meets every
            trouser here — that is the whole idea.
          </p>
        </div>
      </header>

      <CatalogueNotice catalogue={catalogue} />

      <section className="nn-wrap" style={{ paddingBottom: "var(--space-bay)" }}>
        <CollectionFilters products={catalogue.products} />
      </section>

      {/* ── the way on ── */}
      <section className="nn-wrap" style={{ paddingBottom: "var(--space-hall)" }}>
        <div className="nn-invite glass glass--panel glass--dispersive">
          <div>
            <p className="nn-label nn-label--metal">Not sure of your size?</p>
            <h2 className="nn-invite__title">The trial room will work it out</h2>
            <p className="nn-invite__body">
              It estimates your measurements from your height and weight, compares them against the
              finished garment, and tells you the room you have at the chest, the waist and the hip
              — and which numbers it estimated rather than measured.
            </p>
          </div>
          <div className="nn-invite__actions">
            <Link href="/trial-room">
              <GlassButton tone="metal" size="md">
                Enter the trial room
              </GlassButton>
            </Link>
            <Link href="/stylist">
              <GlassButton tone="quiet" size="md">
                Ask the stylist
              </GlassButton>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
