/**
 * The materials the house is made of.
 *
 * NERO NOREN is a hand-sculpted Mediterranean flagship: troweled lime on
 * thick masonry, Romanesque arches trimmed in fired clay, pale microcement
 * underfoot giving way to dark walnut in the lounges, and heavy timber
 * overhead. Not a white box, and not the austere black-marble palace this
 * file used to describe.
 *
 * Physically based values, not arbitrary ones. Metalness is 1 for metal and 0
 * for everything else, because that is what the parameter means. Roughness
 * comes from how the real surface is finished, and the finishes here are
 * deliberately rough: limewash and Roman clay are among the most matte
 * surfaces in architecture, around 0.95, which is precisely why they hold
 * light like velvet and why a garment in front of one reads so cleanly.
 *
 * ── where the colours come from ────────────────────────────────────────
 * The brand board wins, so every colour here is derived from it rather than
 * invented alongside it:
 *
 *   Antico White, Travertine Cream  ←  Ivory #F7F5EF, warmed with Stone
 *   Warm Sand Beige                 ←  Ivory + Stone + a little Taupe
 *   Muted Sage Green                ←  Olive #3EA639, heavily desaturated
 *   Dark Walnut                     ←  Taupe #6B5E52, deepened
 *   Timber beams                    ←  Taupe toward Charcoal #2E2E2E
 *   Deep shadow                     ←  Deep Black #0A0A0A
 *
 * Terracotta is the one exception and it is a deliberate one. The board's
 * Burgundy #A41F34 has more blue in it than green, so no mixture of board
 * colours can reach fired clay, which needs the opposite. Terracotta is
 * therefore treated exactly as the board treats gold: not a palette colour
 * but a MATERIAL — the colour a clay body turns in a kiln — and it lives
 * here in the materials layer rather than in tokens.css. It is pulled toward
 * Burgundy's hue so it still reads as a cousin of the house red.
 *
 * ── a cream room is mostly dark, but not everywhere ───────────────────
 * Albedo is not luminance. These surfaces are pale, but the lighting rig is
 * a vignette schema: tight beams on the garments, soft walkways, deep shadow
 * in between. Measured against the rig, most of the frame stays genuinely
 * dark — the walkway floor lands near sRGB 19, a wall at mid-height near 33,
 * the timber beams near 2 — and ivory type over any of those is 14:1 or
 * better.
 *
 * The pools are the exception, and it would be wrong to pretend otherwise. A
 * garment under a tight beam in a lit niche reaches about sRGB 206, where
 * ivory type would be 1.45:1, and limewash directly under a cove reaches
 * about 119, where it would be 4.11:1 — under AA. So the room emphatically
 * does NOT guarantee legibility on its own, and no interface text may rely
 * on it. Chrome over the canvas carries its own protection: the walk's scrim
 * for the broad case, and a local shadow on the hero lockup for the case
 * where a bright pool lands behind it. See .nn-walk__hero in styles/glass.css.
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
  /* ═══ THE LIVING WALLS ═══════════════════════════════════════════
     Limewash and Roman clay, both troweled by hand. Roughness is
     pinned near the top of the scale: these finishes have almost no
     specular lobe at all, and that absence is the entire effect. A
     limewash wall rendered at 0.6 roughness looks like paint; at 0.95
     it looks like lime, because the light leaves it diffusely in
     every direction and the surface reads as depth rather than film. */

  /** Warm Sand Beige limewash. The default wall of the house. */
  limewash: { colour: "#d4cdc0", roughness: 0.96, metalness: 0 },
  /** Night: the same wall with the daylight off it, not a darker wall. */
  limewashNight: { colour: "#6a6256", roughness: 0.96, metalness: 0 },

  /** Muted Sage Green Roman clay, for the niche backs and the lounge bay. */
  sage: { colour: "#8b9d80", roughness: 0.95, metalness: 0 },
  sageNight: { colour: "#454f3f", roughness: 0.95, metalness: 0 },

  /** Dusty Terracotta Roman clay, for the deep reveals behind the rails. */
  terracotta: { colour: "#ab6a52", roughness: 0.95, metalness: 0 },
  terracottaNight: { colour: "#5a3729", roughness: 0.95, metalness: 0 },

  /** Antico White troweled stucco — the facade, and the arch soffits. */
  stucco: { colour: "#ece9e0", roughness: 0.93, metalness: 0 },
  stuccoNight: { colour: "#787468", roughness: 0.93, metalness: 0 },

  /* ═══ THE ARCHES ═════════════════════════════════════════════════
     Rich Colonial Brick Red on the archivolts: the band of fired clay
     that frames every opening. Rotated toward orange from the board's
     Burgundy, and slightly less matte than the clay walls because a
     brick trim is usually sealed where a wall is not.               */
  brick: { colour: "#9a4634", roughness: 0.84, metalness: 0 },
  brickNight: { colour: "#52251b", roughness: 0.84, metalness: 0 },
  /** Slurried brick: the facade's brick, washed with thinned lime. */
  brickSlurried: { colour: "#b07a63", roughness: 0.9, metalness: 0 },

  /* ═══ THE FLOOR ══════════════════════════════════════════════════
     Matte microcement on the circulation paths, seamless and almost
     without reflection, running into dark walnut chevron where the
     couture lounges are. Two floors in one room is how a Mediterranean
     house tells you where to walk and where to stay.                */

  /** Honed travertine / microcement path. Pale, warm, matte. */
  microcement: { colour: "#a39d93", roughness: 0.88, metalness: 0 },
  microcementNight: { colour: "#54504a", roughness: 0.88, metalness: 0 },
  /** Travertine, for thresholds, sills and the stair nosings. */
  travertine: { colour: "#c3bcae", roughness: 0.8, metalness: 0 },
  travertineNight: { colour: "#635e55", roughness: 0.8, metalness: 0 },

  /** Dark Walnut chevron parquet. Oiled, so it holds a low sheen. */
  walnutParquet: { colour: "#382e26", roughness: 0.52, metalness: 0 },
  /** The alternate chevron leaf, a shade apart so the pattern reads. */
  walnutParquetAlt: { colour: "#2f261f", roughness: 0.56, metalness: 0 },

  /* ═══ THE CEILING ════════════════════════════════════════════════
     Heavy exposed timber beams over troweled lime. The beams are the
     darkest thing in the room, which is what stops a pale interior
     from feeling like a gallery.                                    */
  timber: { colour: "#262019", roughness: 0.74, metalness: 0 },
  timberNight: { colour: "#171310", roughness: 0.74, metalness: 0 },
  /** The lime soffit between the beams. */
  ceiling: { colour: "#ded7ca", roughness: 0.95, metalness: 0 },
  ceilingNight: { colour: "#6b6659", roughness: 0.95, metalness: 0 },

  /* ═══ JOINERY ════════════════════════════════════════════════════ */
  /** Dark walnut: the counter, the architraves, the table. */
  walnut: { colour: "#3a2f26", roughness: 0.42, metalness: 0 },
  /** Fumed oak, for the table and the bench. */
  oak: { colour: "#54412f", roughness: 0.48, metalness: 0 },

  /* ═══ METAL ══════════════════════════════════════════════════════
     Brushed champagne-gold is the house fitting metal. Against warm
     lime it needs to stay on the cool side of gold or it dissolves
     into the wall — the reason the old black-walled room could carry
     a yellower brass than this one can.                             */
  champagne: { colour: "#c5a059", roughness: 0.32, metalness: 1 },
  champagneBright: { colour: "#d8bb7e", roughness: 0.18, metalness: 1 },
  brass: { colour: "#c9a43a", roughness: 0.26, metalness: 1 },
  brassBright: { colour: "#e0c063", roughness: 0.1, metalness: 1 },
  /** Antique bronze, for the mirror frame. */
  bronze: { colour: "#6b5431", roughness: 0.34, metalness: 1 },
  /** Blackened steel, for the window frames and the grilles. */
  steel: { colour: "#16161a", roughness: 0.38, metalness: 1 },
  /** Brushed stainless, for the entrance portal furniture. */
  brushedSteel: { colour: "#8f9299", roughness: 0.34, metalness: 1 },

  /* ═══ GLASS ══════════════════════════════════════════════════════ */
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
  /** The entrance doors: dark enough that the room is a suggestion
      from the pavement rather than a display. You have to come in. */
  smokedGlass: {
    colour: "#20222a",
    roughness: 0.05,
    metalness: 0,
    transparent: true,
    opacity: 0.55,
    ior: 1.52,
    transmission: 0.62,
  },

  /* ═══ THE FORMS ══════════════════════════════════════════════════
     Matte black mannequins. Against pale lime they now separate on
     their own, so the roughness lift the old black floor needed is
     gone and they are properly matte again.                        */
  mannequin: { colour: "#1a1a1c", roughness: 0.58, metalness: 0 },

  /* ═══ CLOTH ══════════════════════════════════════════════════════
     Sheen is what makes fabric read as fabric: real fibres scatter
     light off their ends at grazing angles, and a material without it
     reads as painted plastic.                                       */
  linen: { colour: "#e8e1d2", roughness: 0.88, metalness: 0, sheen: 0.45, sheenColour: "#fffaf0" },
  cotton: { colour: "#f3f2ee", roughness: 0.72, metalness: 0, sheen: 0.55, sheenColour: "#ffffff" },
  twill: { colour: "#3a3a3d", roughness: 0.82, metalness: 0, sheen: 0.25, sheenColour: "#d8d2c6" },
  /** Burgundy velvet on the fitting-room bench — the board's own red. */
  velvet: { colour: "#5c1f24", roughness: 0.94, metalness: 0, sheen: 0.85, sheenColour: "#b06a70" },

  /* ═══ LIGHT SOURCES ══════════════════════════════════════════════ */
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
  /* No entry for the cove strips. A strip IS a light source, so it must not
     be tone-mapped — otherwise the exposure that makes the room look right
     crushes the emitter to a dull band. They are drawn with a basic material
     and toneMapped={false} in ArchitecturalLighting, which is the correct
     tool; a physically based MaterialSpec is the wrong one and having one
     here only invited somebody to use it. */
} as const satisfies Record<string, MaterialSpec>;

export type MaterialName = keyof typeof MATERIALS;
