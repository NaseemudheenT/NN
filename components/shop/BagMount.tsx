import { loadCatalogue } from "@/lib/catalog";
import { BagDrawer } from "./BagDrawer";

/**
 * Mounts the bag drawer with the catalogue it needs to price itself.
 *
 * A server component, so the catalogue is fetched once per request on the
 * server rather than by every visitor's browser.
 */
export async function BagMount() {
  const { products } = await loadCatalogue();
  return <BagDrawer products={products} />;
}
