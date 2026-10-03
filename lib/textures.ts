/**
 * NERO NOREN — surfaces.
 *
 * ── why this file exists ─────────────────────────────────────────────
 * A `meshStandardMaterial` with a flat colour is a cartoon, and no amount
 * of bloom, depth of field or tone mapping fixes it. What separates a
 * rendering that reads as a photograph from one that reads as a game is
 * almost never the geometry — it is whether each surface VARIES:
 *
 *   NORMAL     the single biggest lever. A flat plane reflects light
 *              identically at every point, which never happens in nature.
 *              Give it relief and stone becomes stone.
 *   ROUGHNESS  the second biggest, and the one most often forgotten. A
 *              uniformly glossy or uniformly matte surface is the clearest
 *              tell of CG there is. Real floors are polished where feet
 *              fall and dull where they do not.
 *   ALBEDO     no real material is one colour. Travertine is a hundred
 *              beiges; oak is a hundred browns.
 *
 * All three are generated here from value noise, at build-adjacent cost —
 * a few milliseconds once, cached forever. No downloads, no CDN, nothing
 * to 404 in production, and nothing that has to be committed as a binary.
 *
 * The normal map is derived from the same height field as the albedo by
 * Sobel differencing, so the bumps you see and the bumps that catch light
 * are the SAME bumps. Generating them independently — which is the easy
 * mistake — gives you a surface whose shading does not match its pattern,
 * and the eye catches that immediately even when it cannot say why.
 */

import * as THREE from "three";

/* ── value noise ─────────────────────────────────────────────────────
   A hash-based lattice with smooth interpolation. Deterministic from a
   seed, so every visitor gets the same stone. */

function hash2(x: number, y: number, seed: number): number {
  let h = x * 374761393 + y * 668265263 + seed * 1274126177;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return (a * (1 - xf) + b * xf) * (1 - yf) + (c * (1 - xf) + d * xf) * yf;
}

/** Fractal noise: several octaves, each finer and fainter than the last. */
function fbm(x: number, y: number, seed: number, octaves = 5, lacunarity = 2.07, gain = 0.5): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i += 1) {
    sum += valueNoise(fx, fy, seed + i * 131) * amp;
    norm += amp;
    amp *= gain;
    fx *= lacunarity;
    fy *= lacunarity;
  }
  return sum / norm;
}

/* ── the surfaces ────────────────────────────────────────────────── */

export type SurfaceKind = "travertine" | "limewash" | "oak" | "marble" | "leather" | "brass";

export interface Sample {
  /** 0–1 height. Drives the normal map AND modulates the albedo. */
  height: number;
  /** 0–1 extra roughness on top of the material's base. */
  rough: number;
  /** 0–1 albedo lightness multiplier. */
  tone: number;
}

/**
 * One sample of a surface.
 *
 * Each material is a different arrangement of the same noise, because that
 * is genuinely what distinguishes them: travertine is isotropic blotches
 * with pits; oak is noise stretched hard along one axis plus rings; marble
 * is a turbulent vein field; leather is cellular; brass is fine
 * unidirectional scratches.
 */
