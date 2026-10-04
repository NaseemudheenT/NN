/**
 * NN TOWER — the plates.
 *
 * Six photographic views of the building, cut from the founder's render
 * boards by scripts/extract-tower-plates.py. This file is GENERATED
 * alongside them; edit the script, not this.
 *
 * ── why these are photographs and not geometry ───────────────────────
 * A browser cannot ray-trace limestone. Everything it can draw with
 * polygons at sixty frames a second looks like a game, and the one thing
 * this building must never look like is a game. So the tower is rendered
 * once, offline, at full quality — and the website composites those
 * renders in depth, which is how film has faked architecture since 1927.
 *
 * ── on the sizes ─────────────────────────────────────────────────────
 * Each plate is twice the pixels of its source crop, resampled with
 * Lanczos and lightly sharpened. That is the honest ceiling of what the
 * source boards contain, and it is why nothing in the interface blows a
 * plate up much past 1.5x of the width below. If the boards are ever
 * re-exported larger, re-run the script and these numbers grow on their
 * own — no component needs to change.
 */

export interface Plate {
  src: string;
  width: number;
  height: number;
  /** A 20px blur of the plate, inlined, so the frame is never empty. */
  blur: string;
}

export const PLATES = {
  facade: {
    src: "/assets/tower/facade.webp",
    width: 922,
    height: 766,
    blur:
      "data:image/webp;base64,UklGRtoAAABXRUJQVlA4IM4AAADQBQCdASoUABEAPsFWoU2npKKiKAqo8BgJZACdMusCrb5g3gXBsVhZbfDqQ1hzzvlWnAc4DmGAAP7kIag6Pq9gfI8Xzw2P3Vj8hclrnmSEnjSq7oyR2B2HVGkwc8ev82Qat7THmVKQR9b/uID6Wdrcyyb3YmzyE07VVhXdUKc14g0kRZVW+aR4st9SwX+9H1wphZ6s8fBNoMWAaM8gyrSmowY4LmIy/Ya9g5luEFeYqf52nopgFuHGkzlIfr1KGJlo4mnB0hEdhnag3+IAAA==",
  },
  street: {
    src: "/assets/tower/street.webp",
    width: 996,
    height: 608,
    blur:
      "data:image/webp;base64,UklGRpwAAABXRUJQVlA4IJAAAABQBACdASoUAAwAPsFOoUqnpCMhsAgA8BgJQBOmUABn98nBLzxFmCamTc1gAP2ySxx/JTvuv8bTAvRjgfgaDVswOu+vs4W+TsMATj9qQzzxXS4VEMlAppESSVhJExG7UGOLyJnHYHMRBWopgdweR1GWhYYyJcUEnJKnP77qKUgSYPMDGgMIAVahApvViTYAAAA=",
  },
  cutaway: {
    src: "/assets/tower/cutaway.webp",
    width: 1116,
    height: 1184,
    blur:
      "data:image/webp;base64,UklGRqwAAABXRUJQVlA4IKAAAADQBACdASoTABQAPsFYpU6npKMiKAgA8BgJQBlEEnwXAYKdUQQ+L+dVijBRtWM4AAD+9pHObn10mSUj6zn3Dyj4SiCfCSf0JgRZcqyzoInTm1loiIWeFU435WKn/8kRr9ICL6KWQKzSOvU3/zcDzx9lMtk3ghBg7de5I4d3DZ2671GUnEsPimlNGNCK+klFudI63S2XJybqUalVbGzfAAAA",
  },
  aerial: {
    src: "/assets/tower/aerial.webp",
    width: 690,
    height: 590,
    blur:
      "data:image/webp;base64,UklGRt4AAABXRUJQVlA4INIAAAAQBQCdASoUABEAPsFapk6npSOiKAgA8BgJQBYdu4FvSlPMqareGSZ81KKc216bUQrAAP7vYskllfkI523fbKMVt5J+8H+1u/LKyXfR7OkBL02mXPPCWBlNflMsO1mbUsTFV8IpFrTN9xkQ0ppUXwGAxu4WfmXWMgF580KVQwF94R7+wy75ZH0v6P83MUgj6ZmURsNeSKgKrXrQ/pdVYR7ceWGit8lgCmu5uNaT0fCVRYsGELXEVArcfMBHMT30esEjpQH4iM0rUsXPBxDO2sAAAAA=",
  },
  rear: {
    src: "/assets/tower/rear.webp",
    width: 680,
    height: 766,
    blur:
      "data:image/webp;base64,UklGRsIAAABXRUJQVlA4ILYAAABQBQCdASoSABQAPsFUoEynpKMiKA1Q8BgJQBdgMY7OM5AMj6PnmkJGDDM9mnjvNKQjEnAA/s1hojGNgrfrNDVh/+oiVewYrlrSddvN+d79bj8V2Oj2iPZ4ltv3P9seW93qdh47iRdCaqfvG0g8mDBlZ1DQyCbCRGETefG4TVkXz8iZpmPHja0X+GS/YUsQbcfLYjcAPwj6bNbUiKHnCxxpGSGNaEyfGSQYUJjiHwHyHS3nTiQAAA==",
  },
  hall: {
    src: "/assets/tower/hall.webp",
    width: 1030,
    height: 600,
    blur:
      "data:image/webp;base64,UklGRoIAAABXRUJQVlA4IHYAAAAQBACdASoUAAwAPsFOoEqnpCMhsAgA8BgJZQCdABwv40K39S0JD6KAAAD+8YCA3W0OUMtY/m1m/cM7h9e7x9E7iX4quBPGqd1mbs0Q4i8UfLwE0ZEuaDa2ZlY1z3CxaJMJjA4F3WHmtrHJdfg4u4PeDPKyuAAA",
  },
} as const satisfies Record<string, Plate>;

export type PlateId = keyof typeof PLATES;
