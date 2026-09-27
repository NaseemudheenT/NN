import type { MetadataRoute } from "next";
import { loadCatalogue } from "@/lib/catalog";
import { env } from "@/lib/env";

/**
 * The sitemap is generated from the catalogue, so a product added in Shopify
 * appears here without anyone remembering to add it.
 *
 * Checkout, the bag and the owner console are deliberately absent: they are not
 * pages anybody should arrive at from a search result.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products } = await loadCatalogue();
  const base = env.siteUrl.replace(/\/$/, "");
  const now = new Date();

  const staticPages: { path: string; priority: number; frequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, frequency: "weekly" },
    { path: "/collection", priority: 0.9, frequency: "weekly" },
    { path: "/trial-room", priority: 0.7, frequency: "monthly" },
    { path: "/stylist", priority: 0.6, frequency: "monthly" },
    { path: "/about", priority: 0.5, frequency: "yearly" },
    { path: "/sizing", priority: 0.5, frequency: "yearly" },
    { path: "/care", priority: 0.4, frequency: "yearly" },
    { path: "/delivery", priority: 0.4, frequency: "yearly" },
    { path: "/privacy", priority: 0.3, frequency: "yearly" },
    { path: "/terms", priority: 0.3, frequency: "yearly" },
  ];

  return [
    ...staticPages.map((page) => ({
      url: `${base}${page.path}`,
      lastModified: now,
      changeFrequency: page.frequency,
      priority: page.priority,
    })),
    ...products.map((product) => ({
      url: `${base}/product/${product.handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
