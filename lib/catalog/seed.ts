/**
 * Collection 001 — The Foundations. Seed catalogue.
 *
 * This is the fallback the site serves until SHOPIFY_STORE_DOMAIN and
 * SHOPIFY_STOREFRONT_TOKEN are set, at which point Shopify becomes the only
 * source of truth. The pieces, colours, prices and copy are taken from the
 * approved prototype at /reference/nero-noren.html so nothing drifts.
 *
 * No component imports this file directly. Everything goes through
 * lib/catalog/index.ts, which prefers Shopify.
 */

import type { Product, SizeChart } from "./types";

const IN = 2.54; // one inch, in centimetres

/* ── size charts ──────────────────────────────────────────────────
   Shirt body chest ranges are the brand's own (S 36–38in … XXL 44–47in).
   Garment measurements are the finished shirt, so ease = garment − body. */

export const SHIRT_CHART: SizeChart = {
  type: "shirt",
  unit: "cm",
  rows: [
    { label: "S",   body: { chest: [36 * IN, 38 * IN] }, garment: { chest: 106, waist: 100, shoulder: 44.0, sleeve: 62.0, length: 74 } },
    { label: "M",   body: { chest: [38 * IN, 40 * IN] }, garment: { chest: 110, waist: 104, shoulder: 45.5, sleeve: 63.5, length: 76 } },
    { label: "L",   body: { chest: [40 * IN, 42 * IN] }, garment: { chest: 114, waist: 108, shoulder: 47.0, sleeve: 65.0, length: 78 } },
    { label: "XL",  body: { chest: [42 * IN, 44 * IN] }, garment: { chest: 118, waist: 112, shoulder: 48.5, sleeve: 66.5, length: 80 } },
    { label: "XXL", body: { chest: [44 * IN, 47 * IN] }, garment: { chest: 123, waist: 117, shoulder: 50.0, sleeve: 68.0, length: 82 } },
  ],
};

/** Trousers are sized by the customer's usual jeans waist, 28–38 even. */
export const TROUSER_CHART: SizeChart = {
  type: "trouser",
  unit: "cm",
  rows: [28, 30, 32, 34, 36, 38].map((waistIn) => {
    const waistCm = waistIn * IN;
    return {
      label: String(waistIn),
      body: {
        waist: [waistCm - IN / 2, waistCm + IN / 2] as [number, number],
        hip: [waistCm + 19, waistCm + 25] as [number, number],
      },
      garment: {
        // +1.5 cm of wearing ease at the waistband, hip and thigh scaled off it
        waist: Math.round((waistCm + 1.5) * 10) / 10,
        hip: Math.round((waistCm + 24) * 10) / 10,
        thigh: Math.round((waistCm * 0.53 + 20) * 10) / 10,
        inseam: 79,
      },
    };
  }),
};

const shirtVariants = (handle: string, priceMinor: number) =>
  SHIRT_CHART.rows.map((r) => ({
    id: `${handle}-${r.label.toLowerCase()}`,
    size: r.label,
    available: true,
    priceMinor,
    currency: "INR",
  }));

const trouserVariants = (handle: string, priceMinor: number) =>
  TROUSER_CHART.rows.map((r) => ({
    id: `${handle}-${r.label}`,
    size: r.label,
    available: true,
    priceMinor,
    currency: "INR",
  }));

const OXFORD_FABRIC = "Long-staple cotton in a 120 gsm Oxford weave, garment washed.";
const POPLIN_FABRIC = "100s two-ply cotton poplin, 110 gsm, mercerised for a quiet lustre.";
const TWILL_FABRIC = "Compact cotton twill with 2% elastane, 280 gsm, for a trouser that holds its crease.";
const SHIRT_CARE = "Machine wash cold on a gentle cycle. Line dry in shade. Warm iron on the reverse.";
const TROUSER_CARE = "Dry clean, or machine wash cold inside out and hang to dry. Press on the reverse.";

function shirt(
  p: Pick<Product, "handle" | "name" | "colour" | "style" | "hex" | "description" | "bestFor"> &
    { priceMinor: number; stripe?: string; fabric: string; fitNotes: string; placement: Product["placement"] },
): Product {
  return {
    handle: p.handle,
    title: `${p.name}, ${p.colour}`,
    name: p.name,
    colour: p.colour,
    type: "shirt",
    style: p.style,
    hex: p.hex,
    stripe: p.stripe,
    description: p.description,
    fabric: p.fabric,
    care: SHIRT_CARE,
    bestFor: p.bestFor,
    priceMinor: p.priceMinor,
    currency: "INR",
    variants: shirtVariants(p.handle, p.priceMinor),
    sizeChart: SHIRT_CHART,
    modelGlb: `/models/garments/${p.handle}.glb`,
    fitNotes: p.fitNotes,
    placement: p.placement,
    images: [],
    isSeed: true,
  };
}

