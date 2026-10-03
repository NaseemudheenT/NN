import type { Metadata } from "next";
import { Tower } from "@/components/tower/Tower";
import { loadCatalogue } from "@/lib/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Nero Noren — timeless style builds character",
  description:
    "NN Tower: the Nero Noren flagship. Nine levels of modern European menswear for men and boys — the collection gallery, the atelier, the stylist, the trial room.",
};

/**
 * NN Tower.
 *
 * The whole website is one building. Arrive on the street, step inside,
 * and take the lift to any floor. The separate routes still exist because
 * links and search engines need URLs, but nobody has to use them to shop.
 */
export default async function Home() {
  const { products } = await loadCatalogue();
  return <Tower products={products} />;
}
