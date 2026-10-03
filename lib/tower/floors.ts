/**
 * NN TOWER — the building, as data.
 *
 * Nine levels from the street to the roof. This file is the single source
 * of truth for all of them: what each level is, which route it answers to,
 * where it sits in the elevation, and what can be touched on it.
 *
 * ── why the building is data and not markup ──────────────────────────
 * Because it has to be navigated three ways at once — by the elevator on
 * the right, by a hotspot in the image, and by a URL someone pasted into a
 * message — and all three have to agree. One array means they cannot
 * disagree. Adding a level is adding an object here; nothing else in the
 * tower needs to know.
 *
 * ── on the hotspots ──────────────────────────────────────────────────
 * Every hotspot that carries a price carries a real catalogue handle, and
 * the price is read from the catalogue at render time — never written here.
 * A building full of invented products would be a showroom nobody can buy
 * from, and an invented price is the one thing on a commercial site that
 * must never exist.
 */

export type LevelId =
  | "rooftop"
  | "owner"
  | "checkout"
  | "stylist"
  | "journal"
  | "menboys"
  | "atelier"
  | "gallery"
  | "street";

export type HotspotAction =
  | "ENTER"       // go inside, or go deeper
  | "PRODUCT"     // open a real catalogue piece
  | "COLLECTION"  // open the collection drawer, filtered
  | "STYLIST"     // the AI stylist
  | "FIT"         // the trial room
  | "BAG"         // the bag
  | "READ";       // an information surface

export interface Hotspot {
  id: string;
  label: string;
  /** Position ON THAT LEVEL's band, 0–100 of its own width and height. */
  x: number;
  y: number;
  action: HotspotAction;
  /** A real catalogue handle. The price is looked up, never stored. */
  handle?: string;
  /** Where it goes, when it goes somewhere. */
  href?: string;
  note?: string;
}

export interface Level {
  id: LevelId;
  /** 0 is the street; 8 is the roof. Drives the elevator and the pan. */
  floor: number;
  code: string;
  title: string;
  subtitle: string;
  /** One sentence. The building does the describing; this is the caption. */
  description: string;
  /** The canonical route for this level, for links and for search engines. */
  route: string;
  /** The level's own photograph, when one exists. */
  image?: string;
  hotspots: Hotspot[];
}

/* Ordered TOP DOWN, the way the elevator reads and the way the cutaway is
   drawn. floor numbers run the other way, which is how a building works. */
