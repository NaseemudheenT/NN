/**
 * NN TOWER — the materials.
 *
 * Measured physical values, not art-directed colours. Each entry is what the
 * real thing does to light: how rough it is, whether it conducts, whether it
 * transmits, and what it does at a grazing angle.
 *
 * ── the brand is the building ────────────────────────────────────────
 * The stone albedos are the brand board's own Stone and Taupe. That is not a
 * decorative choice — a facade carrying the house colours in its actual
 * masonry is why the renders read as NERO NOREN and not as a generic
 * palazzo.
 *
 * ── gold ─────────────────────────────────────────────────────────────
 * There is exactly one gold here and it is `metalness: 1`. The board shows
 * gold only as a physical finish — foil, an engraved button, lit signage —
 * so in 3D it is a conductor with a gold tint and a little roughness, which
 * reflects the room and shifts as you move. A flat `#D4AF37` fill, which
 * the pasted spec asks for, is the one thing the identity forbids.
 */

import * as THREE from "three";
import { surface } from "./textures";

export interface MaterialDef {
  color: string;
  roughness: number;
  metalness: number;
  /** Which generated surface supplies the normal and roughness detail. */
  grain?: string;
  normalScale?: number;
  /** Dielectric transmission, for glass. Implies MeshPhysicalMaterial. */
  transmission?: number;
  ior?: number;
  thickness?: number;
  /** Clear lacquer over wood, or the sheen on polished stone. */
  clearcoat?: number;
  clearcoatRoughness?: number;
  /** Fabric: the soft rim that cloth has and plastic does not. */
  sheen?: number;
  sheenColor?: string;
  sheenRoughness?: number;
  /** Brushed metal is directional. */
  anisotropy?: number;
  anisotropyRotation?: number;
  side?: THREE.Side;
  transparent?: boolean;
  opacity?: number;
}

export const MATERIALS: Record<string, MaterialDef> = {
  /* ── stone ─────────────────────────────────────────────────────── */
  limestone: {
    /* The board's Stone is #b7b1a7, which is the colour of limestone in
       flat daylight. Under a 2700 K dusk key it renders two stops down and
       the building went brown, so the albedo is lifted toward a dressed,
       lighter ashlar and the warmth is left to the lighting where it
       belongs. */
    color: "#cac4b7", roughness: 0.74, metalness: 0.03,
    grain: "limestone", normalScale: 0.85,
  },
  travertine: {
    color: "#cfc7b6", roughness: 0.62, metalness: 0.04,
    grain: "travertine", normalScale: 0.9, clearcoat: 0.12, clearcoatRoughness: 0.6,
  },
  basalt: {
    color: "#2e3033", roughness: 0.58, metalness: 0.05,
    grain: "basalt", normalScale: 0.8,
  },

  /* ── timber ────────────────────────────────────────────────────── */
  oak: {
    // A satin UV lacquer over oak: the clearcoat is the lacquer, and it is
    // why a real parquet floor has a sharp reflection sitting on top of a
    // soft one. Without it, wood renders as cardboard.
    color: "#a87c52", roughness: 0.42, metalness: 0.0,
    grain: "oak", normalScale: 0.7, clearcoat: 0.42, clearcoatRoughness: 0.28,
  },
  parquet: {
    color: "#a87c52", roughness: 0.4, metalness: 0.0,
    grain: "herringbone", normalScale: 0.85, clearcoat: 0.46, clearcoatRoughness: 0.26,
  },
  walnut: {
    color: "#3b2d24", roughness: 0.36, metalness: 0.0,
    grain: "walnut", normalScale: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.3,
  },

  /* ── metal ─────────────────────────────────────────────────────── */
  brushed: {
    color: "#9d9b95", roughness: 0.26, metalness: 0.95,
    grain: "brushed", normalScale: 0.4,
    anisotropy: 0.75, anisotropyRotation: 0,
  },
  steel: {
    color: "#2a2a2c", roughness: 0.44, metalness: 0.82,
    grain: "steel", normalScale: 0.35,
  },
  gold: {
    // Not a colour. A conductor, tinted, lightly worn.
    color: "#c5a059", roughness: 0.22, metalness: 1.0,
    grain: "brushed", normalScale: 0.18, anisotropy: 0.3,
  },

  /* ── glass ─────────────────────────────────────────────────────── */
  glass: {
    color: "#ffffff", roughness: 0.05, metalness: 0.0,
    transmission: 0.92, ior: 1.5, thickness: 1.2,
    side: THREE.DoubleSide,
  },
  /**
   * Window glass that does NOT refract.
   *
   * `transmission` is the expensive one: three.js renders the opaque scene
   * into a second buffer so the material can sample what is behind it. One
   * such material is fine. NN Tower has nine floors of glazing, a rotunda
   * band, a lift shaft, a car, a dome and two doors — and the cost shows up
   * long before any of them look better for it.
   *
   * At a distance a window is not refraction, it is REFLECTION: you see the
   * sky and the street in it, not the room behind. So panes get a thin
   * transparent dielectric with a strong environment response, and true
   * transmission is reserved for the three places you get close enough to
   * look through — the dome, the entrance doors and the lift.
   */
  glasspane: {
    color: "#dfe7ee", roughness: 0.06, metalness: 0.0,
    transparent: true, opacity: 0.26,
    clearcoat: 1.0, clearcoatRoughness: 0.04,
  },

  smartglass: {
    // The L5 styling pods: frosted, switchable, never fully clear.
    color: "#eef2f5", roughness: 0.32, metalness: 0.0,
    transmission: 0.78, ior: 1.46, thickness: 0.9,
    side: THREE.DoubleSide,
  },

  /* ── soft ──────────────────────────────────────────────────────── */
  linen: {
    color: "#cec6b6", roughness: 0.92, metalness: 0.0,
    grain: "linen", normalScale: 1.0,
    sheen: 0.6, sheenColor: "#e8e2d6", sheenRoughness: 0.8,
  },
  leather: {
    color: "#6b5e52", roughness: 0.56, metalness: 0.0,
    grain: "leather", normalScale: 1.3, clearcoat: 0.18, clearcoatRoughness: 0.55,
  },

  /* ── applied finishes ──────────────────────────────────────────── */
  plaster: {
    color: "#e6e1d7", roughness: 0.84, metalness: 0.0,
    grain: "plaster", normalScale: 0.45,
  },
  concrete: {
    color: "#35363a", roughness: 0.8, metalness: 0.02,
    grain: "concrete", normalScale: 0.75,
  },
  microcement: {
    color: "#eeebe5", roughness: 0.32, metalness: 0.0,
    grain: "microcement", normalScale: 0.3, clearcoat: 0.25, clearcoatRoughness: 0.4,
  },
};

