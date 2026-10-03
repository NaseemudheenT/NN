import * as THREE from "three";
import { surface, type SurfaceMaps } from "@/lib/textures";

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

/**
 * Every surface in the building, textured.
 *
 * ── the change that mattered ─────────────────────────────────────────
 * These were flat colours. A `meshStandardMaterial` with a solid colour on
 * a box reflects light identically at every point of itself, which happens
 * nowhere in the physical world — and that, not the geometry, is why the
 * hall read as a cartoon. Each one now carries three generated maps:
 *
 *   map            colour that varies, because no real material is one colour
 *   normalMap      relief, so light rakes across the surface
 *   roughnessMap   gloss that varies, which is the tell people cannot name
 *
 * `repeat` is set from the surface's real size. A floor nineteen metres
 * across with repeat 1 stretches one tile over the whole room and looks
 * like a photograph of a floor rather than a floor; the values below put a
 * tile at roughly one to two metres on every surface, which is the scale
 * real stone and timber are actually laid at.
 */
export function buildMaterials() {
  const stoneMaps = surface("travertine", PALETTE.travertine, { repeat: 3, strength: 1.1 });
  const plasterMaps = surface("limewash", PALETTE.anticoWhite, { repeat: 2.4, strength: 0.45 });
  const sandMaps = surface("limewash", PALETTE.warmSand, { repeat: 2.2, strength: 0.5 });
  const floorMaps = surface("marble", PALETTE.stoneFloor, { size: 768, repeat: 9, strength: 0.5 });
  const oakMaps = surface("oak", PALETTE.walnut, { repeat: 4, strength: 1.3 });
  const timberMaps = surface("oak", PALETTE.timber, { repeat: 3, strength: 1.2 });
  const leatherMaps = surface("leather", PALETTE.leather, { repeat: 3.4, strength: 1.5 });
  const brassMaps = surface("brass", "#c5a059", { repeat: 2, strength: 0.4 });
  const brassDarkMaps = surface("brass", "#8a6f3c", { repeat: 2, strength: 0.4 });
  const marbleLightMaps = surface("travertine", "#c9b79a", { repeat: 4, strength: 0.8 });

  const textured = (
    maps: SurfaceMaps,
    p: THREE.MeshStandardMaterialParameters,
    normalScale = 1,
  ) =>
    new THREE.MeshStandardMaterial({
      ...p,
      map: maps.map,
      normalMap: maps.normalMap,
      roughnessMap: maps.roughnessMap,
      normalScale: new THREE.Vector2(normalScale, normalScale),
    });

  return {
    /* hand-troweled limewash over stone — the walls of the nave */
    plaster: textured(plasterMaps, { color: "#ffffff", roughness: 1, metalness: 0 }, 0.6),
    /* travertine — piers, arch voussoirs, the window reveals */
    stone: textured(stoneMaps, { color: "#ffffff", roughness: 1, metalness: 0 }, 1.1),
    /* the aisle walls sit in shade and are a warmer, deeper sand */
    sand: textured(sandMaps, { color: "#ffffff", roughness: 1, metalness: 0 }, 0.7),
    /* Nero Marquina, polished: near-black with crisp pale veining, and
       glossier on the veins because calcite takes a finer polish than the
       matrix — which is carried by the roughness map, not guessed at. */
    floor: textured(floorMaps, { color: "#ffffff", roughness: 1, metalness: 0.1 }, 0.5),
    timber: textured(timberMaps, { color: "#ffffff", roughness: 1, metalness: 0 }, 1.1),
    walnut: textured(oakMaps, { color: "#ffffff", roughness: 1, metalness: 0 }, 1.2),
    steel: std({ color: PALETTE.steel, roughness: 0.38, metalness: 1 }),
    blackMetal: std({ color: "#1a1816", roughness: 0.45, metalness: 0.85 }),
    /* cognac leather: pigment deep in the grain, worn off the high points */
    leather: textured(leatherMaps, { color: "#ffffff", roughness: 1, metalness: 0.02 }, 1.4),
    foliage: std({ color: PALETTE.foliage, roughness: 0.88, metalness: 0, flatShading: true }),
    trunk: std({ color: PALETTE.trunk, roughness: 0.92, metalness: 0 }),
    planter: std({ color: "#2a2724", roughness: 0.8, metalness: 0 }),

    /* ── champagne gold, as the board uses it ──────────────────────
       A METAL, not a colour. metalness 1 means no diffuse term at all:
       everything you see in it is a reflection, so it goes dull in a dark
       corner and catches fire under a spot — which is exactly why the
       board puts gold on foil, on an engraved button and on lit signage
       and never on a flat fill. Brushed, so it streaks the way drawn
       metal does. Used on the rails, door furniture and lettering, and
       nowhere in the interface. */
    gold: textured(brassMaps, { color: "#ffffff", roughness: 1, metalness: 1 }, 0.5),
    goldDark: textured(brassDarkMaps, { color: "#ffffff", roughness: 1, metalness: 1 }, 0.5),

    marble: textured(floorMaps, { color: "#ffffff", roughness: 1, metalness: 0.1 }, 0.5),
    marbleLight: textured(marbleLightMaps, { color: "#ffffff", roughness: 1, metalness: 0.04 }, 0.9),

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