export function sample(kind: SurfaceKind, u: number, v: number): Sample {
  switch (kind) {
    case "travertine": {
      /* Porous stone: broad blotches, with pits punched through by a
         second, sharper field. The pits are what make it travertine
         rather than generic beige. */
      const base = fbm(u * 6, v * 6, 11, 5);
      const pits = fbm(u * 34, v * 34, 29, 3);
      const pit = pits > 0.72 ? (pits - 0.72) * 3.4 : 0;
      return {
        height: THREE.MathUtils.clamp(base * 0.7 - pit, 0, 1),
        rough: 0.55 + base * 0.25 + pit * 0.3,
        tone: 0.86 + base * 0.22,
      };
    }

    case "limewash": {
      /* Hand-troweled: long, soft, directional strokes from stretching the
         noise along one axis, and almost no relief. Limewash is flat; what
         varies is its TONE, which is why a limewashed wall looks alive
         under raking light and a painted one does not. */
      const stroke = fbm(u * 3.1, v * 11, 47, 4);
      const mottle = fbm(u * 9, v * 9, 73, 3);
      return {
        height: stroke * 0.22 + mottle * 0.1,
        rough: 0.86 + mottle * 0.12,
        tone: 0.9 + stroke * 0.16 + mottle * 0.06,
      };
    }

    case "oak": {
      /* ── what was wrong ───────────────────────────────────────
         Evenly spaced rings from a plain sine read as corduroy, not as
         wood. Real timber has three things a sine does not: the ring
         SPACING varies, because a tree grows faster in some years than
         others; the rings arch into "cathedral" figure where the saw cut
         across them; and the open pores of the early wood streak along
         the grain. All three are here. */

      /* Cathedral figure: the ring coordinate is warped by a field that
         varies ALONG the board, which is geometrically what happens when
         a flat-sawn plank cuts obliquely through a cone of rings. */
      const cathedral = fbm(u * 0.8, v * 2.6, 101, 4) * 2.4;

      /* Irregular years: a slow field modulating the ring frequency, so
         some bands are wide and some are tight. */
      const season = fbm(u * 1.4, v * 0.5, 107, 3);
      const freq = 9 + season * 11;

      const phase = (u * freq + cathedral) * Math.PI;
      /* Sharpened: late wood is a narrow dark band, early wood a wide
         pale one — not a symmetrical wave. */
      const ring = Math.pow(Math.abs(Math.sin(phase)), 3.4);

      /* Pores: fine streaks running the length of the grain. */
      const pore = fbm(u * 24, v * 190, 131, 2);
      const pored = pore > 0.62 ? (pore - 0.62) * 2.2 : 0;

      return {
        height: ring * 0.34 + pored * 0.5,
        /* Open pores hold less polish than dense late wood, which is why
           oiled oak is never uniformly glossy. */
        rough: 0.17 + ring * 0.26 + pored * 0.42,
        tone: 0.72 + ring * 0.46 + season * 0.12 - pored * 0.22,
      };
    }

    case "marble": {
      /* ── what was wrong ───────────────────────────────────────
         A ridge function at high frequency gives a dense net of hairline
         cracks, which reads as dried mud. Nero Marquina is the opposite:
         a FEW bold white veins across a near-black ground, with soft grey
         haloes where the calcite bleeds into the stone.

         So: one low-frequency vein family, widened, plus a second fainter
         family crossing it, plus a halo taken from a softer power of the
         same field. */
      /* Veins run mostly ONE way. Marquina is a bedded stone: the calcite
         filled fractures that were broadly parallel, so a vein field with
         no preferred direction reads as crazing, not as marble. */
      const warp = fbm(u * 1.0, v * 2.4, 211, 5) * 2.2;
      const cross = fbm(u * 0.7, v * 1.3, 223, 4) * 1.8;

      /* Narrow. A vein should occupy a few percent of the surface — the
         first pass had them at a third of it and the stone glowed like
         lightning. The exponent is what sets that width, and it has to be
         high. */
      const major = Math.pow(1 - Math.abs(Math.sin((u * 1.3 + warp) * Math.PI)), 11);
      const minor = Math.pow(1 - Math.abs(Math.sin((v * 1.9 + cross) * Math.PI)), 16);
      const vein = Math.min(1, major + minor * 0.5);

      /* The bleed: the same field at a far softer exponent, so a little
         grey spreads either side of every white line. */
      const halo = Math.pow(1 - Math.abs(Math.sin((u * 1.3 + warp) * Math.PI)), 2.8);

      /* Calcite takes a finer polish than the dark matrix, so the stone is
         glossier ON a vein than off it. */
      return {
        height: vein * 0.1,
        rough: 0.17 - vein * 0.11,
        tone: 0.88 + halo * 0.3 + vein * 6.5,
      };
    }

    case "leather": {
      /* ── what was wrong ───────────────────────────────────────
         The relief was right and the colour was flat — brown noise with a
         six percent tonal range, which the eye reads as plastic. Real
         aged leather is MOTTLED: pigment sits deep in the grain valleys
         and wears off the raised cells, so the pattern you see is the
         inverse of the relief, with far more contrast than feels correct
         until you look at a real chair. */
      const cells = fbm(u * 46, v * 46, 307, 3);
      const crease = fbm(u * 5.5, v * 5.5, 311, 4);
      const creased = crease > 0.56 ? (crease - 0.56) * 1.7 : 0;

      /* Broad patination — the lighter bloom across the seat of a chair
         that has been sat in for twenty years. */
      const patina = fbm(u * 2.2, v * 2.2, 317, 3);

      const relief = cells * 0.6 + creased * 0.5;
      return {
        height: relief,
        /* Worn high points are burnished; the valleys stay matte. */
        rough: 0.58 - cells * 0.3 + creased * 0.18,
        /* Inverted against the relief, and ranged far wider than before. */
        tone: 0.6 + (1 - cells) * 0.55 + patina * 0.3 - creased * 0.25,
      };
    }

    case "brass": {
      /* Brushed: scratches that run one way only. Anisotropy proper needs
         a custom shader; stretching the noise 80:1 gets most of the look
         for none of the cost. */
      const brush = fbm(u * 180, v * 2.2, 401, 3);
      const patina = fbm(u * 5, v * 5, 409, 4);
      return {
        height: brush * 0.2,
        rough: 0.18 + brush * 0.22 + patina * 0.14,
        tone: 0.88 + brush * 0.16 + patina * 0.1,
      };
    }
  }
}

