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

import type { PlateId } from "./plates";

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
  /**
   * Where this level sits ON THE CUTAWAY PLATE, as a percentage of that
   * image, and which side its label hangs off.
   *
   * These are not derived from a formula. The plate is an isometric render
   * of a real design, so its floors recede on a diagonal and no arithmetic
   * puts a marker on the right room — each one was measured against the
   * render until it landed on the thing it names. The stylist marker sits
   * on the blue fitting pods; the street marker sits on the pavement
   * outside the lit door.
   */
  anchor: { x: number; y: number; side: "left" | "right" };
  /** A plate that shows THIS level, when one of the six actually does. */
  plate?: PlateId;
  hotspots: Hotspot[];
}

/* Ordered TOP DOWN, the way the elevator reads and the way the cutaway is
   drawn. floor numbers run the other way, which is how a building works. */
export const LEVELS: Level[] = [
  {
    id: "rooftop",
    floor: 8,
    anchor: { x: 53.6, y: 18.4, side: "right" },
    plate: "aerial",
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
    anchor: { x: 35.5, y: 31.0, side: "left" },
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
    anchor: { x: 35.5, y: 38.6, side: "left" },
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
    anchor: { x: 70.9, y: 47.8, side: "right" },
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
    anchor: { x: 33.7, y: 49.5, side: "left" },
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
    anchor: { x: 38.2, y: 57.1, side: "left" },
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
    anchor: { x: 69.9, y: 63.0, side: "right" },
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
    anchor: { x: 59.1, y: 73.9, side: "right" },
    plate: "hall",
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
    anchor: { x: 22.8, y: 83.2, side: "left" },
    plate: "facade",
    code: "Street level",
    title: "Reception",
    subtitle: "Entrance · Check-in",
    description: "Travertine underfoot, brass inlay, and the desk that takes your name.",
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

/** Top down, the way the lift reads them. */
export const BY_HEIGHT = [...LEVELS].sort((a, b) => b.floor - a.floor);
