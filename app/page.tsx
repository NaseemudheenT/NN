import type { Metadata } from "next";
import Link from "next/link";
import { loadCatalogue } from "@/lib/catalog";
import { readShowroomSettings } from "@/lib/supabase";
import { env } from "@/lib/env";

import { ShowroomWalk } from "@/components/home/ShowroomWalk";
import { Section } from "@/components/layout/Section";
import { ProductCard } from "@/components/shop/ProductCard";
import { OutfitBuilder } from "@/components/shop/OutfitBuilder";
import { CatalogueNotice } from "@/components/shop/CatalogueNotice";
import { StylistTeaser } from "@/components/stylist/StylistTeaser";
import { FitFinder } from "@/components/trial/FitFinder";
import { GlassButton } from "@/components/ui/glass/GlassButton";

export const metadata: Metadata = {
  title: "Nero Noren — timeless style builds character",
  description:
    "Walk the Nero Noren showroom. European-inspired menswear for men and boys, cut for Indian life. Collection 001, The Foundations.",
  alternates: { canonical: "/" },
};

/** Hourly; a Shopify webhook can purge the "shopify" tag sooner. */
export const revalidate = 3600;

export default async function HomePage() {
  const [catalogue, { settings }] = await Promise.all([loadCatalogue(), readShowroomSettings()]);

  /* The owner decides what stands where, from the console. */
  const arranged = {
    ...catalogue,
    products: catalogue.products.map((p) => {
      const placement = settings.placements[p.handle];
      return placement && placement !== p.placement
        ? { ...p, placement: placement as typeof p.placement }
        : p;
    }),
  };

  /* A featured piece leads the grid. */
  const products = settings.featuredHandle
    ? [
        ...arranged.products.filter((p) => p.handle === settings.featuredHandle),
        ...arranged.products.filter((p) => p.handle !== settings.featuredHandle),
      ]
    : arranged.products;

  const shirts = products.filter((p) => p.type === "shirt");
  const trousers = products.filter((p) => p.type === "trouser");

  /* Structured data, generated from the catalogue and never from user input. */
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />

      {/* ═══ the walk through the showroom ═══ */}
      <ShowroomWalk catalogue={arranged} />

      <CatalogueNotice catalogue={arranged} />

      {/* ═══ the collection ═══ */}
      <Section
        id="collection"
        label="Ready to wear"
        title="The Foundations"
        lede={`${products.length} pieces, made to be worn together. Start with a shirt and a trouser; everything else in the collection will meet them.`}
        action={
          <Link href="/collection">
            <GlassButton tone="quiet" size="sm">
              View all
            </GlassButton>
          </Link>
        }
      >
        <div className="nn-grid">
          {products.map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      </Section>

      {/* ═══ the wardrobe ═══ */}
      <Section
        id="wardrobe"
        label="The wardrobe"
        title="One shirt, four ways"
        lede="Choose a shirt and see it against every trouser we make. This is the whole point of a foundation collection: nothing in it fights anything else."
      >
        <OutfitBuilder shirts={shirts} trousers={trousers} />
      </Section>

      {/* ═══ the stylist ═══ */}
      <Section id="stylist" label="The stylist" title="An in-store stylist, on call">
        <StylistTeaser products={products} />
      </Section>

      {/* ═══ the fit ═══ */}
      <Section
        id="fit"
        label="Sizing"
        title="Find your fit"
        lede="Tell us your height, your weight and the waist of the jeans you wear. We work out the rest from the finished measurements of the garment — and tell you which numbers we estimated."
      >
        <FitFinder products={products} />
      </Section>

      {/* ═══ the house ═══ */}
      <Section
        id="house"
        label="The house"
        title="More than clothing, a lifestyle"
        lede="European in design, honest about origin. Made for men and boys who would rather own eight good things than forty forgettable ones."
      >
        <div className="nn-columns">
          <article>
            <h3 className="nn-columns__title">Fabric, fit and finish first</h3>
            <p className="nn-columns__body">
              The cloth is chosen before the colour and the pattern is corrected before the range is
              signed off. A shirt that fits badly in a beautiful fabric is still a shirt that fits
              badly.
            </p>
          </article>
          <article>
            <h3 className="nn-columns__title">Fair prices, no permanent sale</h3>
            <p className="nn-columns__body">
              One price, held. A house that discounts continuously has told you its first price was
              not real. We would rather cut a piece from the range than discount it until it means
              nothing.
            </p>
          </article>
          <article>
            <h3 className="nn-columns__title">Crafted for what comes next</h3>
            <p className="nn-columns__body">
              A woven label at the back neck, engraved buttons, a pressed crease that holds. Details
              that cost more to make and are the difference between a garment and a product.
            </p>
          </article>
        </div>
      </Section>
    </>
  );
}
