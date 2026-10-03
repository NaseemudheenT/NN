import type { Metadata } from "next";
import { World } from "@/components/world/World";
import { loadCatalogue } from "@/lib/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Nero Noren — timeless style builds character",
  description:
    "Walk the Nero Noren showroom. Two floors of modern European menswear for men and boys — take a piece off the rail, turn it over, and carry it with you.",
};

/**
 * The whole shop, in one room.
 *
 * Not a landing page with a 3D picture on it: the building IS the page.
 * Everything else on this site — the collection, a product, the trial
 * room — exists as a place inside it that the customer can walk to or be
 * carried to. The separate routes still exist, because a search engine and
 * a shared link both need a URL, but nobody has to use them to shop.
 */
export default async function Home() {
  const { products } = await loadCatalogue();
  return <World products={products} />;
}