function trouser(
  p: Pick<Product, "handle" | "name" | "colour" | "style" | "hex" | "description" | "bestFor"> &
    { priceMinor: number; fitNotes: string; placement: Product["placement"] },
): Product {
  return {
    handle: p.handle,
    title: `${p.name}, ${p.colour}`,
    name: p.name,
    colour: p.colour,
    type: "trouser",
    style: p.style,
    hex: p.hex,
    description: p.description,
    fabric: TWILL_FABRIC,
    care: TROUSER_CARE,
    bestFor: p.bestFor,
    priceMinor: p.priceMinor,
    currency: "INR",
    variants: trouserVariants(p.handle, p.priceMinor),
    sizeChart: TROUSER_CHART,
    modelGlb: `/models/garments/${p.handle}.glb`,
    fitNotes: p.fitNotes,
    placement: p.placement,
    images: [],
    isSeed: true,
  };
}

export const SEED_PRODUCTS: Product[] = [
  shirt({
    handle: "oxford-bianco",
    name: "The Oxford",
    colour: "Bianco",
    style: "oxford",
    hex: "#F4F2ED",
    priceMinor: 289000,
    fabric: OXFORD_FABRIC,
    description:
      "Oxford-weave cotton with a button-down collar and a regular fit. The shirt the rest of the wardrobe is built around.",
    bestFor: "Any day of the week, under a jacket or on its own",
    fitNotes:
      "Regular through the chest with a gentle taper at the waist. Sleeves finish at the wrist bone. If you are between sizes, take the smaller one — the Oxford relaxes with washing.",
    placement: "rail-a",
  }),
  shirt({
    handle: "oxford-azure",
    name: "The Oxford",
    colour: "Azure",
    style: "oxford",
    hex: "#A9C0D8",
    priceMinor: 289000,
    fabric: OXFORD_FABRIC,
    description:
      "The same Oxford in a soft sky blue. Reads smart with charcoal, relaxed with sable.",
    bestFor: "Office days that end somewhere else",
    fitNotes:
      "Cut identically to the Bianco. Regular through the chest, gentle taper at the waist.",
    placement: "rail-a",
  }),
  shirt({
    handle: "poplin-ecru",
    name: "The Poplin",
    colour: "Écru",
    style: "poplin",
    hex: "#E4D9C3",
    priceMinor: 269000,
    fabric: POPLIN_FABRIC,
    description:
      "Smooth cotton poplin with a spread collar. Crisp enough for a meeting, soft enough for dinner.",
    bestFor: "Dinners, receptions and warm evenings",
    fitNotes:
      "A touch closer through the body than the Oxford, with a spread collar that sits well open. Poplin does not relax as much in the wash, so take your usual size.",
    placement: "rail-b",
  }),
  shirt({
    handle: "stripe-marine",
    name: "The Stripe",
    colour: "Marine",
    style: "poplin",
    hex: "#F3F2EE",
    stripe: "#22304F",
    priceMinor: 299000,
    fabric: POPLIN_FABRIC,
    description:
      "A fine marine stripe on a white ground with a spread collar. Works with every trouser in the collection.",
    bestFor: "Meetings, travel and everything between",
    fitNotes:
      "The Poplin cut, in a 1.6 mm woven stripe. Stripes are matched at the placket and the yoke.",
    placement: "mannequin-1",
  }),
  trouser({
    handle: "tailored-sable",
    name: "The Tailored Trouser",
    colour: "Sable",
    style: "flat",
    hex: "#BDA785",
    priceMinor: 329000,
    description:
      "Flat front, mid rise and a tapered leg with a pressed crease. A warm sand tone for daylight.",
    bestFor: "Weekends, brunch, daylight events",
    fitNotes:
      "Mid rise, sitting just below the natural waist. Tapered from the knee to a 17 cm hem. Order your usual jeans waist.",
    placement: "table",
  }),
  trouser({
    handle: "tailored-charcoal",
    name: "The Tailored Trouser",
    colour: "Charcoal",
    style: "flat",
    hex: "#3A3A3D",
    priceMinor: 329000,
    description: "Flat front, mid rise and a tapered leg. The most formal trouser in the collection.",
    bestFor: "Office days and evenings out",
    fitNotes:
      "Identical cut to the Sable. Mid rise, tapered leg, pressed crease. Order your usual jeans waist.",
    placement: "mannequin-1",
  }),
  trouser({
    handle: "tailored-marine",
    name: "The Tailored Trouser",
    colour: "Marine",
    style: "flat",
    hex: "#25314C",
    priceMinor: 329000,
    description:
      "Flat front, mid rise and a tapered leg in deep navy. Easy to travel in, easy to dress up.",
    bestFor: "Travel and client meetings",
    fitNotes: "The Tailored cut in deep navy. Mid rise, tapered leg. Order your usual jeans waist.",
    placement: "table",
  }),
  trouser({
    handle: "pleated-pierre",
    name: "The Pleated Trouser",
    colour: "Pierre",
    style: "pleat",
    hex: "#9E978C",
    priceMinor: 359000,
    description:
      "A single forward pleat gives room through the thigh, tapered to a clean hem. Stone grey that suits every shirt.",
    bestFor: "Dinners, receptions and celebrations",
    fitNotes:
      "A single forward pleat adds about 4 cm of room through the thigh, so this wears easier than the Tailored at the same waist. Sits slightly higher on the waist.",
    placement: "mannequin-2",
  }),
];

export const SEED_HANDLES = SEED_PRODUCTS.map((p) => p.handle);
