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
  /* ── the floor ──────────────────────────────────────────────────
     Nero Marquina: black marble with fine white veining, honed to a
     low sheen rather than a mirror. It is the floor of every serious
     European house, and it is the reason the brand board reads as a
     palace rather than a boutique. High reflectivity is what makes it
     expensive: the gold fittings appear twice, once on the wall and
     once underfoot.                                                */
  marble: { colour: "#141416", roughness: 0.14, metalness: 0 },
  /** The border band, one shade lighter, that frames the entrance. */
  marbleBorder: { colour: "#1d1d20", roughness: 0.18, metalness: 0 },
  /** Honed travertine, kept for window sills and thresholds. */
  travertine: { colour: "#2a2620", roughness: 0.72, metalness: 0 },
  /* ── Carrara ────────────────────────────────────────────────────
     The white marble the Nero Marquina is banded and bordered with.
     Two marbles is the classic European floor: the dark field reads
     as depth, the light band draws the geometry of the room.      */
  carrara: { colour: "#d8d6cf", roughness: 0.16, metalness: 0 },
  carraraVein: { colour: "#b9b7b0", roughness: 0.2, metalness: 0 },

  /* ── the walls ──────────────────────────────────────────────────
     Deep charcoal plaster in daylight, near black at night. Dark
     walls are what let gold read as gold; against cream it reads as
     yellow.                                                        */
  plaster: { colour: "#252423", roughness: 0.92, metalness: 0 },
  plasterNight: { colour: "#111112", roughness: 0.92, metalness: 0 },
  /* ── European limestone ─────────────────────────────────────────
     The dressed stone of the pilasters and the entrance reveal. Pale,
     almost chalky, and completely matte: limestone has no specular
     to speak of, which is exactly why polished metal set against it
     reads as expensive.                                            */
  limestone: { colour: "#6f6a5f", roughness: 0.94, metalness: 0 },
  limestoneNight: { colour: "#3b3830", roughness: 0.94, metalness: 0 },
  /* ── matte architectural concrete ───────────────────────────────
     Board-formed panels between the pilasters, razor-sharp at every
     joint. Slightly cooler than the limestone so the two read as
     different materials rather than two shades of one.             */
  concrete: { colour: "#34353a", roughness: 0.97, metalness: 0 },
  concreteNight: { colour: "#1a1b1f", roughness: 0.97, metalness: 0 },
  /** Coffered ceiling, a touch lighter so the room does not close in. */
  ceiling: { colour: "#1b1b1d", roughness: 0.95, metalness: 0 },

  /* ── joinery ────────────────────────────────────────────────────
     Ebonised walnut: the counter, the architraves, the table. Dark,
     open-grained, oiled rather than lacquered.                     */
  walnut: { colour: "#231810", roughness: 0.38, metalness: 0 },
  /** Fumed oak, for the table and the bench. */
  oak: { colour: "#3a2a1c", roughness: 0.46, metalness: 0 },

  /* ── metal ──────────────────────────────────────────────────────
     Brushed brass for the rails and hangers, polished for the small
     fittings and the inlay. NN gold, at two finishes.              */
  brass: { colour: "#c9a43a", roughness: 0.26, metalness: 1 },
  brassBright: { colour: "#e0c063", roughness: 0.10, metalness: 1 },
  /* ── brushed champagne-gold steel ───────────────────────────────
     The house fitting metal: the garment rails, the hangers, the
     door furniture. Brushed rather than polished, so it holds a soft
     directional highlight instead of a hard one — the difference
     between a rail that looks machined and one that looks plated. */
  champagne: { colour: "#c5a059", roughness: 0.32, metalness: 1 },
  champagneBright: { colour: "#d8bb7e", roughness: 0.18, metalness: 1 },
  /** Antique bronze, for the mirror frame. */
  bronze: { colour: "#6b5431", roughness: 0.34, metalness: 1 },
  /** Blackened steel, for the window frames. */
  steel: { colour: "#16161a", roughness: 0.38, metalness: 1 },
  /** Brushed stainless, for the entrance portal. Cooler than champagne. */
  brushedSteel: { colour: "#8f9299", roughness: 0.34, metalness: 1 },

  /* ── glass ──────────────────────────────────────────────────── */
  glass: {
    colour: "#eef3f6",
    roughness: 0.03,
    metalness: 0,
    transparent: true,
    opacity: 0.16,
    ior: 1.52,
    transmission: 0.93,
  },
  mirror: { colour: "#f4f5f4", roughness: 0.015, metalness: 1 },
  /* ── smoked glass ───────────────────────────────────────────────
     The entrance doors. Dark enough that the showroom is a suggestion
     from the pavement rather than a display, which is the whole point
     of a smoked door: you have to come in to see.                  */
  smokedGlass: {
    colour: "#20222a",
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.55,
    ior: 1.52,
    transmission: 0.62,
  },

  /* ── the forms ──────────────────────────────────────────────────
     Matte black mannequins. Against a black floor they need a lift in
     roughness to separate, or they disappear into it.               */
  mannequin: { colour: "#1a1a1c", roughness: 0.68, metalness: 0 },

  /* ── cloth ──────────────────────────────────────────────────────
     Sheen is what makes fabric read as fabric: real fibres scatter
     light off their ends at grazing angles, and a material without it
     reads as painted plastic.                                       */
  linen: { colour: "#e8e1d2", roughness: 0.88, metalness: 0, sheen: 0.45, sheenColour: "#fffaf0" },
  cotton: { colour: "#f3f2ee", roughness: 0.72, metalness: 0, sheen: 0.55, sheenColour: "#ffffff" },
  twill: { colour: "#3a3a3d", roughness: 0.82, metalness: 0, sheen: 0.25, sheenColour: "#d8d2c6" },
  /** Burgundy velvet on the fitting-room bench. */
  velvet: { colour: "#5c1f24", roughness: 0.94, metalness: 0, sheen: 0.85, sheenColour: "#b06a70" },

  /* ── light sources ──────────────────────────────────────────── */
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
