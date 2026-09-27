/**
 * NERO NOREN — the fit engine behind the trial room.
 *
 * Two real calculations, kept separate:
 *
 *  1. Body estimate. From height and weight we estimate chest, waist and hip
 *     girth. The basis is physical, not a lookup table: treat the torso as a
 *     cylinder of height H and density ~1.01 g/cm³, and mass M = ρ·H·(C²/4π),
 *     so girth C ∝ √(M/H). A linear fit in √(M/H) against published male
 *     anthropometry (chest 90 cm at 170 cm/60 kg, 97 at 175/70, 105 at 180/85,
 *     113 at 175/95) gives chest ≈ 160·√(M/H) − 5, accurate to about ±3 cm
 *     across the normal range. Waist is taken off chest by a ratio that rises
 *     with BMI, since additional mass is carried disproportionately at the
 *     waist. A stated jeans waist always overrides the estimate — a measured
 *     number beats a modelled one.
 *
 *  2. Ease. Ease = finished garment measurement − body measurement. This is the
 *     number that decides how a shirt actually feels, and it is what the
 *     trial room reports per area. The thresholds below are the brand's, in
 *     centimetres, and are applied against the size chart from Shopify
 *     (metafield nn.size_chart) so they follow the real tech pack.
 *
 * Nothing here is a guess dressed up as a fact: every returned number carries
 * whether it was measured or estimated.
 */

import type { Product, SizeChart, SizeRow } from "./catalog/types";

export type FitPreference = "close" | "regular" | "easy";
export type EaseVerdict = "tight" | "close" | "regular" | "easy" | "loose";

export interface Measurements {
  /** Centimetres. */
  heightCm: number;
  /** Kilograms. */
  weightKg: number;
  /** The customer's usual jeans waist, in inches. Optional. */
  jeansWaistIn?: number;
  preference: FitPreference;
}

export interface BodyEstimate {
  heightCm: number;
  weightKg: number;
  bmi: number;
  chestCm: number;
  waistCm: number;
  hipCm: number;
  /** Shoulder width across the back, centimetres. */
  shoulderCm: number;
  /** Inside leg, centimetres. */
  inseamCm: number;
  /** True where the number came from the customer rather than the model. */
  measured: { waist: boolean };
}

