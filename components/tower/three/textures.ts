/**
 * NN TOWER — surfaces, generated.
 *
 * There are no texture files in this project and there will not be: a
 * photographed limestone tile tiles visibly, costs a megabyte, and still only
 * ever looks like one piece of limestone. These are generated instead —
 * fractal noise shaped per material, then differentiated into a normal map.
 *
 * ── why a normal map matters more than a colour map ──────────────────
 * The eye reads a surface as real from how light moves across it, not from
 * its colour. A flat grey box with a correct normal map reads as poured
 * concrete; a photographed concrete colour map on a flat normal reads as
 * wallpaper of concrete. So every material here gets height-derived normals
 * and a roughness map, and most of them do not get a colour map at all —
 * the base colour is a single measured value, the way a real material
 * actually has one.
 *
 * ── why it is cheap ──────────────────────────────────────────────────
 * Generated once, at 512², cached for the life of the page, on the main
 * thread during a frame the user is still reading the loading state in.
 * Eleven materials cost about 30 ms total and zero network.
 */

import * as THREE from "three";
import { MARK_PATH } from "@/components/brand/Monogram";

/* ── noise ─────────────────────────────────────────────────────────── */

/** Deterministic hash → [0,1). Same seed, same wall, every reload. */
function hash2(x: number, y: number, seed: number): number {
  let h = x * 374761393 + y * 668265263 + seed * 1442695040888963407;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Value noise with bilinear interpolation across a wrapping lattice. */
function valueNoise(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const w = (a: number) => ((a % period) + period) % period; // wrap, so it tiles
  const a = hash2(w(xi), w(yi), seed);
  const b = hash2(w(xi + 1), w(yi), seed);
  const c = hash2(w(xi), w(yi + 1), seed);
  const d = hash2(w(xi + 1), w(yi + 1), seed);
  return (a * (1 - xf) + b * xf) * (1 - yf) + (c * (1 - xf) + d * xf) * yf;
}

/**
 * Fractal Brownian motion — the octave stack that makes noise look natural.
 *
 * One octave is a blurry blob. Real surfaces have detail at every scale at
 * once: the slab, the pit, the grain. Each octave doubles the frequency and
 * takes roughly half the amplitude, which is the same self-similar falloff
 * weathering actually produces.
 */
function fbm(
  x: number,
  y: number,
  opts: { octaves: number; freq: number; gain?: number; lacunarity?: number; seed?: number },
): number {
  const { octaves, freq, gain = 0.5, lacunarity = 2, seed = 1 } = opts;
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let f = freq;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x * f, y * f, Math.max(1, Math.round(f)), seed + o * 97) * amp;
    norm += amp;
    amp *= gain;
    f *= lacunarity;
  }
  return sum / norm;
}

/* ── turning height into a normal map ──────────────────────────────── */

/**
 * Sobel the height field into a tangent-space normal map.
 *
 * This is the step that actually produces the lighting response. `strength`
 * is in height-units per texel: too low and the surface is glassy, too high
 * and it reads as a relief carving of itself.
 */
function normalFromHeight(height: Float32Array, size: number, strength: number): ImageData {
  const out = new ImageData(size, size);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1));
      const dy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1));
      let nx = dx * strength;
      let ny = dy * strength;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      const i = (y * size + x) * 4;
      out.data[i] = (nx * 0.5 + 0.5) * 255;
      out.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      out.data[i + 2] = (nz / len) * 255;
      out.data[i + 3] = 255;
    }
  }
  return out;
}

/**
 * Texel density, in tiles per metre.
 *
 * ExtrudeGeometry emits UVs in WORLD UNITS, not 0–1 — a 24 m wall has UVs
 * running 0 to 24. So `repeat` here is not "how many times across the
 * surface", it is "tiles per metre", and the first version of this file got
 * that backwards: a repeat of 3 put seventy-two limestone tiles across one
 * elevation, which at any real viewing distance is grey noise rather than
 * masonry. Each value below is 1 / (the size in metres that one tile of
 * this texture should cover).
 */
