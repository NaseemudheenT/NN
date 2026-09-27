import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = env.siteUrl.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing here is secret — these routes are protected on the server —
        // but none of them belongs in a search index.
        disallow: ["/api/", "/owner", "/checkout", "/bag"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
