import type { Product } from "./types";

/**
 * The fit engine.
 *
 * It estimates body measurements from three numbers a customer actually
 * knows — height, weight and the trouser waist they already wear — then
 * compares them against the garment's published size chart.
 *
 * Where there is no published chart the result says so rather than guessing:
 * a confident wrong size is worse than an honest "not enough information".
 */

export type Build = "slim" | "regular" | "broad";
export type Preference = "close" | "regular" | "easy";

export interface Measurements {
  /** centimetres */
  height: number;
  /** kilograms */
  weight: number;
  /** the waist, in inches, of trousers the customer already wears */
  waistInches: number;
  build: Build;
  preference: Preference;
}

export interface BodyEstimate {
  chest: number;
  waist: number;
  hip: number;
  /** shoulder point to shoulder point */
  shoulder: number;
  /** shoulder to wrist */
  sleeve: number;
  /** crotch to floor */
  inseam: number;
  bmi: number;
}

export type Ease = "close" | "regular" | "easy" | "very easy" | "tight";

export interface AreaFit {
  area: "chest" | "waist" | "hip" | "inseam";
  /** garment measurement minus body measurement, in cm */
  ease: number;
  verdict: Ease;
  note: string;
}

export interface FitResult {
  body: BodyEstimate;
  /** null when the garment has published no size chart */
  size: string | null;
  areas: AreaFit[];
  /** plain-language summary */
  summary: string;
  /** true when the recommendation rests on a real published chart */
  fromSizeChart: boolean;
}

const BUILD_CHEST: Record<Build, number> = { slim: -3, regular: 0, broad: 3 };
const BUILD_SHOULDER: Record<Build, number> = { slim: -1.6, regular: 0, broad: 1.8 };

/** Preferred ease at the chest of a shirt, in centimetres. */
const PREFERRED_CHEST_EASE: Record<Preference, number> = {
  close: 8,
  regular: 13,
  easy: 19,
};

/** Preferred ease at the waist of a trouser — a much tighter tolerance. */
const PREFERRED_WAIST_EASE: Record<Preference, number> = {
  close: 1,
  regular: 3,
  easy: 5,
};

/**
 * A shirt is cut straighter than the body it covers, so the waist of the
 * garment carries considerably more ease than the chest. Extra room there is
 * how shirting is meant to be cut, not a fault.
 */
const SHIRT_WAIST_EXTRA = 7;
const SHIRT_HIP_EXTRA = 5;

