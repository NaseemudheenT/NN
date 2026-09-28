import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this repository.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  images: {
    // Product photography is served by Shopify's CDN.
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
