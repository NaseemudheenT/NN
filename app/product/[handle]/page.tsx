import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { loadCatalogue, loadProduct } from "@/lib/catalog";
import { formatMinor } from "@/lib/money";
import { cmToIn } from "@/lib/fit";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { ProductCard } from "@/components/shop/ProductCard";
import { Section } from "@/components/layout/Section";
import { GlassButton } from "@/components/ui/glass/GlassButton";
import { env } from "@/lib/env";

export const revalidate = 3600;

/** Pre-render every handle we know about at build time. */
export async function generateStaticParams() {
  const { products } = await loadCatalogue();
  return products.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const { product } = await loadProduct(handle);
  if (!product) return { title: "Not found" };

  return {
    title: product.title,
    description: product.description,
    alternates: { canonical: `/product/${product.handle}` },
    openGraph: {
      title: `${product.title} — Nero Noren`,
      description: product.description,
      type: "website",
      url: `${env.siteUrl}/product/${product.handle}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const { product, source } = await loadProduct(handle);
  if (!product) notFound();

  const { products } = await loadCatalogue();
  /* What this piece is worn with: the opposite half of the wardrobe. */
  const pairsWith = products.filter((p) => p.type !== product.type).slice(0, 4);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    brand: { "@type": "Brand", name: "Nero Noren" },
    material: product.fabric || undefined,
    color: product.colour,
    url: `${env.siteUrl}/product/${product.handle}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: product.currency,
      lowPrice: (product.priceMinor / 100).toFixed(2),
      highPrice: (
        Math.max(...product.variants.map((v) => v.priceMinor), product.priceMinor) / 100
      ).toFixed(2),
      offerCount: product.variants.length,
      availability: product.variants.some((v) => v.available)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="nn-wrap" style={{ paddingTop: "clamp(6.5rem, 12vh, 9rem)" }}>
        <nav aria-label="Breadcrumb" className="mb-8 text-fine">
          <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0 text-[var(--ink-faint)]">
            <li>
              <Link href="/" className="nn-link">
                Showroom
              </Link>
            </li>
            <li aria-hidden="true">·</li>
            <li>
              <Link href="/collection" className="nn-link">
                Collection 001
              </Link>
            </li>
            <li aria-hidden="true">·</li>
            <li aria-current="page" className="text-[var(--ink)]">
              {product.name}, {product.colour}
            </li>
          </ol>
        </nav>
      </div>

      <div className="nn-wrap">
        <ProductDetail product={product} source={source} />
      </div>

      {/* the size chart, straight from the tech pack */}
      <Section
        label="Measurements"
        title={product.type === "shirt" ? "How it is cut" : "How it is sized"}
      >
        <p className="max-w-[54ch] text-[var(--ink-secondary)]">
          {product.type === "shirt"
            ? "The body measurements each size is cut to fit, and the finished measurements of the garment itself. The difference between them is the room you have."
            : "Trousers are sized by the waist of the jeans you already wear. The finished measurements below include the wearing ease at the waistband."}
        </p>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-fine">
            <caption className="sr-only">
              Size chart for {product.title}, in centimetres and inches
            </caption>
            <thead>
              <tr>
                <th scope="col" className="border-b p-3 text-left nn-eyebrow">
                  {product.type === "shirt" ? "Size" : "Waist"}
                </th>
                {product.type === "shirt" ? (
                  <th scope="col" className="border-b p-3 text-right nn-eyebrow">
                    To fit chest
                  </th>
                ) : null}
                <th scope="col" className="border-b p-3 text-right nn-eyebrow">
                  Garment {product.type === "shirt" ? "chest" : "waist"}
                </th>
                <th scope="col" className="border-b p-3 text-right nn-eyebrow">
                  {product.type === "shirt" ? "Shoulder" : "Hip"}
                </th>
                <th scope="col" className="border-b p-3 text-right nn-eyebrow">
                  {product.type === "shirt" ? "Sleeve" : "Inseam"}
                </th>
              </tr>
            </thead>
            <tbody>
              {product.sizeChart.rows.map((row) => {
                const fitRange = row.body.chest ?? row.body.waist;
                return (
                  <tr key={row.label}>
                    <th scope="row" className="border-b p-3 text-left font-normal">
                      {row.label}
                    </th>
                    {product.type === "shirt" ? (
                      <td className="nn-tabular border-b p-3 text-right text-[var(--ink-soft)]">
                        {fitRange
                          ? `${cmToIn(fitRange[0])}–${cmToIn(fitRange[1])} in`
                          : "—"}
                      </td>
                    ) : null}
                    <td className="nn-tabular border-b p-3 text-right">
                      {product.type === "shirt" ? row.garment.chest : row.garment.waist} cm
                    </td>
                    <td className="nn-tabular border-b p-3 text-right text-[var(--ink-soft)]">
                      {product.type === "shirt" ? row.garment.shoulder : row.garment.hip} cm
                    </td>
                    <td className="nn-tabular border-b p-3 text-right text-[var(--ink-soft)]">
                      {product.type === "shirt" ? row.garment.sleeve : row.garment.inseam} cm
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/trial-room?product=${product.handle}`}>
            <GlassButton tone="metal" size="md">Try it on</GlassButton>
          </Link>
          <Link href="/sizing">
            <GlassButton tone="quiet" size="md">How we size</GlassButton>
          </Link>
        </div>
      </Section>

      {/* what it is worn with */}
      {pairsWith.length ? (
        <Section
          label="The wardrobe"
          title="Wear it with"
          lede="Everything in Collection 001 is cut to sit alongside everything else. These are the pieces from the other half of the wardrobe."
        >
          <div className="nn-grid">
            {pairsWith.map((p) => (
              <ProductCard key={p.handle} product={p} />
            ))}
          </div>
        </Section>
      ) : null}

      <p className="nn-wrap text-[var(--text-micro)] text-[var(--ink-tertiary)]" style={{ paddingBottom: "var(--space-hall)" }}>
        {formatMinor(product.priceMinor, product.currency)} includes GST. Free size exchanges
        within 7 days of delivery.
      </p>
    </>
  );
}
