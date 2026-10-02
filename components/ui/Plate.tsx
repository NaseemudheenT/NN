import Image from "next/image";

/**
 * A surface where a photograph goes.
 *
 * The Founder's photographs are the point of this website, and the moment a
 * `src` exists it is used — full stop, no condition, no "unless". What this
 * component solves is the gap before that: a shop with eight empty grey
 * rectangles where its pictures should be looks broken, and "broken" is the
 * one thing a new label cannot afford to look.
 *
 * So the fallback is not a placeholder. It is a lit material study built
 * from the showroom's own palette — the same travertine, the same warm
 * sand, the same raking light — which means an unphotographed page still
 * belongs to the same building. It is deliberately abstract: inventing a
 * garment that does not exist would be worse than showing none.
 */

export type PlateKind = "stone" | "room" | "cloth" | "detail" | "street";

const RECIPES: Record<PlateKind, { base: string; layers: string }> = {
  /* travertine in raking light */
  stone: {
    base: "#cdc2ae",
    layers: `
      radial-gradient(120% 90% at 22% 8%, rgba(255,247,231,.72) 0%, transparent 56%),
      radial-gradient(90% 120% at 86% 96%, rgba(60,48,36,.5) 0%, transparent 62%),
      repeating-linear-gradient(97deg, rgba(255,255,255,.05) 0 2px, transparent 2px 7px)
    `,
  },
  /* a lit hall seen down its length */
  room: {
    base: "#17140f",
    layers: `
      radial-gradient(46% 72% at 50% 36%, rgba(255,206,142,.56) 0%, rgba(255,186,110,.14) 34%, transparent 70%),
      linear-gradient(180deg, rgba(10,9,8,.86) 0%, transparent 38%, rgba(6,6,6,.9) 100%),
      repeating-linear-gradient(90deg, rgba(10,9,8,.6) 0 9%, rgba(58,48,36,.22) 9% 17%)
    `,
  },
  /* folded cloth under a soft box */
  cloth: {
    base: "#2b2724",
    layers: `
      radial-gradient(80% 100% at 30% 16%, rgba(255,250,240,.3) 0%, transparent 62%),
      repeating-linear-gradient(74deg, rgba(255,255,255,.045) 0 10px, rgba(0,0,0,.05) 10px 22px),
      linear-gradient(200deg, rgba(0,0,0,.4) 0%, transparent 52%)
    `,
  },
  /* hardware on black — a button, a label, foil */
  detail: {
    base: "#111010",
    layers: `
      radial-gradient(42% 42% at 42% 36%, rgba(232,212,164,.46) 0%, rgba(176,141,74,.16) 42%, transparent 70%),
      radial-gradient(120% 100% at 80% 94%, rgba(0,0,0,.72) 0%, transparent 60%)
    `,
  },
  /* a European street at the golden hour */
  street: {
    base: "#2a2219",
    layers: `
      radial-gradient(70% 90% at 72% 26%, rgba(255,198,126,.5) 0%, transparent 58%),
      linear-gradient(180deg, rgba(14,12,10,.5) 0%, transparent 44%, rgba(10,9,8,.88) 100%),
      repeating-linear-gradient(86deg, rgba(0,0,0,.34) 0 6%, transparent 6% 13%)
    `,
  },
};

export function Plate({
  src,
  alt = "",
  kind = "stone",
  priority,
  sizes,
  className,
  ratio,
}: {
  src?: string;
  alt?: string;
  kind?: PlateKind;
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** CSS aspect-ratio, e.g. "3 / 4". */
  ratio?: string;
}) {
  const style = ratio ? { aspectRatio: ratio } : undefined;

  if (src) {
    return (
      <span className={`plate ${className ?? ""}`} style={style}>
        <Image src={src} alt={alt} fill sizes={sizes ?? "100vw"} priority={priority} className="plate__img" />
      </span>
    );
  }

  const r = RECIPES[kind];
  return (
    <span
      className={`plate plate--drawn ${className ?? ""}`}
      style={{ ...style, background: r.base }}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
    >
      <span className="plate__paint" style={{ backgroundImage: r.layers.trim() }} />
      <span className="plate__grain" aria-hidden />
    </span>
  );
}