function toTexture(data: ImageData, srgb: boolean, repeat: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = data.width;
  c.height = data.height;
  c.getContext("2d")!.putImageData(data, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  // Colour maps are authored in sRGB; normal and roughness maps carry data,
  // not colour, and must stay linear or the lighting maths is wrong.
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

function greyData(src: Float32Array, size: number, lo: number, hi: number): ImageData {
  const out = new ImageData(size, size);
  for (let i = 0; i < src.length; i++) {
    const v = Math.round((lo + src[i] * (hi - lo)) * 255);
    const j = i * 4;
    out.data[j] = out.data[j + 1] = out.data[j + 2] = v;
    out.data[j + 3] = 255;
  }
  return out;
}

/* ── the surfaces ──────────────────────────────────────────────────── */

const SIZE = 512;

export interface Surface {
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  /** Normal strength as a Vector2, applied on the material. */
  normalScale: number;
}

type Shaper = (x: number, y: number) => number;

/** Each material is a height function. That is the whole description. */
const SHAPERS: Record<string, { height: Shaper; bump: number; roughLo: number; roughHi: number; repeat: number }> = {
  /* Ashlar: blocky courses with a coarse open pore between them. */
  limestone: {
    height: (x, y) => {
      const course = Math.floor(y * 8);
      // every other course offset by half a block, like real coursed masonry
      const stagger = course % 2 === 0 ? 0 : 0.5;
      const bx = (x * 4 + stagger) % 1;
      const by = (y * 8) % 1;
      /* A dressed ashlar joint is a 6 mm line, not a 20 mm brick bed. The
         first version cut it four times too deep and the facade came back
         looking like red brick under warm light. */
      const joint = Math.min(
        Math.min(bx, 1 - bx) * 46,
        Math.min(by, 1 - by) * 46,
        1,
      );
      const pore = fbm(x, y, { octaves: 5, freq: 48, seed: 11 });
      return joint * 0.78 + pore * 0.22;
    },
    bump: 1.25, roughLo: 0.66, roughHi: 0.84, repeat: 0.208,
  },

  /* Travertine: horizontal vein structure with real pits punched through it. */
  travertine: {
    height: (x, y) => {
      const vein = fbm(x * 0.35, y * 3.4, { octaves: 4, freq: 14, seed: 23 });
      const pit = fbm(x, y, { octaves: 3, freq: 70, seed: 31 });
      return vein * 0.7 + (pit > 0.72 ? 0.0 : 0.3);
    },
    bump: 1.7, roughLo: 0.54, roughHi: 0.70, repeat: 0.5,
  },

  /* Oak: rings running one way, pores scattered along them. */
  oak: {
    height: (x, y) => {
      const wander = fbm(x * 0.6, y * 0.6, { octaves: 3, freq: 5, seed: 41 }) * 0.22;
      const rings = Math.abs(Math.sin((y * 11 + wander * 7) * Math.PI));
      const pores = fbm(x, y, { octaves: 2, freq: 110, seed: 53 });
      return rings * 0.62 + pores * 0.2 + 0.18;
    },
    bump: 1.1, roughLo: 0.34, roughHi: 0.52, repeat: 0.556,
  },

  /* Walnut: the same idea, tighter and calmer. */
  /* Herringbone parquet.
     A real herringbone floor is a few thousand oak blocks laid at right
     angles to each other in a staggered zig-zag. Modelling them as geometry
     would cost thousands of meshes for a surface people walk on; as a
     height field it costs one texture, and the thing that actually sells it
     — the dark seam between blocks and the grain running at ninety degrees
     on alternate courses — is exactly what a height field is good at. */
  herringbone: {
    height: (x, y) => {
      const B = 11;           // blocks across the tile
      const L = 3;            // a block is 3 units long, 1 wide
      const u = x * B, v = y * B;
      const course = Math.floor(v / L);
      // alternate courses step sideways by half a block and rotate 90 deg
      const flip = (course + Math.floor((u + course * 1.5) / L)) % 2 === 0;
      const bu = flip ? u : v;
      const bv = flip ? v : u;
      const inU = ((bu % L) + L) % L;
      const inV = ((bv % 1) + 1) % 1;
      const seam = Math.min(
        Math.min(inU, L - inU) * 9,
        Math.min(inV, 1 - inV) * 9,
        1,
      );
      // grain runs along the block, so it follows the flip
      const grain = Math.abs(Math.sin((flip ? bv : bu) * 26 * Math.PI)) * 0.2;
      return seam * 0.72 + grain + 0.08;
    },
    bump: 1.0, roughLo: 0.34, roughHi: 0.5, repeat: 0.45,
  },

  walnut: {
    height: (x, y) => {
      const wander = fbm(x * 0.5, y * 0.5, { octaves: 3, freq: 4, seed: 61 }) * 0.15;
      const rings = Math.abs(Math.sin((y * 17 + wander * 6) * Math.PI));
      return rings * 0.5 + fbm(x, y, { octaves: 2, freq: 130, seed: 67 }) * 0.16 + 0.3;
    },
    bump: 0.85, roughLo: 0.30, roughHi: 0.44, repeat: 0.714,
  },

  /* Basalt: dense, fine, slightly vesicular. */
  basalt: {
    height: (x, y) => fbm(x, y, { octaves: 5, freq: 60, seed: 71 }),
    bump: 1.3, roughLo: 0.50, roughHi: 0.66, repeat: 0.714,
  },

  /* Brushed metal: the streaks ARE the material. Stretched noise, one axis. */
  brushed: {
    height: (x, y) => fbm(x * 220, y * 1.4, { octaves: 2, freq: 1, seed: 83 }),
    bump: 0.5, roughLo: 0.18, roughHi: 0.34, repeat: 1.111,
  },

  steel: {
    height: (x, y) => fbm(x, y, { octaves: 3, freq: 36, seed: 89 }),
    bump: 0.4, roughLo: 0.38, roughHi: 0.50, repeat: 1.0,
  },

  /* Linen: an actual weave — warp and weft crossing. */
  linen: {
    height: (x, y) => {
      const warp = Math.abs(Math.sin(x * Math.PI * 120));
      const weft = Math.abs(Math.sin(y * Math.PI * 120));
      const slub = fbm(x, y, { octaves: 3, freq: 22, seed: 97 });
      return (warp * 0.5 + weft * 0.5) * 0.6 + slub * 0.4;
    },
    bump: 1.5, roughLo: 0.84, roughHi: 0.96, repeat: 1.818,
  },

  /* Leather: pebbled grain, with the creases that follow it. */
  leather: {
    height: (x, y) => {
      const cells = fbm(x, y, { octaves: 4, freq: 34, gain: 0.62, seed: 103 });
      const crease = fbm(x, y, { octaves: 2, freq: 9, seed: 107 });
      return cells * 0.72 + crease * 0.28;
    },
    bump: 1.9, roughLo: 0.48, roughHi: 0.64, repeat: 1.333,
  },

  plaster: {
    height: (x, y) => fbm(x, y, { octaves: 4, freq: 26, seed: 113 }),
    bump: 0.55, roughLo: 0.78, roughHi: 0.90, repeat: 0.345,
  },

  concrete: {
    height: (x, y) => {
      const body = fbm(x, y, { octaves: 5, freq: 18, seed: 127 });
      const air = fbm(x, y, { octaves: 2, freq: 90, seed: 131 });
      return body * 0.8 + (air > 0.78 ? 0 : 0.2);
    },
    bump: 1.2, roughLo: 0.70, roughHi: 0.88, repeat: 0.345,
  },

  microcement: {
    height: (x, y) => fbm(x, y, { octaves: 3, freq: 30, seed: 137 }) * 0.5 + 0.25,
    bump: 0.35, roughLo: 0.26, roughHi: 0.38, repeat: 0.417,
  },
};

const cache = new Map<string, Surface>();

/** Build (once) the normal and roughness maps for a named surface. */
export function surface(name: string): Surface | null {
  if (typeof document === "undefined") return null; // server render: no canvas
  const hit = cache.get(name);
  if (hit) return hit;
  const shaper = SHAPERS[name];
  if (!shaper) return null;

  const h = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      h[y * SIZE + x] = Math.min(1, Math.max(0, shaper.height(x / SIZE, y / SIZE)));
    }
  }

  const made: Surface = {
    normalMap: toTexture(normalFromHeight(h, SIZE, shaper.bump), false, shaper.repeat),
    // Rougher where the surface is lower: pits and joints hold dust and
    // scatter light, high polished faces do not. Inverting the height is a
    // crude model of that and it is strikingly convincing.
    roughnessMap: toTexture(
      greyData(h.map((v) => 1 - v) as Float32Array, SIZE, shaper.roughLo, shaper.roughHi),
      false,
      shaper.repeat,
    ),
    normalScale: 1,
  };
  cache.set(name, made);
  return made;
}

