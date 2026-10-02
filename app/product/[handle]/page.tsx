import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductView } from "@/components/shop/ProductView";
import { ProductCard } from "@/components/shop/ProductCard";
import { loadCatalogue, loadProduct } from "@/lib/catalog";
import { groupByCut } from "@/lib/catalog/group";
import { formatMinor } from "@/lib/money";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { product } = await loadProduct((await params).handle);
  if (!product) return { title: "Not found" };
  return {
    title: `${product.name} — ${product.colour}`,
    description: product.description,
    openGraph: { title: `${product.name} — ${product.colour}`, description: product.description },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [{ product }, { products }] = await Promise.all([loadProduct(handle), loadCatalogue()]);
  if (!product) notFound();

  const siblings = products.filter((p) => p.name === product.name && p.handle !== product.handle);
  const alsoCuts = groupByCut(products.filter((p) => p.name !== product.name)).slice(0, 4);

  return (
    <>
      <nav className="wrap crumbs" aria-label="Breadcrumb">
        <Link href="/collection" className="ul-grow label label--soft">Collection</Link>
        <span className="label label--soft" aria-hidden>/</span>
        <span className="label label--soft">{product.name}</span>
      </nav>

      <ProductView product={product} siblings={siblings} />

      {alsoCuts.length ? (
        <section className="band band--tight" aria-labelledby="also-h">
          <div className="wrap">
            <h2 id="also-h" className="d-h3 pdp__also-h">Wears well with</h2>
            <ul className="grid grid--4">
              {alsoCuts.map(({ lead, siblings: s }) => (
                <li key={lead.handle}><ProductCard product={lead} siblings={s} /></li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Shopify-shaped structured data, straight from the catalogue —
          never a hand-written price. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${product.name} — ${product.colour}`,
            description: product.description,
            brand: { "@type": "Brand", name: "Nero Noren" },
            color: product.colour,
            material: product.fabric,
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: product.currency,
              lowPrice: (product.priceMinor / 100).toFixed(2),
              highPrice: (Math.max(...product.variants.map((v) => v.priceMinor)) / 100).toFixed(2),
              offerCount: product.variants.length,
              availability: product.variants.some((v) => v.available)
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
      <span className="sr-only">{formatMinor(product.priceMinor, product.currency)}</span>
    </>
  );
}
