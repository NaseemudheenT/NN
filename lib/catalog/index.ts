/**
 * The catalogue every page reads from.
 *
 * Shopify is the source of truth. When it is not configured — or when it is
 * configured but unreachable — the site serves the Collection 001 seed so the
 * showroom, collection, product pages, trial room and stylist all stay usable,
 * and reports which env vars are missing so the notice on the page is honest.
 *
 * No component hardcodes a product or a price. They read what this returns.
 */

import "server-only";
import { shopifyReady, missing } from "../env";
import { getProducts, getProduct } from "../shopify";
import { SEED_PRODUCTS } from "./seed";
import type { CatalogueResult, Product } from "./types";

const SHOPIFY_ENV = ["SHOPIFY_STORE_DOMAIN", "SHOPIFY_STOREFRONT_TOKEN"] as const;

export async function loadCatalogue(): Promise<CatalogueResult> {
  const missingEnv = missing(...SHOPIFY_ENV);

  if (!shopifyReady()) {
    return { products: SEED_PRODUCTS, source: "seed", missingEnv };
  }

  try {
    const products = await getProducts();
    if (!products.length) {
      // The store is connected but empty — say so rather than showing nothing.
      return { products: SEED_PRODUCTS, source: "seed", missingEnv: ["(Shopify store has no products yet)"] };
    }
    return { products, source: "shopify", missingEnv: [] };
  } catch (err) {
    console.error("[catalogue] Shopify unreachable, serving seed:", err);
    return {
      products: SEED_PRODUCTS,
      source: "seed",
      missingEnv: [`(Shopify request failed: ${err instanceof Error ? err.message : "unknown"})`],
    };
  }
}

export async function loadProduct(handle: string): Promise<{ product: Product | null; source: "shopify" | "seed" }> {
  if (shopifyReady()) {
    try {
      const product = await getProduct(handle);
      if (product) return { product, source: "shopify" };
    } catch (err) {
      console.error("[catalogue] Shopify product lookup failed, serving seed:", err);
    }
  }
  return {
    product: SEED_PRODUCTS.find((p) => p.handle === handle) ?? null,
    source: "seed",
  };
}

/** Products grouped by where they sit in the 3D showroom. */
export function byPlacement(products: Product[]) {
  const slot = (p: Product["placement"]) => products.filter((x) => x.placement === p);
  return {
    railA: slot("rail-a"),
    railB: slot("rail-b"),
    table: slot("table"),
    mannequin1: slot("mannequin-1"),
    mannequin2: slot("mannequin-2"),
  };
}

export type { Product, CatalogueResult } from "./types";