/**
 * The NN monogram, as a texture.
 *
 * Drawn from the SAME path the site's SVG logo uses — `MARK_PATH` out of
 * components/brand/Monogram — rather than re-drawn by eye in canvas calls.
 * The mark is two serif Ns sharing a stem, and the thing that makes it the
 * NERO NOREN mark rather than a generic ligature is the exact angle of that
 * shared diagonal. Approximating it here would put a subtly wrong logo on
 * the front of the building.
 *
 * Returns white-on-transparent so it can be tinted gold, lit as signage, or
 * printed on black canvas banners from one texture.
 */
export function monogramTexture(size = 512): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const hit = markCache.get(size);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  // the viewBox the SVG is authored in: "-12 -6 222 176"
  const [vx, vy, vw, vh] = [-12, -6, 222, 176];
  const scale = (size * 0.82) / Math.max(vw, vh);
  g.translate(size / 2, size / 2);
  g.scale(scale, scale);
  g.translate(-(vx + vw / 2), -(vy + vh / 2));
  g.fillStyle = "#ffffff";
  g.fill(new Path2D(MARK_PATH), "nonzero");
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  markCache.set(size, t);
  return t;
}

const markCache = new Map<number, THREE.Texture>();

export function disposeSurfaces() {
  for (const s of cache.values()) {
    s.normalMap.dispose();
    s.roughnessMap.dispose();
  }
  cache.clear();
}
