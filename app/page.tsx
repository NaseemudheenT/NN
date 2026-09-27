import type { Metadata } from "next";
import Link from "next/link";
import { loadCatalogue } from "@/lib/catalog";
import { readShowroomSettings } from "@/lib/supabase";
import { Showroom } from "@/components/showroom/Showroom";
import { ProductCard } from "@/components/shop/ProductCard";
import { OutfitBuilder } from "@/components/shop/OutfitBuilder";
import { CatalogueNotice } from "@/components/shop/CatalogueNotice";
import { StylistTeaser } from "@/components/stylist/StylistTeaser";
import { FitFinder } from "@/components/trial/FitFinder";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Nero Noren — the art of dressing well",
  description:
    "Walk the Nero Noren showroom in 3D. European-inspired menswear, cut for Indian life. Collection 001, The Foundations.",
  alternates: { canonical: "/" },
};

/** Revalidate hourly; Shopify webhooks can purge the "shopify" tag sooner. */
export const revalidate = 3600;

export default async function HomePage() {
  const [catalogue, { settings }] = await Promise.all([loadCatalogue(), readShowroomSettings()]);

  /* The owner decides what stands where, from the console. A product with no
     override keeps the placement it came with. */
  const arranged = {
    ...catalogue,
    products: catalogue.products.map((p) => {
      const placement = settings.placements[p.handle];
      return placement && placement !== p.placement
        ? { ...p, placement: placement as typeof p.placement }
        : p;
    }),
  };

  /* A featured piece leads the collection grid. */
  const products = settings.featuredHandle
    ? [
        ...arranged.products.filter((p) => p.handle === settings.featuredHandle),
        ...arranged.products.filter((p) => p.handle !== settings.featuredHandle),
      ]
    : arranged.products;
  const shirts = products.filter((p) => p.type === "shirt");
  const trousers = products.filter((p) => p.type === "trouser");

  /* Product structured data, so the collection is eligible for rich results. */
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Collection 001 — The Foundations",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.title,
        description: p.description,
        brand: { "@type": "Brand", name: "Nero Noren" },
        url: `${env.siteUrl}/product/${p.handle}`,
        offers: {
          "@type": "Offer",
          priceCurrency: p.currency,
          price: (p.priceMinor / 100).toFixed(2),
          availability: p.variants.some((v) => v.available)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Structured data is generated from the catalogue, never from user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <Showroom catalogue={arranged} />

      <CatalogueNotice catalogue={arranged} />

      {/* ── the collection ── */}
      <section id="collection" className="nn-wrap py-24">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="nn-eyebrow">Ready to wear</p>
            <h2 className="mt-3 text-title">The Foundations</h2>
            <p className="mt-4 max-w-[48ch] text-[var(--ink-soft)]">
              {products.length} pieces, made to be worn together. Start with a shirt and a
              trouser; everything else in the collection will meet them.
            </p>
          </div>
          <Link href="/collection" className="nn-btn nn-btn--quiet">
            <span>View all</span>
          </Link>
        </div>

        <div className="grid gap-x-6 gap-y-12 [grid-template-columns:repeat(auto-fill,minmax(min(248px,100%),1fr))]">
          {products.map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      </section>

      <hr className="nn-rule nn-wrap" />

      {/* ── one shirt, four ways ── */}
      <section id="wardrobe" className="nn-wrap py-24">
        <div className="mb-10">
          <p className="nn-eyebrow">The wardrobe</p>
          <h2 className="mt-3 text-title">One shirt, four ways</h2>
          <p className="mt-4 max-w-[48ch] text-[var(--ink-soft)]">
            Choose a shirt and see it against every trouser we make. This is the whole point
            of a foundation collection: nothing in it fights anything else.
          </p>
        </div>
        <OutfitBuilder shirts={shirts} trousers={trousers} />
      </section>

      <hr className="nn-rule nn-wrap" />

      {/* ── the stylist ── */}
      <section id="stylist" className="nn-wrap py-24">
        <StylistTeaser products={products} />
      </section>

      <hr className="nn-rule nn-wrap" />

      {/* ── find your fit ── */}
      <section id="fit" className="nn-wrap py-24">
        <div className="mb-10">
          <p className="nn-eyebrow">Sizing</p>
          <h2 className="mt-3 text-title">Find your fit</h2>
          <p className="mt-4 max-w-[48ch] text-[var(--ink-soft)]">
            Tell us your height, your weight and the waist of the jeans you wear. We work out
            the rest from the finished measurements of the garment.
          </p>
        </div>
        <FitFinder products={products} />
      </section>

      <hr className="nn-rule nn-wrap" />

      {/* ── the house ── */}
      <section id="story" className="nn-wrap py-24">
        <p className="nn-eyebrow">The house</p>
        <h2 className="mt-3 max-w-[28ch] text-title">
          European in design, honest about origin
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-lead">Fabric, fit and finish first</h3>
            <p className="mt-3 text-fine text-[var(--ink-soft)]">
              The cloth is chosen before the colour and the pattern is corrected before the
              range is signed off. A shirt that fits badly in a beautiful fabric is still a
              shirt that fits badly.
            </p>
          </div>
          <div>
            <h3 className="text-lead">Fair prices, no permanent sale</h3>
            <p className="mt-3 text-fine text-[var(--ink-soft)]">
              One price, held. We would rather cut a piece from the range than discount it
              until it means nothing.
            </p>
          </div>
          <div>
            <h3 className="text-lead">Details</h3>
            <p className="mt-3 text-fine text-[var(--ink-soft)]">
              A woven label at the back neck, engraved buttons, a pressed crease that holds.
              Turn a piece around in the showroom and you will find them.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
