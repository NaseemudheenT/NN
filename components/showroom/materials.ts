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

/* ── the palette, pulled warm ────────────────────────────────────
   The first pass was measured off the brand board's flat swatches, and it
   rendered cold: a hall of grey plaster under a white sun. That is not what
   a European stone interior looks like at any hour. Limestone is yellow,
   travertine is pink-beige, and every bounce in a room like this comes off
   a warm surface and arrives warmer still — so the whole set is shifted
   toward amber and the cool is left to the windows, where it belongs.
   The CONTRAST between warm stone and cool daylight is the picture. */
export const PALETTE = {
  anticoWhite: "#e4d9c6",
  travertine: "#d9c9ad",
  warmSand: "#c4ab88",
  sage: "#8e9a7c",
  terracotta: "#a9705a",
  /* dark, warm, and polished — oiled stone, not black marble. Black marble
     reads as a bank lobby; this reads as a floor somebody waxes. */
  stoneFloor: "#2a211a",
  stoneFloorLight: "#5c4a38",
  walnut: "#3f2a1b",
  timber: "#4a3220",
  steel: "#8d8a85",
  black: "#0a0a0a",
  ivory: "#f7f5ef",
  leather: "#6b3f22",
  foliage: "#55603f",
  trunk: "#463a2c",
} as const;

const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);

export function buildMaterials() {
  return {
    /* hand-troweled limewash over stone — the walls of the nave */
    plaster: std({ color: PALETTE.anticoWhite, roughness: 0.92, metalness: 0 }),
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
    /* cognac leather: worn, slightly sheened where hands and backs have been */
    leather: std({ color: PALETTE.leather, roughness: 0.48, metalness: 0.02 }),
    foliage: std({ color: PALETTE.foliage, roughness: 0.88, metalness: 0, flatShading: true }),
    trunk: std({ color: PALETTE.trunk, roughness: 0.92, metalness: 0 }),
      planter: std({ color: "#2a2724", roughness: 0.8, metalness: 0 }),

    /* ── champagne gold, as the board uses it ──────────────────────
       A METAL, not a colour. metalness 1 means it has no diffuse term at
       all: everything you see in it is a reflection, so it goes dull in a
       dark corner and catches fire under a spot — which is the whole reason
       the brand board puts gold on foil, on an engraved button and on lit
       signage and never on a flat fill. Used here on the rails, the door
       furniture and the lettering over the entrance, and nowhere in the
       interface. */
    gold: std({ color: "#c5a059", roughness: 0.28, metalness: 1 }),
    goldDark: std({ color: "#8a6f3c", roughness: 0.42, metalness: 1 }),

    /* Dark oiled stone, laid in large format and polished enough to carry
       the windows down the hall as long warm smears. */
    marble: std({ color: PALETTE.stoneFloor, roughness: 0.2, metalness: 0.06 }),
    marbleLight: std({ color: "#c9b79a", roughness: 0.3, metalness: 0.04 }),

    /* the glass in the entrance doors */
    glass: new THREE.MeshPhysicalMaterial({
      color: "#aebcc4",
      roughness: 0.06,
      metalness: 0,
      transmission: 0.88,
      thickness: 0.04,
      ior: 1.5,
      transparent: true,
      opacity: 0.42,
    }),
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
