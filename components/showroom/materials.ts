import * as THREE from "three";

/**
 * The showroom's materials.
 *
 * Roughness is the only property that actually tells a viewer what something
 * is made of, so these are set from how each surface really behaves rather
 * than from how it should look in one particular light:
 *
 *   limewash plaster   0.95  — chalky, holds no highlight at all
 *   travertine         0.72  — porous stone, a wide dull sheen
 *   honed stone floor  0.28  — polished but not a mirror; takes a reflection
 *   walnut             0.52  — oiled, not lacquered
 *   brushed steel      0.38, metalness 1 — anisotropic in life, so a mid
 *                              roughness is the closest an isotropic
 *                              material gets without a custom shader
 *   wool / cotton      0.88–0.94 — cloth has no specular to speak of
 *
 * Colours are the brand's Mediterranean palette: Antico White, Travertine
 * Cream, Warm Sand Beige, Muted Sage, Dusty Terracotta. Deep Black and Ivory
 * are the identity and stay on the garments and the signage.
 */

export const PALETTE = {
  anticoWhite: "#e9e3d7",
  travertine: "#d8cfbd",
  warmSand: "#c9b79c",
  sage: "#9aa38c",
  terracotta: "#a9705a",
  stoneFloor: "#3a3630",
  stoneFloorLight: "#5a5248",
  walnut: "#4a3626",
  timber: "#6b4e34",
  steel: "#8d8a85",
  black: "#0a0a0a",
  ivory: "#f7f5ef",
  leather: "#5e3a24",
  foliage: "#5d6b4b",
  trunk: "#4c4238",
} as const;

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

export function buildMaterials() {
  return {
    /* hand-troweled limewash — the walls of the nave */
    plaster: std({ color: PALETTE.anticoWhite, roughness: 0.95, metalness: 0 }),
    /* travertine — piers, arch voussoirs, the window reveals */
    stone: std({ color: PALETTE.travertine, roughness: 0.72, metalness: 0 }),
    /* the aisle walls sit in shade and are a warmer, deeper sand */
    sand: std({ color: PALETTE.warmSand, roughness: 0.9, metalness: 0 }),
    /* honed basalt, laid in large format. Polished enough to carry the
       window as a long smear of light down the floor, which is most of
       what makes the hall feel like it has volume. */
    floor: std({ color: PALETTE.stoneFloor, roughness: 0.28, metalness: 0.04 }),
    timber: std({ color: PALETTE.timber, roughness: 0.68, metalness: 0 }),
    walnut: std({ color: PALETTE.walnut, roughness: 0.52, metalness: 0 }),
    steel: std({ color: PALETTE.steel, roughness: 0.38, metalness: 1 }),
    blackMetal: std({ color: "#1a1816", roughness: 0.45, metalness: 0.85 }),
    leather: std({ color: PALETTE.leather, roughness: 0.6, metalness: 0 }),
    foliage: std({ color: PALETTE.foliage, roughness: 0.88, metalness: 0, flatShading: true }),
    trunk: std({ color: PALETTE.trunk, roughness: 0.92, metalness: 0 }),
    planter: std({ color: "#2a2724", roughness: 0.8, metalness: 0 }),
  };
}

export type Materials = ReturnType<typeof buildMaterials>;

/** Cloth. One per garment colour, cached by hex so a rail of six shirts is one material. */
const clothCache = new Map<string, THREE.MeshStandardMaterial>();
export function cloth(hex: string): THREE.MeshStandardMaterial {
  let m = clothCache.get(hex);
  if (!m) {
    m = std({ color: hex, roughness: 0.9, metalness: 0 });
    clothCache.set(hex, m);
  }
  return m;
}

export function disposeMaterials(m: Materials) {
  Object.values(m).forEach((mat) => mat.dispose());
}
