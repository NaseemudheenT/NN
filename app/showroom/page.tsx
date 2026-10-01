import type { Metadata } from "next";
import { loadCatalogue } from "@/lib/catalog";
import { readShowroomSettings } from "@/lib/supabase";
import { Showroom } from "@/components/showroom/Showroom";

export const metadata: Metadata = {
  title: "The showroom",
  description:
    "Walk the Nero Noren showroom. Stand at the rails, the table, the mirror and the fitting room door, in a room lit by your own clock.",
  alternates: { canonical: "/showroom" },
};

/** Hourly; a Shopify webhook can purge the "shopify" tag sooner. */
export const revalidate = 3600;

/**
 * The showroom you walk, as opposed to the one you scroll.
 *
 * The homepage is a fixed cinematic walk: the scrollbar carries you along one
 * route past the garments, and that is the right first experience because it
 * needs no instruction. This page is the same room with the choreography handed
 * over — five places to stand, each with its own composition and focal length,
 * and the camera walks between them around the furniture.
 *
 * Everything here already existed and was reachable from nowhere: the room,
 * the viewpoints, the hotspots and the product panel were built and then never
 * given a route. The brief names "Showroom" as a navigation destination, so
 * this is that destination.
 *
 * Owner placements are applied exactly as on the homepage — the console
 * decides what stands where, and both rooms have to agree.
 */
export default async function ShowroomPage() {
  const [catalogue, { settings }] = await Promise.all([loadCatalogue(), readShowroomSettings()]);

  const arranged = {
    ...catalogue,
    products: catalogue.products.map((p) => {
      const placement = settings.placements[p.handle];
      return placement && placement !== p.placement
        ? { ...p, placement: placement as typeof p.placement }
        : p;
    }),
  };

  return <Showroom catalogue={arranged} />;
}
