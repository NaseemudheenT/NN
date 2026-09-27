import type { Metadata } from "next";
import Link from "next/link";
import { loadCatalogue } from "@/lib/catalog";
import { formatMinor } from "@/lib/money";
import { Section } from "@/components/layout/Section";
import { GarmentArt } from "@/components/shop/GarmentArt";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { CatalogueNotice } from "@/components/shop/CatalogueNotice";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Every Nero Noren collection. Collection 001, The Foundations: eight pieces cut to be worn together.",
  alternates: { canonical: "/collections" },
};

export const revalidate = 3600;

export default async function CollectionsPage() {
  const catalogue = await loadCatalogue();
  const { products } = catalogue;

  const shirts = products.filter((p) => p.type === "shirt");
  const trousers = products.filter((p) => p.type === "trouser");
  const from = products.length
    ? formatMinor(Math.min(...products.map((p) => p.priceMinor)), products[0].currency)
    : null;

  return (
    <>
      <header className="nn-pagehead">
        <div className="nn-wrap">
          <p className="nn-label nn-label--metal">The house</p>
          <h1 className="nn-pagehead__title">Collections</h1>
          <p className="nn-pagehead__lede">
            Nero Noren releases a collection when it is finished, not when the season says so.
            There is one, and it is the one everything else will be built on.
          </p>
        </div>
      </header>

      <CatalogueNotice catalogue={catalogue} />

      <Section
        label="Collection 001"
        title="The Foundations"
        lede="A coordinated wardrobe system: every shirt is cut to meet every trouser. Four shirts, four trousers, sixteen outfits."
        action={
          <Link href="/collection">
            <GlassButton tone="metal" size="sm">
              Shop the collection
            </GlassButton>
          </Link>
        }
      >
        {/* the collection as one object, the way a lookbook opens */}
        <Link href="/collection" className="nn-collection">
          <div className="nn-collection__plate">
            <div className="nn-collection__rail">
              {products.slice(0, 8).map((product, i) => (
                <span
                  key={product.handle}
                  className="nn-collection__piece"
                  style={{ ["--i" as string]: i }}
                >
                  <GarmentArt product={product} className="w-full" />
                </span>
              ))}
            </div>
          </div>

          <div className="nn-collection__meta">
            <div>
              <p className="nn-label">Collection 001</p>
              <h3 className="nn-collection__name">The Foundations</h3>
            </div>
            <dl className="nn-collection__facts">
              <div>
                <dt>Pieces</dt>
                <dd className="nn-tabular">{products.length}</dd>
              </div>
              <div>
                <dt>Shirts</dt>
                <dd className="nn-tabular">{shirts.length}</dd>
              </div>
              <div>
                <dt>Trousers</dt>
                <dd className="nn-tabular">{trousers.length}</dd>
              </div>
              {from ? (
                <div>
                  <dt>From</dt>
                  <dd className="nn-tabular">{from}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </Link>
      </Section>

      <Section
        label="Next"
        title="Collection 002"
        lede="Not announced. When there is something to show, it will be here — and not before."
      >
        <div className="nn-collection nn-collection--awaiting">
          <div className="nn-collection__plate nn-collection__plate--empty">
            <span className="nn-label">In development</span>
          </div>
          <div className="nn-collection__meta">
            <p className="nn-collection__body">
              Nero Noren would rather cut a piece from a range than ship one it is not sure of. The
              second collection is being made; no date has been set, and we will not invent one to
              fill a page.
            </p>
            <Link href="/journal" className="nn-link text-[var(--text-micro)] uppercase tracking-[var(--tracking-label)]">
              The journal will carry it first
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