const built = new Map<string, THREE.Material>();

/**
 * Build a material once and keep it.
 *
 * Every wall on a floor shares one material instance, which is what lets the
 * renderer batch them. Creating a material per mesh is the most common way a
 * scene like this quietly drops to twenty frames a second.
 */
export function material(name: string): THREE.Material {
  const hit = built.get(name);
  if (hit) return hit;

  const def = MATERIALS[name] ?? MATERIALS.plaster;
  const grain = def.grain ? surface(def.grain) : null;

  const params: THREE.MeshPhysicalMaterialParameters = {
    color: new THREE.Color(def.color).convertSRGBToLinear(),
    roughness: def.roughness,
    metalness: def.metalness,
    side: def.side ?? THREE.FrontSide,
  };

  if (grain) {
    params.normalMap = grain.normalMap;
    params.normalScale = new THREE.Vector2(def.normalScale ?? 1, def.normalScale ?? 1);
    params.roughnessMap = grain.roughnessMap;
  }
  if (def.transmission !== undefined) {
    params.transmission = def.transmission;
    params.ior = def.ior ?? 1.5;
    params.thickness = def.thickness ?? 1;
    params.transparent = true;
  }
  if (def.clearcoat !== undefined) {
    params.clearcoat = def.clearcoat;
    params.clearcoatRoughness = def.clearcoatRoughness ?? 0.3;
  }
  if (def.sheen !== undefined) {
    params.sheen = def.sheen;
    params.sheenColor = new THREE.Color(def.sheenColor ?? "#ffffff").convertSRGBToLinear();
    params.sheenRoughness = def.sheenRoughness ?? 0.6;
  }
  if (def.anisotropy !== undefined) {
    params.anisotropy = def.anisotropy;
    params.anisotropyRotation = def.anisotropyRotation ?? 0;
  }
  if (def.opacity !== undefined) {
    params.opacity = def.opacity;
    params.transparent = true;
  }
  if (def.transparent) params.transparent = true;
  // A pane with no transmission still has to reflect the sky hard, or it
  // reads as tinted cellophane rather than as glass.
  if (name === "glasspane") params.envMapIntensity = 2.6;

  const m = new THREE.MeshPhysicalMaterial(params);
  m.name = name;
  built.set(name, m);
  return m;
}

/**
 * Warm light coming out of a window, as a material.
 *
 * Emissive, unlit, and deliberately above 1.0 so the bloom pass has something
 * to catch. This is how a lit window at dusk is done: the glow is the
 * renderer's, not a painted halo.
 */
export function lit(kelvin: number, strength: number): THREE.Material {
  const key = `lit:${kelvin}:${strength.toFixed(2)}`;
  const hit = built.get(key);
  if (hit) return hit;
  const m = new THREE.MeshBasicMaterial({
    color: kelvinToColor(kelvin).multiplyScalar(strength),
    toneMapped: false, // let it clip into the bloom threshold on purpose
  });
  m.name = key;
  built.set(key, m);
  return m;
}

/**
 * Colour temperature → linear RGB.
 *
 * A Planckian approximation, because "warm light" has an actual value: 2700 K
 * is a filament, 3000 K is a shop downlight, 5000 K is the daylight-balanced
 * light a fitting room needs so a customer sees the true colour of a navy
 * jacket. Those differences per floor are most of what makes an interior read
 * as designed rather than decorated.
 */
export function kelvinToColor(k: number): THREE.Color {
  const t = k / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  const c = (v: number) => Math.min(1, Math.max(0, v / 255));
  return new THREE.Color(c(r), c(g), c(b)).convertSRGBToLinear();
}

export function disposeMaterials() {
  for (const m of built.values()) m.dispose();
  built.clear();
}