/* ── baking ──────────────────────────────────────────────────────── */

export interface SurfaceMaps {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

const cache = new Map<string, SurfaceMaps>();

/**
 * Bake a surface to three textures.
 *
 * The normal map is Sobel-differenced from the SAME height field the albedo
 * is shaded from, so the relief you see and the relief that catches light
 * are one thing. Generating them separately is the easy mistake, and it
 * produces a surface whose shading does not agree with its pattern — the
 * eye catches that instantly even when it cannot name it.
 */
export function surface(
  kind: SurfaceKind,
  colour: string,
  { size = 512, repeat = 1, strength = 1 }: { size?: number; repeat?: number; strength?: number } = {},
): SurfaceMaps {
  const key = `${kind}|${colour}|${size}|${repeat}|${strength}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const base = new THREE.Color(colour);

  const albedo = document.createElement("canvas");
  const normal = document.createElement("canvas");
  const rough = document.createElement("canvas");
  albedo.width = albedo.height = size;
  normal.width = normal.height = size;
  rough.width = rough.height = size;

  const aCtx = albedo.getContext("2d")!;
  const nCtx = normal.getContext("2d")!;
  const rCtx = rough.getContext("2d")!;
  const aImg = aCtx.createImageData(size, size);
  const nImg = nCtx.createImageData(size, size);
  const rImg = rCtx.createImageData(size, size);

  /* The height field is kept so the normal pass can difference it. */
  const height = new Float32Array(size * size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const s = sample(kind, x / size, y / size);
      const i = y * size + x;
      height[i] = s.height;

      const p = i * 4;
      aImg.data[p] = THREE.MathUtils.clamp(base.r * s.tone, 0, 1) * 255;
      aImg.data[p + 1] = THREE.MathUtils.clamp(base.g * s.tone, 0, 1) * 255;
      aImg.data[p + 2] = THREE.MathUtils.clamp(base.b * s.tone, 0, 1) * 255;
      aImg.data[p + 3] = 255;

      const r = THREE.MathUtils.clamp(s.rough, 0, 1) * 255;
      rImg.data[p] = r;
      rImg.data[p + 1] = r;
      rImg.data[p + 2] = r;
      rImg.data[p + 3] = 255;
    }
  }

  /* Sobel, wrapping at the edges so the map tiles without a seam. */
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1));
      const dy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1));

      const n = new THREE.Vector3(dx * strength * 3, dy * strength * 3, 1).normalize();
      const p = (y * size + x) * 4;
      nImg.data[p] = (n.x * 0.5 + 0.5) * 255;
      nImg.data[p + 1] = (n.y * 0.5 + 0.5) * 255;
      nImg.data[p + 2] = (n.z * 0.5 + 0.5) * 255;
      nImg.data[p + 3] = 255;
    }
  }

  aCtx.putImageData(aImg, 0, 0);
  nCtx.putImageData(nImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const make = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
    tex.anisotropy = 8;
    /* Only the albedo is colour. A normal or roughness map read as sRGB is
       silently wrong — the values are vectors and scalars, not colours. */
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const maps: SurfaceMaps = {
    map: make(albedo, true),
    normalMap: make(normal, false),
    roughnessMap: make(rough, false),
  };
  cache.set(key, maps);
  return maps;
}

export function disposeSurfaces() {
  for (const m of cache.values()) {
    m.map.dispose();
    m.normalMap.dispose();
    m.roughnessMap.dispose();
  }
  cache.clear();
}
