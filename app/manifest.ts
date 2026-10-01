import type { MetadataRoute } from "next";

/**
 * The web app manifest.
 *
 * Without it, "add to home screen" gives a blank tile and a browser-chrome
 * title bar. With it the storefront opens standalone, on the house black,
 * carrying the monogram — which is the difference between a bookmark and
 * something that looks like it belongs on the phone.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nero Noren",
    short_name: "Nero Noren",
    description:
      "European-inspired menswear for men and boys. Walk the showroom, find your fit, and buy.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    orientation: "portrait-primary",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
