"use client";

/**
 * A garment, photographed if there is a photograph and drawn if there is not.
 *
 * This is the single most important correctness component in the shop, and it
 * did not exist until now. Eleven places in the site rendered GarmentArt
 * unconditionally — the card, the bag, the drawer, the order summary, the
 * trial room, the stylist's recommendations, the showroom panel, the product
 * page. Not one of them looked at `product.images`.
 *
 * Which meant that the moment the Founder photographed a real Oxford and
 * uploaded it to Shopify, the site would have gone on showing a drawing of
 * one. For a clothing business that is not a cosmetic bug: the customer is
 * buying cloth, the photograph is the only honest description of it, and an
 * illustration standing in for it is a claim about a garment nobody has seen.
 *
 * ── the drawing is still right, until the photograph exists ──────────
 * GarmentArt is not a placeholder to be ashamed of. It is generated from the
 * product's OWN data — its cut, its real cloth colour, its woven stripe — so
 * a seed Oxford in Bianco is drawn as an Oxford in Bianco rather than as a
 * stock image of somebody else's shirt. That is why it stays as the fallback
 * rather than being replaced by a grey box: before the photography exists it
 * is the most truthful thing available, and it never invents a detail the
 * catalogue does not carry.
 *
 * The order of preference is therefore simply: the real thing, then the
 * honest drawing, and never a stock photograph of a garment that is not ours.
 */

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/catalog/types";
import { GarmentArt } from "./GarmentArt";

export function GarmentImage({
  product,
  className = "",
  /** Which photograph. 0 is the primary; the product page cycles the rest. */
  index = 0,
  /** Hint for the image pipeline — the one on screen first should be eager. */
  priority = false,
  /** Rendered width hints, so a thumbnail never downloads a hero. */
  sizes = "(max-width: 768px) 50vw, 320px",
}: {
  product: Product;
  className?: string;
  index?: number;
  priority?: boolean;
  sizes?: string;
}) {
  const photo = product.images?.[index];

  /* A broken image URL must not leave a hole where a garment should be.
     Shopify can return a URL for an asset that has since been deleted, and
     the honest response to that is the drawing — not an alt-text icon in
     the middle of the shop. */
  const [failed, setFailed] = useState(false);

  if (!photo?.url || failed) {
    return <GarmentArt product={product} className={className} />;
  }

  return (
    <div className={`nn-garment ${className}`}>
      <Image
        src={photo.url}
        /* The catalogue's own alt text. Never generated, never "product
           image" — a screen reader should hear what the garment is. */
        alt={photo.alt || `${product.name}, ${product.colour}`}
        fill
        sizes={sizes}
        priority={priority}
        className="nn-garment__photo"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/**
 * Does this product have real photography yet?
 *
 * Exported because some surfaces want to KNOW rather than just render — the
 * owner console can list what still needs shooting, and a layout can choose a
 * portrait crop for a photograph and a square one for the drawing.
 */
export function hasPhoto(product: Product, index = 0): boolean {
  return Boolean(product.images?.[index]?.url);
}