export const LEVELS: Level[] = [
  {
    id: "rooftop",
    floor: 8,
    code: "Rooftop",
    title: "Journey's end",
    subtitle: "The terrace",
    description: "Above the city, where the house says what it is for.",
    route: "/about",
    hotspots: [
      { id: "roof-vision", label: "Timeless style builds character", x: 62, y: 34, action: "READ", href: "/about" },
      { id: "roof-terrace", label: "The terrace", x: 30, y: 52, action: "READ", href: "/about#story" },
    ],
  },
  {
    id: "owner",
    floor: 7,
    code: "Level 7",
    title: "Owner console",
    subtitle: "Operations",
    description: "The private room. Figures, stock and the state of the house.",
    route: "/owner",
    hotspots: [
      { id: "own-desk", label: "Operations", x: 48, y: 44, action: "READ", href: "/owner" },
    ],
  },
  {
    id: "checkout",
    floor: 6,
    code: "Level 6",
    title: "The bag & checkout",
    subtitle: "The vault",
    description: "Where what you are carrying becomes an order.",
    route: "/checkout",
    hotspots: [
      { id: "ck-bag", label: "Your bag", x: 34, y: 44, action: "BAG" },
      { id: "ck-drawers", label: "Checkout", x: 70, y: 52, action: "ENTER", href: "/checkout" },
    ],
  },
  {
    id: "stylist",
    floor: 5,
    code: "Level 5",
    title: "AI stylist hub",
    subtitle: "Styling & virtual fit",
    description: "Ask for a look. Find your size before you buy.",
    route: "/stylist",
    hotspots: [
      { id: "st-orb", label: "Ask the stylist", x: 42, y: 42, action: "STYLIST" },
      { id: "st-fit", label: "Virtual fit test", x: 74, y: 48, action: "FIT" },
    ],
  },
  {
    id: "journal",
    floor: 4,
    code: "Level 4",
    title: "The journal & archive",
    subtitle: "The library",
    description: "The cloth, the corrections, and what was cut from the range.",
    route: "/journal",
    hotspots: [
      { id: "jr-library", label: "The archive", x: 36, y: 48, action: "READ", href: "/journal" },
      { id: "jr-product", label: "Product archive", x: 70, y: 36, action: "READ", href: "/atelier" },
    ],
  },
  {
    id: "menboys",
    floor: 3,
    code: "Level 3",
    title: "Men & boys",
    subtitle: "Generations of style",
    description: "The same cloth and the same cut, at two scales.",
    route: "/boys",
    hotspots: [
      { id: "mb-men", label: "Men", x: 32, y: 46, action: "COLLECTION", href: "/men" },
      { id: "mb-boys", label: "Boys", x: 68, y: 46, action: "COLLECTION", href: "/boys" },
      { id: "mb-oxford", label: "The Oxford", x: 50, y: 62, action: "PRODUCT", handle: "oxford-azure" },
    ],
  },
  {
    id: "atelier",
    floor: 2,
    code: "Level 2",
    title: "The atelier",
    subtitle: "The workshop",
    description: "Where the cloth is cut, and the four details that carry the mark.",
    route: "/atelier",
    hotspots: [
      { id: "at-bench", label: "The cutting bench", x: 38, y: 50, action: "READ", href: "/atelier" },
      { id: "at-cloth", label: "Cloth & finishing", x: 66, y: 44, action: "READ", href: "/atelier#cloth" },
    ],
  },
  {
    id: "gallery",
    floor: 1,
    code: "Level 1",
    title: "Collection gallery",
    subtitle: "Collection 001 — The Foundations",
    description: "Eight pieces, cut to go with each other.",
    route: "/collection",
    hotspots: [
      { id: "g-poplin", label: "The Poplin", x: 26, y: 48, action: "PRODUCT", handle: "poplin-ecru" },
      { id: "g-stripe", label: "The Stripe", x: 44, y: 54, action: "PRODUCT", handle: "stripe-marine" },
      { id: "g-trouser", label: "The Tailored Trouser", x: 62, y: 50, action: "PRODUCT", handle: "tailored-charcoal" },
      { id: "g-all", label: "The whole collection", x: 80, y: 42, action: "COLLECTION", href: "/collection" },
    ],
  },
  {
    id: "street",
    floor: 0,
    code: "Street",
    title: "Palazzo facade",
    subtitle: "The entrance",
    description: "Travertine, oak portals, and the mark lit above the arch.",
    route: "/",
    hotspots: [
      { id: "s-door", label: "Enter", x: 50, y: 70, action: "ENTER" },
      { id: "s-window", label: "The window", x: 74, y: 58, action: "COLLECTION", href: "/collection" },
      { id: "s-sign", label: "The mark", x: 27, y: 30, action: "READ", href: "/about" },
    ],
  },
];

/** Interior levels, top down — the street is the exterior and sits apart. */
export const INTERIOR = LEVELS.filter((l) => l.id !== "street");

export const STREET = LEVELS[LEVELS.length - 1];

export const levelById = (id: LevelId) => LEVELS.find((l) => l.id === id) ?? STREET;

export const levelForRoute = (route: string) =>
  LEVELS.find((l) => l.route === route) ?? null;

/* ── the elevation ───────────────────────────────────────────────────
   Where each level's band sits on the cutaway image, top to bottom, as a
   fraction of the whole. Eight interior levels across the frame, with the
   roof occupying slightly less than a shop floor does — which is what the
   drawing shows and what a real section looks like. */
export const BAND_TOP = 0.055;
export const BAND_BOTTOM = 0.96;

export function bandFor(floor: number): { top: number; height: number } {
  const n = INTERIOR.length;
  const span = BAND_BOTTOM - BAND_TOP;
  const h = span / n;
  /* floor 8 is the top band, floor 1 the bottom one */
  const index = 8 - floor;
  return { top: BAND_TOP + index * h, height: h };
}