export function estimateBody(m: Measurements): BodyEstimate {
  const heightM = m.height / 100;
  const bmi = m.weight / (heightM * heightM);

  // Waist the customer reports is the trouser waist, which sits below the
  // natural waist; convert to centimetres and keep it as the anchor.
  const waist = m.waistInches * 2.54;

  // Chest scales with the waist, but the ratio narrows as body mass rises:
  // a heavier frame carries proportionally more at the waist than at the
  // chest, so a fixed offset would badly overstate a large chest.
  const ratio = 1.18 - (bmi - 22) * 0.012;
  const chest = waist * ratio + 6 + (m.height - 175) * 0.12 + BUILD_CHEST[m.build];

  const hip = waist + 8 + Math.max(0, (bmi - 24) * 0.5);
  const shoulder = 39 + (m.height - 175) * 0.14 + (bmi - 22) * 0.35 + BUILD_SHOULDER[m.build];
  const sleeve = 58 + (m.height - 175) * 0.26;
  const inseam = m.height * 0.45 - 4;

  return {
    chest: round(chest),
    waist: round(waist),
    hip: round(hip),
    shoulder: round(shoulder),
    sleeve: round(sleeve),
    inseam: round(inseam),
    bmi: Math.round(bmi * 10) / 10,
  };
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

/** The ease each area is meant to carry, which differs by area and garment. */
function targetEase(
  area: AreaFit["area"],
  preference: Preference,
  isTrouser: boolean,
): { want: number; tolerance: number; floor: number } {
  if (isTrouser) {
    if (area === "waist") return { want: PREFERRED_WAIST_EASE[preference], tolerance: 2.5, floor: -1 };
    if (area === "hip") return { want: PREFERRED_WAIST_EASE[preference] + 6, tolerance: 6, floor: 1 };
    return { want: 1, tolerance: 3, floor: -2 };
  }
  const chest = PREFERRED_CHEST_EASE[preference];
  if (area === "chest") return { want: chest, tolerance: 4, floor: 4 };
  if (area === "waist") return { want: chest + SHIRT_WAIST_EXTRA, tolerance: 9, floor: 2 };
  return { want: chest + SHIRT_HIP_EXTRA, tolerance: 8, floor: 2 };
}

function verdictFor(
  area: AreaFit["area"],
  ease: number,
  preference: Preference,
  isTrouser: boolean,
): Ease {
  if (area === "inseam") {
    if (ease < -2) return "tight";
    if (ease > 4) return "very easy";
    return "regular";
  }

  const { want, tolerance, floor } = targetEase(area, preference, isTrouser);
  if (ease < floor) return "tight";

  const delta = ease - want;
  if (delta < -tolerance) return "close";
  if (delta > tolerance * 2) return "very easy";
  if (delta > tolerance) return "easy";
  return "regular";
}

const NOTES: Record<Ease, string> = {
  tight: "will pull — take the next size up",
  close: "sits close",
  regular: "sits as intended",
  easy: "has room to move",
  "very easy": "will look loose here",
};

/**
 * Compare an estimated body against a garment's published size chart.
 * Returns null for the size when the garment has not published one.
 */
export function fitGarment(product: Product, m: Measurements): FitResult {
  const body = estimateBody(m);
  const chart = product.sizeChart;

  if (!chart || Object.keys(chart).length === 0) {
    return {
      body,
      size: null,
      areas: [],
      fromSizeChart: false,
      summary:
        "This piece has not published a size chart yet, so no size can be recommended honestly. Your measurements are saved on this device and will be read against the chart as soon as it is published.",
    };
  }

  const isTrouser = product.category === "trousers";

  /**
   * One dimension decides the size — the chest for shirting, the waist for
   * trousers. The others only matter when they are too small, because extra
   * room where a garment is meant to have room is not a worse fit.
   */
  let best: { size: string; score: number } | null = null;

  for (const [size, g] of Object.entries(chart)) {
    let score: number | null = null;

    if (isTrouser) {
      if (g.waist != null) {
        const t = targetEase("waist", m.preference, true);
        score = Math.abs(g.waist - (body.waist + t.want));
        if (g.hip != null) {
          const h = targetEase("hip", m.preference, true);
          score += Math.max(0, body.hip + h.floor - g.hip) * 0.8;
        }
      } else if (g.hip != null) {
        const h = targetEase("hip", m.preference, true);
        score = Math.abs(g.hip - (body.hip + h.want));
      }
    } else if (g.chest != null) {
      const t = targetEase("chest", m.preference, false);
      score = Math.abs(g.chest - (body.chest + t.want));
      if (g.waist != null) {
        const w = targetEase("waist", m.preference, false);
        score += Math.max(0, body.waist + w.floor - g.waist) * 0.8;
      }
    } else if (g.waist != null) {
      const w = targetEase("waist", m.preference, false);
      score = Math.abs(g.waist - (body.waist + w.want));
    }

    if (score == null) continue;
    if (!best || score < best.score) best = { size, score };
  }

  if (!best) {
    return {
      body,
      size: null,
      areas: [],
      fromSizeChart: true,
      summary:
        "The published size chart for this piece does not yet carry the measurements needed to recommend a size.",
    };
  }

  const g = chart[best.size];
  const areas: AreaFit[] = [];

  const push = (area: AreaFit["area"], garment: number | undefined, bodyValue: number) => {
    if (garment == null) return;
    const ease = round(garment - bodyValue);
    const verdict = verdictFor(area, ease, m.preference, isTrouser);
    areas.push({ area, ease, verdict, note: NOTES[verdict] });
  };

  if (!isTrouser) push("chest", g.chest, body.chest);
  push("waist", g.waist, body.waist);
  push("hip", g.hip, body.hip);
  if (isTrouser && g.inseam != null) push("inseam", g.inseam, body.inseam);

  const tight = areas.filter((a) => a.verdict === "tight");
  const loose = areas.filter((a) => a.verdict === "very easy");
  // The area that decided the size is the one worth talking about.
  const primary = areas.find((a) => a.area === (isTrouser ? "waist" : "chest"));

  const list = (xs: AreaFit[]) => xs.map((a) => a.area).join(" and ");

  let summary: string;
  if (tight.length > 0) {
    summary = `Size ${best.size} is the closest match in the published chart, but it will pull at the ${list(
      tight,
    )}. Order the next size up if there is one.`;
  } else if (primary?.verdict === "close") {
    summary = `Size ${best.size} is the size to order. It sits closer at the ${primary.area} than the fit you asked for — take the next size up if you want the room.`;
  } else if (loose.length > 0) {
    summary = `Size ${best.size} is the size to order. It carries more room at the ${list(
      loose,
    )} than at the ${isTrouser ? "waist" : "chest"}, which is how this piece is cut.`;
  } else {
    summary = `Size ${best.size} is the size to order — it sits the way this piece is meant to sit.`;
  }

  return { body, size: best.size, areas, summary, fromSizeChart: true };
}