export const MEASUREMENT_LIMITS = {
  heightCm: [140, 210] as [number, number],
  weightKg: [40, 160] as [number, number],
  jeansWaistIn: [26, 46] as [number, number],
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const IN = 2.54;

export function validateMeasurements(m: Partial<Measurements>): string[] {
  const errors: string[] = [];
  const [hLo, hHi] = MEASUREMENT_LIMITS.heightCm;
  const [wLo, wHi] = MEASUREMENT_LIMITS.weightKg;
  if (!m.heightCm || m.heightCm < hLo || m.heightCm > hHi) {
    errors.push(`Enter a height between ${hLo} and ${hHi} cm.`);
  }
  if (!m.weightKg || m.weightKg < wLo || m.weightKg > wHi) {
    errors.push(`Enter a weight between ${wLo} and ${wHi} kg.`);
  }
  if (m.jeansWaistIn != null && m.jeansWaistIn !== 0) {
    const [jLo, jHi] = MEASUREMENT_LIMITS.jeansWaistIn;
    if (m.jeansWaistIn < jLo || m.jeansWaistIn > jHi) {
      errors.push(`Enter a jeans waist between ${jLo} and ${jHi} inches.`);
    }
  }
  return errors;
}

/* ── 1. the body ───────────────────────────────────────────────── */

export function estimateBody(m: Measurements): BodyEstimate {
  const heightCm = clamp(m.heightCm, ...MEASUREMENT_LIMITS.heightCm);
  const weightKg = clamp(m.weightKg, ...MEASUREMENT_LIMITS.weightKg);
  const bmi = weightKg / (heightCm / 100) ** 2;

  // Cylinder scaling: girth ∝ √(mass / height), fitted to male anthropometry.
  const massPerHeight = Math.sqrt(weightKg / heightCm);
  const chestCm = clamp(160 * massPerHeight - 5, 76, 135);

  // Waist rises faster than chest as BMI climbs — extra mass sits at the middle.
  const waistRatio = clamp(0.8 + 0.0075 * (bmi - 20), 0.72, 1.02);
  const estimatedWaistCm = chestCm * waistRatio;

  const measuredWaist = m.jeansWaistIn != null && m.jeansWaistIn > 0;
  const waistCm = measuredWaist
    ? clamp(m.jeansWaistIn! * IN, 60, 125)
    : clamp(estimatedWaistCm, 60, 125);

  // Male hip sits close to chest, pulled toward the waist as BMI rises.
  const hipCm = clamp(0.52 * chestCm + 0.5 * waistCm + 8, 80, 140);

  // Biacromial breadth is a stable fraction of stature (~0.235 in adult men).
  const shoulderCm = clamp(heightCm * 0.235 + (bmi - 22) * 0.18, 36, 54);

  // Inside leg ≈ 0.45 of stature for adult men.
  const inseamCm = clamp(heightCm * 0.452, 62, 95);

  return {
    heightCm,
    weightKg,
    bmi,
    chestCm,
    waistCm,
    hipCm,
    shoulderCm,
    inseamCm,
    measured: { waist: measuredWaist },
  };
}

/* ── 2. ease ───────────────────────────────────────────────────── */

/** Ease bands in centimetres, per area. Wider areas tolerate more ease. */
const EASE_BANDS: Record<string, [number, number, number, number]> = {
  // [tight below, close below, regular below, easy below] — above the last is loose
  chest: [4, 8, 15, 21],
  waist: [1, 5, 13, 20],
  hip: [2, 6, 14, 21],
  thigh: [1, 4, 10, 16],
  shoulder: [-1, 0.5, 2.5, 4.5],
};

export function verdictFor(area: string, easeCm: number): EaseVerdict {
  const band = EASE_BANDS[area] ?? EASE_BANDS.chest;
  if (easeCm < band[0]) return "tight";
  if (easeCm < band[1]) return "close";
  if (easeCm < band[2]) return "regular";
  if (easeCm < band[3]) return "easy";
  return "loose";
}

/** How much ease this customer is asking for, over the regular cut. */
const PREFERENCE_SHIFT: Record<FitPreference, number> = {
  close: -3.5,
  regular: 0,
  easy: 4.0,
};

export interface AreaFit {
  area: "chest" | "waist" | "hip" | "thigh" | "shoulder";
  label: string;
  bodyCm: number;
  garmentCm: number;
  easeCm: number;
  verdict: EaseVerdict;
  /** Plain sentence for the customer. */
  note: string;
}

export interface SizeFit {
  size: string;
  areas: AreaFit[];
  /** Lower is better. Distance from the customer's preferred ease. */
  score: number;
  /** True when no area is tight or loose. */
  wearable: boolean;
}

export interface FitResult {
  recommendedSize: string;
  /** The next size up and down, when they exist, so the customer can judge. */
  alternatives: SizeFit[];
  chosen: SizeFit;
  body: BodyEstimate;
  /** One honest sentence about how confident this is. */
  confidence: string;
  /** Set when the recommendation sits at the edge of the range. */
  caution?: string;
}

const AREA_LABEL: Record<AreaFit["area"], string> = {
  chest: "Chest",
  waist: "Waist",
  hip: "Hip",
  thigh: "Thigh",
  shoulder: "Shoulder",
};

const VERDICT_WORD: Record<EaseVerdict, string> = {
  tight: "tight",
  close: "close",
  regular: "regular",
  easy: "easy",
  loose: "loose",
};

function noteFor(area: AreaFit["area"], verdict: EaseVerdict, easeCm: number): string {
  const cm = `${easeCm >= 0 ? "" : "−"}${Math.abs(easeCm).toFixed(1)} cm`;
  switch (verdict) {
    case "tight":
      return `Only ${cm} of room. This will pull at the ${AREA_LABEL[area].toLowerCase()}.`;
    case "close":
      return `${cm} of room. A close, considered fit.`;
    case "regular":
      return `${cm} of room. Sits the way the piece is cut to sit.`;
    case "easy":
      return `${cm} of room. Comfortable, with a relaxed line.`;
    case "loose":
      return `${cm} of room. This will read loose at the ${AREA_LABEL[area].toLowerCase()}.`;
  }
}

function fitOneSize(row: SizeRow, body: BodyEstimate, preference: FitPreference): SizeFit {
  const areas: AreaFit[] = [];
  const shift = PREFERENCE_SHIFT[preference];

  const pairs: [AreaFit["area"], number | undefined, number][] = [
    ["chest", row.garment.chest, body.chestCm],
    ["waist", row.garment.waist, body.waistCm],
    ["hip", row.garment.hip, body.hipCm],
    ["thigh", row.garment.thigh, body.hipCm * 0.58],
    ["shoulder", row.garment.shoulder, body.shoulderCm],
  ];

  let score = 0;
  for (const [area, garmentCm, bodyCm] of pairs) {
    if (garmentCm == null) continue;
    const easeCm = garmentCm - bodyCm;
    const verdict = verdictFor(area, easeCm);
    areas.push({
      area,
      label: AREA_LABEL[area],
      bodyCm: Math.round(bodyCm * 10) / 10,
      garmentCm,
      easeCm: Math.round(easeCm * 10) / 10,
      verdict,
      note: noteFor(area, verdict, Math.round(easeCm * 10) / 10),
    });

    // The ideal ease for this area is the middle of the "regular" band,
    // moved by how the customer likes to wear things.
    const band = EASE_BANDS[area] ?? EASE_BANDS.chest;
    const ideal = (band[1] + band[2]) / 2 + shift;
    const weight = area === "chest" || area === "waist" ? 1.6 : 1;
    score += weight * Math.abs(easeCm - ideal);
  }

  return {
    size: row.label,
    areas,
    score,
    wearable: areas.every((a) => a.verdict !== "tight" && a.verdict !== "loose"),
  };
}

/**
 * Recommend a size for a product. For trousers a stated jeans waist wins
 * outright — the customer knows their waist better than any model does.
 */
export function recommendSize(
  chart: SizeChart,
  m: Measurements,
  body = estimateBody(m),
): FitResult {
  const scored = chart.rows.map((row) => fitOneSize(row, body, m.preference));

  let chosenIndex: number;
  let confidence: string;

  if (chart.type === "trouser" && body.measured.waist) {
    // Match the stated waist to the nearest label, which is a waist in inches.
    const targetIn = body.waistCm / IN;
    let best = 0;
    let bestDelta = Infinity;
    chart.rows.forEach((row, i) => {
      const labelIn = parseFloat(row.label);
      if (Number.isNaN(labelIn)) return;
      const delta = Math.abs(labelIn - targetIn);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = i;
      }
    });
    chosenIndex = best;
    confidence =
      "Based on the jeans waist you gave us, so this is as accurate as a size recommendation gets without a tape measure.";
  } else {
    chosenIndex = scored.reduce((bi, s, i) => (s.score < scored[bi].score ? i : bi), 0);
    confidence =
      chart.type === "trouser"
        ? "Estimated from your height and weight. Telling us your usual jeans waist would make this more accurate."
        : "Estimated from your height and weight, matched against the finished measurements of the shirt.";
  }

  const chosen = scored[chosenIndex];
  const alternatives = [scored[chosenIndex - 1], scored[chosenIndex + 1]].filter(Boolean) as SizeFit[];

  let caution: string | undefined;
  if (!chosen.wearable) {
    const problem = chosen.areas.find((a) => a.verdict === "tight" || a.verdict === "loose");
    if (problem) {
      caution = `At this size the ${problem.label.toLowerCase()} reads ${VERDICT_WORD[problem.verdict]}. ${
        alternatives.length ? "Have a look at the neighbouring size below." : ""
      }`.trim();
    }
  }
  if (chosenIndex === 0 && chart.rows.length > 1) {
    caution ??= "This is the smallest size we cut. If it reads loose, the piece may simply run large on you.";
  }
  if (chosenIndex === chart.rows.length - 1 && chart.rows.length > 1) {
    caution ??= "This is the largest size we cut in Collection 001.";
  }

  return { recommendedSize: chosen.size, chosen, alternatives, body, confidence, caution };
}

