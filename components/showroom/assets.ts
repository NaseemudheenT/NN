/**
 * Every 3D asset the showroom can use, in one place.
 *
 * Nothing here is required. Each entry names a path under /public/models; if
 * the file is present it is used, and if it is absent the object draws itself
 * procedurally at the correct size in the correct material. That is what lets
 * the site be built, reviewed and launched before the Blender showroom and the
 * CLO 3D garments arrive — and it is why dropping the real files in makes the
 * room photoreal without touching a component.
 *
 * Presence is read from /public/models/manifest.json rather than by requesting
 * each file and catching the 404, so a room full of placeholders costs nothing
 * and logs nothing. Regenerate the manifest with `node scripts/models-manifest.mjs`
 * after adding files.
 */

export const MODEL_ROOT = "/models";
export const HDRI_ROOT = "/hdri";

/** Structure and fixtures, in the order the camera meets them. */
export const ROOM_MODELS = {
  /** The whole room as one shell: floor, walls, ceiling, window reveals. */
  shell: `${MODEL_ROOT}/room/shell.glb`,
  /** Brass-inlaid NN monogram set into the travertine at the entrance. */
  floorMonogram: `${MODEL_ROOT}/room/floor-monogram.glb`,
  /** Tall arched steel-framed windows. */
  windows: `${MODEL_ROOT}/room/windows.glb`,
  /** Walnut service counter. */
  counter: `${MODEL_ROOT}/fixtures/counter.glb`,
  /** Backlit NN wall sign behind the counter. */
  wallSign: `${MODEL_ROOT}/fixtures/wall-sign.glb`,
  /** Brushed-brass garment rail, 1.8 m. */
  rail: `${MODEL_ROOT}/fixtures/rail.glb`,
  /** NN brass hanger. */
  hanger: `${MODEL_ROOT}/fixtures/hanger.glb`,
  /** Low oak table for folded trousers. */
  table: `${MODEL_ROOT}/fixtures/table.glb`,
  /** Matte-black mannequin. */
  mannequin: `${MODEL_ROOT}/fixtures/mannequin.glb`,
  /** Full-length antique-bronze mirror. */
  mirror: `${MODEL_ROOT}/fixtures/mirror.glb`,
  /** Doorway and ivory linen curtain to the fitting room. */
  doorway: `${MODEL_ROOT}/fixtures/doorway.glb`,
  /** Brass picture lamps over the rails. */
  lamp: `${MODEL_ROOT}/fixtures/lamp.glb`,
  /** The concierge behind the counter. */
  concierge: `${MODEL_ROOT}/fixtures/concierge.glb`,
  /** NN embossed shopping bag, sits on the counter. */
  shoppingBag: `${MODEL_ROOT}/props/shopping-bag.glb`,
  /** Folded box with NN tissue paper. */
  box: `${MODEL_ROOT}/props/box.glb`,
} as const;

/** The trial room is a separate, smaller scene. */
export const TRIAL_MODELS = {
  room: `${MODEL_ROOT}/trial/room.glb`,
  curtain: `${MODEL_ROOT}/trial/curtain.glb`,
  mirror: `${MODEL_ROOT}/trial/three-way-mirror.glb`,
  bench: `${MODEL_ROOT}/trial/bench.glb`,
  hooks: `${MODEL_ROOT}/trial/hooks.glb`,
  /** Neutral body, scaled to the visitor's measurements. */
  body: `${MODEL_ROOT}/body.glb`,
} as const;

/** Per-garment models come from the Shopify metafield nn.model_glb. */
export const garmentModel = (handle: string, state: "hanger" | "folded" | "worn" = "hanger") =>
  `${MODEL_ROOT}/garments/${handle}-${state}.glb`;

/** Photographed light for each phase. Falls back to a built-in preset. */
export const HDRI = {
  morning: `${HDRI_ROOT}/morning.hdr`,
  afternoon: `${HDRI_ROOT}/afternoon.hdr`,
  evening: `${HDRI_ROOT}/evening.hdr`,
  night: `${HDRI_ROOT}/night.hdr`,
} as const;

/** drei Environment presets used when no .hdr file is present. */
export const HDRI_FALLBACK_PRESET = {
  morning: "dawn",
  afternoon: "city",
  evening: "sunset",
  night: "night",
} as const;

/* ── which files actually exist ─────────────────────────────────── */

let manifest: Set<string> | null = null;
let hdriManifest: Set<string> | null = null;
let inflight: Promise<Set<string>> | null = null;

/** Load /public/models/manifest.json once. Absent or broken means "nothing yet". */
export async function loadManifest(): Promise<Set<string>> {
  if (manifest) return manifest;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(`${MODEL_ROOT}/manifest.json`, { cache: "force-cache" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { models?: unknown; hdri?: unknown };
      const strings = (v: unknown) =>
        Array.isArray(v) ? v.filter((m): m is string => typeof m === "string") : [];
      manifest = new Set(
        strings(data.models).map((m) => (m.startsWith("/") ? m : `${MODEL_ROOT}/${m}`)),
      );
      hdriManifest = new Set(
        strings(data.hdri).map((m) => (m.startsWith("/") ? m : `${HDRI_ROOT}/${m}`)),
      );
    } catch {
      manifest = new Set();
      hdriManifest = new Set();
    }
    return manifest;
  })();

  return inflight;
}

/** Synchronous check, valid once the manifest has loaded. */
export function hasModel(path: string | undefined | null): boolean {
  if (!path || !manifest) return false;
  return manifest.has(path);
}

/** Whether a photographed .hdr is present for a phase. */
export function hasHdri(path: string | undefined | null): boolean {
  if (!path || !hdriManifest) return false;
  return hdriManifest.has(path);
}

/** Every path the showroom might want, for preloading once real assets land. */
export const ALL_ROOM_PATHS = Object.values(ROOM_MODELS);
export const ALL_TRIAL_PATHS = Object.values(TRIAL_MODELS);
