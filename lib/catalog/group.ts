import type { Product } from "./types";

/**
 * Colourways of the same cut, grouped.
 *
 * Shopify gives us one product per colourway — "The Oxford, Bianco" and
 * "The Oxford, Azure" are two products — but a customer thinks of them as
 * one shirt in two colours. Grouping on `name` is what lets a card show
 * three dots instead of appearing three times in the grid.
 */
export function groupByCut(products: Product[]): { lead: Product; siblings: Product[] }[] {
  const byName = new Map<string, Product[]>();
  for (const p of products) {
    const list = byName.get(p.name);
    if (list) list.push(p);
    else byName.set(p.name, [p]);
  }
  return [...byName.values()].map((list) => ({ lead: list[0], siblings: list.slice(1) }));
}

/** Every distinct cloth colour in the catalogue, for the showroom's rails. */
export function clothColours(products: Product[]): string[] {
  const seen = new Set<string>();
  for (const p of products) seen.add(p.hex);
  /* The hall's own stock reads darker than the catalogue: a rail of pale
     shirts under a warm spot goes to white and loses its shape. Charcoal and
     ink are mixed in so the rails have weight at a distance. */
  return [...seen, "#1c1a18", "#2e2e2e", "#3b3630"];
}

export const CATEGORIES = [
  { id: "tailoring", label: "Tailoring", match: (p: Product) => p.type === "trouser" },
  { id: "shirts", label: "Shirts", match: (p: Product) => p.type === "shirt" },
  { id: "trousers", label: "Trousers", match: (p: Product) => p.type === "trouser" },
  { id: "outerwear", label: "Outerwear", match: () => false },
  { id: "loafers", label: "Loafers", match: () => false },
  { id: "accessories", label: "Accessories", match: () => false },
] as const;
