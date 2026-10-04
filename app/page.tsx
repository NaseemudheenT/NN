import type { Metadata } from "next";
import { NNTower } from "@/components/tower/NNTower";
import { loadCatalogue } from "@/lib/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Nero Noren — NN Tower",
  description:
    "NN Tower: the Nero Noren digital flagship. Nine levels of modern European menswear for men and boys — walk in, take the lift, and shop the floor you are standing on.",
};

/**
 * The website is the building.
 *
 * There is no home page that links to a showroom. The customer arrives on
 * the street outside NN Tower, walks in, and everything — the collection,
 * the atelier, the stylist, the fitting room, the bag, the checkout —
 * happens on a floor of it.
 */
export default async function Home() {
  const { products } = await loadCatalogue();
  return <NNTower products={products} />;
}
