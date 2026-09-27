/**
 * The materials the room is made of.
 *
 * Physically based values, not arbitrary ones: metalness is 1 for metal and 0
 * for everything else, because that is what the parameter means, and roughness
 * comes from how the real surface is finished — honed travertine is rough,
 * brushed brass much less so, glass barely at all. These are the placeholder
 * materials; a real .glb brings its own.
 */

export interface MaterialSpec {
  colour: string;
  roughness: number;
  metalness: number;
  /** Clearcoat-like sheen for cloth, 0 for everything else. */
  sheen?: number;
  sheenColour?: string;
  /** Emissive strength, for the backlit sign and lamp shades. */
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  /** Index of refraction, for glass. */
  ior?: number;
  transmission?: number;
}

export const MATERIALS = {
  /** Honed travertine: warm, matte, faintly porous. */
  travertine: { colour: "#cfc6b4", roughness: 0.78, metalness: 0 },
  /** Warm limestone plaster on the walls. */
  plaster: { colour: "#d8d1c2", roughness: 0.94, metalness: 0 },
  plasterNight: { colour: "#2a2823", roughness: 0.94, metalness: 0 },
  /** Ceiling, a touch cooler than the walls. */
  ceiling: { colour: "#e2ddd2", roughness: 0.96, metalness: 0 },
  /** European walnut, oiled. */
  walnut: { colour: "#4a3526", roughness: 0.42, metalness: 0 },
  /** White oak, waxed. */
  oak: { colour: "#a87f52", roughness: 0.52, metalness: 0 },
  /** Brushed brass — the rails, the hangers, the inlay. */
  brass: { colour: "#c9a43a", roughness: 0.28, metalness: 1 },
  /** Polished brass for the small fittings. */
  brassBright: { colour: "#d9b85a", roughness: 0.14, metalness: 1 },
  /** Antique bronze, for the mirror frame. */
  bronze: { colour: "#6b5431", roughness: 0.38, metalness: 1 },
  /** Blackened steel window frames. */
  steel: { colour: "#232326", roughness: 0.42, metalness: 1 },
  /** Window glazing. */
  glass: {
    colour: "#eef3f6",
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.18,
    ior: 1.52,
    transmission: 0.92,
  },
  /** Mirror glass. */
  mirror: { colour: "#f2f3f2", roughness: 0.02, metalness: 1 },
  /** The matte-black mannequins. */
  mannequin: { colour: "#141414", roughness: 0.62, metalness: 0 },
  /** Ivory linen, the fitting-room curtain. */
  linen: { colour: "#e8e1d2", roughness: 0.88, metalness: 0, sheen: 0.4, sheenColour: "#fffaf0" },
  /** Cotton shirting — sheen is what makes cloth read as cloth. */
  cotton: { colour: "#f3f2ee", roughness: 0.72, metalness: 0, sheen: 0.55, sheenColour: "#ffffff" },
  /** Trouser twill, denser and less lustrous. */
  twill: { colour: "#3a3a3d", roughness: 0.82, metalness: 0, sheen: 0.25, sheenColour: "#d8d2c6" },
  /** The backlit NN sign face. */
  signFace: {
    colour: "#efe9dd",
    roughness: 0.6,
    metalness: 0,
    emissive: "#c9a43a",
    emissiveIntensity: 1,
  },
  /** Lamp shade, lit from inside. */
  lampShade: {
    colour: "#f0e6cf",
    roughness: 0.7,
    metalness: 0,
    emissive: "#ffd9a0",
    emissiveIntensity: 1,
  },
} as const satisfies Record<string, MaterialSpec>;

export type MaterialName = keyof typeof MATERIALS;
