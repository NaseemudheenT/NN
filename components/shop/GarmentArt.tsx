"use client";

/**
 * The garment drawings, ported from /reference/nero-noren.html.
 *
 * These are honest placeholders: a real drawing of the cut, in the real cloth
 * colour, with the real collar shape and the real number of buttons. They carry
 * the collection until photography and the CLO 3D garment .glb files arrive,
 * and they keep working on any device, at any connection speed, with 3D off.
 *
 * The stripe is a woven pattern at the true 1.6 mm repeat, not a decoration.
 */

import { useId } from "react";
import type { Product } from "@/lib/catalog/types";

type ArtProduct = Pick<Product, "type" | "style" | "hex" | "title"> & { stripe?: string };

export function ShirtArt({ product, className = "" }: { product: ArtProduct; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const fill = product.stripe ? `url(#${uid}p)` : product.hex;
  const isOxford = product.style === "oxford";

  const body =
    "M62 28 L82 18 L100 26 L118 18 L138 28 L174 48 L190 122 L167 128 L157 82 L158 222 L42 222 L43 82 L33 128 L10 122 L26 48 Z";

  return (
    <svg viewBox="0 0 200 232" className={className} role="img" aria-label={product.title}>
      <defs>
        {product.stripe ? (
          <pattern id={`${uid}p`} width="7" height="10" patternUnits="userSpaceOnUse">
            <rect width="7" height="10" fill={product.hex} />
            <rect width="1.6" height="10" fill={product.stripe} />
          </pattern>
        ) : null}
        {/* cloth shading: light falls from the left, the right side turns away */}
        <linearGradient id={`${uid}g`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".10" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".08" />
          <stop offset="1" stopColor="#000" stopOpacity=".16" />
        </linearGradient>
      </defs>

      <path d={body} fill={fill} stroke="rgba(0,0,0,.28)" strokeWidth="1.2" />
      <path d={body} fill={`url(#${uid}g)`} />

      {/* placket */}
      <path d="M100 44 V222" stroke="rgba(0,0,0,.22)" strokeWidth="1" />

      {/* NN engraved buttons */}
      {[64, 94, 124, 154, 184, 210].map((y) => (
        <circle
          key={y}
          cx="100"
          cy={y}
          r="2.3"
          fill="rgba(255,255,255,.75)"
          stroke="rgba(0,0,0,.3)"
          strokeWidth=".6"
        />
      ))}

      {/* the Oxford carries a chest pocket; the Poplin does not */}
      {isOxford ? (
        <path d="M122 66 h20 v22 h-20 z" fill="none" stroke="rgba(0,0,0,.2)" />
      ) : null}

      {/* armhole seams */}
      <path d="M26 48 L43 82 M174 48 L157 82" stroke="rgba(0,0,0,.14)" />

      {/* collar: button-down on the Oxford, spread on the Poplin */}
      {isOxford ? (
        <>
          <path
            d="M80 20 L100 46 L120 20 L113 15 L100 31 L87 15 Z"
            fill={product.hex}
            stroke="rgba(0,0,0,.28)"
            strokeWidth="1.2"
          />
          <circle cx="88" cy="34" r="2" fill="rgba(0,0,0,.35)" />
          <circle cx="112" cy="34" r="2" fill="rgba(0,0,0,.35)" />
        </>
      ) : (
        <path
          d="M78 21 L100 44 L122 21 L116 13 L100 29 L84 13 Z"
          fill={product.hex}
          stroke="rgba(0,0,0,.28)"
          strokeWidth="1.2"
        />
      )}
    </svg>
  );
}

export function TrouserArt({ product, className = "" }: { product: ArtProduct; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const leg = "M54 22 H146 L152 232 H108 L100 92 L92 232 H48 Z";

  return (
    <svg viewBox="0 0 200 240" className={className} role="img" aria-label={product.title}>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".14" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".06" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
      </defs>

      <path d={leg} fill={product.hex} stroke="rgba(0,0,0,.28)" strokeWidth="1.2" />
      <path d={leg} fill={`url(#${uid}g)`} />

      {/* waistband */}
      <rect x="54" y="22" width="92" height="15" fill={product.hex} stroke="rgba(0,0,0,.3)" strokeWidth="1.2" />
      <rect x="54" y="22" width="92" height="15" fill="rgba(0,0,0,.08)" />

      {/* belt loops */}
      {[66, 90, 110, 134].map((x) => (
        <rect
          key={x}
          x={x - 2}
          y="20"
          width="4"
          height="19"
          fill={product.hex}
          stroke="rgba(0,0,0,.25)"
          strokeWidth=".8"
        />
      ))}

      <path d="M100 37 V78" stroke="rgba(0,0,0,.28)" />
      <circle cx="100" cy="29.5" r="2.2" fill="rgba(0,0,0,.35)" />

      {/* pressed crease down each leg */}
      <path d="M70 37 L70 232 M130 37 L130 232" stroke="rgba(255,255,255,.12)" />

      {/* slanted front pockets */}
      <path d="M62 38 Q70 54 80 48 M138 38 Q130 54 120 48" fill="none" stroke="rgba(0,0,0,.25)" />

      {/* the single forward pleat, on the Pleated Trouser only */}
      {product.style === "pleat" ? (
        <path d="M76 37 L78 70 M124 37 L122 70" stroke="rgba(0,0,0,.3)" strokeWidth="1.2" />
      ) : null}
    </svg>
  );
}

/** Whichever drawing suits the piece. */
export function GarmentArt({ product, className = "" }: { product: ArtProduct; className?: string }) {
  return product.type === "shirt" ? (
    <ShirtArt product={product} className={className} />
  ) : (
    <TrouserArt product={product} className={className} />
  );
}

/** A shirt over a trouser, for the outfit builder. */
export function OutfitArt({
  shirt,
  trouser,
  className = "",
}: {
  shirt: ArtProduct;
  trouser: ArtProduct;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`} role="img" aria-label={`${shirt.title} with ${trouser.title}`}>
      <TrouserArt product={trouser} className="absolute inset-x-0 bottom-0 w-full" />
      <ShirtArt product={shirt} className="relative w-full" />
    </div>
  );
}
