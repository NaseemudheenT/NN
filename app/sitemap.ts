import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/shopify";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl().replace(/\/$/, "");
  const now = new Date();

  const fixed = ["", "/collection", "/trial-room", "/stylist", "/about", "/sizing", "/care", "/delivery", "/privacy", "/terms"];

  const catalog = await getCatalog();

  return [
    ...fixed.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: path === "" ? ("daily" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.7,
    })),
    ...catalog.products.map((p) => ({
      url: `${base}/product/${p.handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
