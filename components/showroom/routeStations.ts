/**
 * Which part of the building each page is in.
 *
 * The brief's central idea is that NN is one continuous building rather than
 * a set of pages, and this is the table that makes that literally true: every
 * route names a place to stand in the showroom, and navigating walks the
 * camera there instead of cutting to a new backdrop.
 *
 * The pairings are not decorative. A page about browsing the range stands at
 * the rails because that is where you browse. A product page stands at the
 * table, close in, because that is where a single piece is laid out and
 * looked at. The bag and the checkout stand at the entrance, facing the door,
 * because you are on your way out. Somebody who has walked a real shop will
 * recognise every one of them without being told, which is the point.
 *
 * ── the architecture is the same everywhere; the arrangement is not ──
 * The Founder's instruction was that the background should vary by room while
 * the architecture stays constant — same lime, same arches, same timber, a
 * different part of the floor. That is exactly what a viewpoint change gives:
 * one room, one material palette, seen from somewhere else. Changing the
 * COLOURS per page would be the other thing, and would make it four websites.
 */

import type { Viewpoint } from "./viewpoints";
import { VIEWPOINTS, viewpointById } from "./viewpoints";

/** Longest match wins, so /product/oxford resolves before /product. */
const STATIONS: { prefix: string; viewpoint: string }[] = [
  // Browsing the range: the rails, where the shirts hang.
  { prefix: "/collection", viewpoint: "shirts" },
  { prefix: "/collections", viewpoint: "shirts" },
  { prefix: "/boys", viewpoint: "shirts" },

  // One piece, laid out and looked at: the table.
  { prefix: "/product", viewpoint: "trousers" },

  // Fit: the fitting-room door.
  { prefix: "/trial-room", viewpoint: "trial" },
  { prefix: "/sizing", viewpoint: "trial" },

  // Being shown things: the mirror, with the dressed forms behind you.
  { prefix: "/stylist", viewpoint: "mirror" },

  // On the way out: the entrance, facing the door.
  { prefix: "/bag", viewpoint: "entrance" },
  { prefix: "/checkout", viewpoint: "entrance" },

  // The house itself: standing in the doorway looking in, which is where
  // you take in a building rather than a garment.
  { prefix: "/about", viewpoint: "entrance" },
  { prefix: "/journal", viewpoint: "entrance" },
  { prefix: "/care", viewpoint: "trousers" },
  { prefix: "/delivery", viewpoint: "entrance" },
];

/**
 * Routes that already have a showroom of their own.
 *
 * The homepage runs the scroll walk and /showroom runs the walkable room.
 * Mounting the backdrop there too would put two WebGL contexts on one page —
 * twice the memory, twice the draw calls, and two cameras disagreeing about
 * where the visitor is standing.
 */
const OWN_CANVAS = ["/", "/showroom"];

/**
 * Routes that should carry no room at all.
 *
 * The owner console is not a shop. It is where the Founder reads numbers and
 * changes what is on sale, and a showroom drifting behind that is a
 * distraction competing with a table of orders — plus a GPU cost on a page
 * whose entire job is to be quick and legible. A private operations room in a
 * real building does not have a view of the shop floor either.
 */
const NO_ROOM = ["/owner"];

export function hasOwnShowroom(pathname: string): boolean {
  return OWN_CANVAS.includes(pathname);
}

/** Where a route stands, or null if it should not carry the backdrop. */
export function stationFor(pathname: string): Viewpoint | null {
  if (hasOwnShowroom(pathname)) return null;
  if (NO_ROOM.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  const match = STATIONS
    .filter((s) => pathname === s.prefix || pathname.startsWith(`${s.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  // An unlisted route — /privacy, /terms, /settings — still belongs in the
  // building, so it gets the establishing view rather than nothing.
  return match ? viewpointById(match.viewpoint) : VIEWPOINTS[0];
}
