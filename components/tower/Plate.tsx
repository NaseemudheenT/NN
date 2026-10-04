"use client";

import Image from "next/image";
import { PLATES, type PlateId } from "@/lib/tower/plates";

/**
 * One photographic plate of NN Tower.
 *
 * Every view of the building on this site goes through here, so that every
 * view gets the same three things: a blurred placeholder so the frame is
 * never empty, grain, and a vignette.
 *
 * ── why grain ────────────────────────────────────────────────────────
 * The plates are resampled above their native resolution. Resampling
 * leaves smooth, slightly waxy gradients, and the eye reads waxy as
 * computer-generated — which is the exact failure this build exists to
 * avoid. A fine grain puts high-frequency detail back into those
 * gradients. It is the same reason a colourist adds grain to a clean
 * digital negative: without it the image looks synthetic, and with it the
 * same pixels look photographed.
 */
export function Plate({
  id,
  alt,
  priority,
  loading,
  sizes = "100vw",
  className = "",
  grain = true,
}: {
  id: PlateId;
  alt: string;
  priority?: boolean;
  /**
   * Force a fetch for a plate that is mounted but not yet visible.
   *
   * Chrome will not lazy-load an image whose stack is at opacity 0, even
   * with the element squarely in the viewport — which silently left the
   * middle shot of the overture unfetched until its own cut. `eager`
   * fetches it at normal priority from the first frame, without the
   * preload link that `priority` would add and that belongs to the LCP.
   */
  loading?: "eager" | "lazy";
  sizes?: string;
  className?: string;
  grain?: boolean;
}) {
  const p = PLATES[id];
  return (
    <div className={`plate-img ${className}`} data-grain={grain || undefined}>
      <Image
        src={p.src}
        width={p.width}
        height={p.height}
        alt={alt}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : loading}
        placeholder="blur"
        blurDataURL={p.blur}
        className="plate-img__src"
      />
    </div>
  );
}
