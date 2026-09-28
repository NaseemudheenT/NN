import type { Catalog } from "@/lib/types";

/**
 * Says plainly where the numbers on this page come from — and, when the
 * store is not reachable, which variable is missing. It never fills the
 * gap with invented prices or stock.
 */
export function CatalogNotice({ catalog }: { catalog: Catalog }) {
  if (catalog.configured && !catalog.error) return null;

  const unreachable = Boolean(catalog.error);

  return (
    <aside
      className="nn-glass mb-10 rounded-md border-l-2 border-l-accent px-5 py-4"
      role="status"
    >
      <p className="nn-meta text-accent">
        {unreachable ? "The store is not responding" : "Prices and stock are not connected yet"}
      </p>
      <p className="nn-body mt-2 text-[0.85rem] text-ink-soft">
        {unreachable
          ? "Collection 001 is shown as displayed in the showroom while the store is unreachable. Nothing here is invented."
          : "These are the pieces of Collection 001 as they are displayed in the showroom. Price, sizes in stock and photography live in Shopify and appear here as soon as SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN are set."}
      </p>
    </aside>
  );
}