/** Convenience: recommend against a product rather than a bare chart. */
export function recommendForProduct(product: Product, m: Measurements): FitResult {
  return recommendSize(product.sizeChart, m);
}

/* ── the 3D body the trial room scales ─────────────────────────── */

export interface BodyScale {
  /** Metres, for three.js. */
  height: number;
  /** Multiplier on the placeholder body's depth and width at the chest. */
  chestScale: number;
  waistScale: number;
  hipScale: number;
  shoulderScale: number;
  legScale: number;
}

/** Reference mannequin: 178 cm, 74 kg, a size M. */
export const REFERENCE_BODY = estimateBody({
  heightCm: 178,
  weightKg: 74,
  preference: "regular",
});

/** Turn a body estimate into scale factors for the placeholder body mesh. */
export function bodyScale(body: BodyEstimate): BodyScale {
  return {
    height: body.heightCm / 100,
    chestScale: body.chestCm / REFERENCE_BODY.chestCm,
    waistScale: body.waistCm / REFERENCE_BODY.waistCm,
    hipScale: body.hipCm / REFERENCE_BODY.hipCm,
    shoulderScale: body.shoulderCm / REFERENCE_BODY.shoulderCm,
    legScale: body.inseamCm / REFERENCE_BODY.inseamCm,
  };
}

/** Rounded cm → inches, for the size tables. */
export const cmToIn = (cm: number) => Math.round((cm / IN) * 10) / 10;
