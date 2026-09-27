import { loadCatalogue } from "@/lib/catalog";
import { StylistDock } from "./StylistDock";

/**
 * Mounts the stylist dock with the catalogue it may recommend from.
 * A server component, so the catalogue is fetched once per request rather than
 * by every visitor's browser.
 */
export async function StylistMount() {
  const { products } = await loadCatalogue();
  return <StylistDock products={products} />;
}
