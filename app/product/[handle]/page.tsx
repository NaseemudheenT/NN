import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog, getProduct } from "@/lib/shopify";
import { ProductDetail } from "@/components/shop/ProductDetail";

export async function generateMetadata(props: PageProps<"/product/[handle]">): Promise<Metadata> {
  const { handle } = await props.params;
  const product = await getProduct(handle);
  if (!product) return { title: "Piece not found" };

  const name = [product.title, product.colour].filter(Boolean).join(" — ");
  return {
    title: name,
    description: product.description.slice(0, 180),
    openGraph: {
      title: `${name} · Nero Noren`,
      description: product.description.slice(0, 180),
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/product/[handle]">) {
  const { handle } = await props.params;
  const [product, catalog] = await Promise.all([getProduct(handle), getCatalog()]);

  if (!product) notFound();

  const related = catalog.products.filter((p) => p.handle !== product.handle).slice(0, 3);

  // Structured data, so the piece is described correctly off-site too.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: [product.title, product.colour].filter(Boolean).join(" — "),
    description: product.description,
    brand: { "@type": "Brand", name: "Nero Noren" },
    material: product.fabric || undefined,
    image: product.images.map((i) => i.url),
    ...(product.price
      ? {
          offers: {
            "@type": "Offer",
            price: product.price.amount,
            priceCurrency: product.price.currency,
            availability: product.variants.some((v) => v.available)
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} related={related} />
    </>
  );
}
