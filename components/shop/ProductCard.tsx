"use client";

/**
 * A garment on display.
 *
 * Not an ecommerce tile. The piece stands on a plinth under a light, the way a
 * garment is presented in a showroom, and the card behaves like an object
 * rather than a rectangle:
 *
 *  · it TILTS toward the pointer, with real perspective, so the plinth has a
 *    top and the garment has a front
 *  · the LIGHT follows, because a specular that stays in the middle tells the
 *    eye the surface is flat
 *  · the garment LIFTS off its plinth and casts further, which is the depth
 *    cue that actually reads at a glance
 *  · the detail — fabric, sizes, availability — arrives on approach, so the
 *    grid stays quiet until the customer shows interest in one piece
 *
 * The whole card is one link. A card with four separate tap targets is how
 * customers end up somewhere they did not mean to go.
 */

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { Product } from "@/lib/catalog/types";
import { formatMinor } from "@/lib/money";
import { GarmentArt } from "./GarmentArt";
import { SPRING } from "@/lib/motion";
import { useHasHover, usePrefersReducedMotion } from "@/components/motion/useReducedMotion";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const plate = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  const reduced = usePrefersReducedMotion();
  const canHover = useHasHover();
  const interactive = canHover && !reduced;

  /* the tilt, as springs so it settles rather than snapping back */
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const tiltX = useSpring(rawX, SPRING.magnetic);
  const tiltY = useSpring(rawY, SPRING.magnetic);
  const rotateX = useTransform(tiltY, [-1, 1], [7, -7]);
  const rotateY = useTransform(tiltX, [-1, 1], [-9, 9]);

  const sizesInStock = product.variants.filter((v) => v.available);
  const soldOut = sizesInStock.length === 0;

  const onMove = (event: React.PointerEvent) => {
    if (!interactive) return;
    const el = plate.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const y = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    rawX.set(Math.max(-1, Math.min(1, x)));
    rawY.set(Math.max(-1, Math.min(1, y)));
    // the light follows the pointer across the plinth
    el.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  };

  const onLeave = () => {
    rawX.set(0);
    rawY.set(0);
    setNear(false);
    plate.current?.style.removeProperty("--mx");
    plate.current?.style.removeProperty("--my");
  };

  return (
    <Link
      href={`/product/${product.handle}`}
      className="nn-card"
      onPointerEnter={() => setNear(true)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-near={near}
      aria-label={`${product.name}, ${product.colour}, ${formatMinor(product.priceMinor, product.currency)}${soldOut ? ", sold out" : ""}`}
    >
      {/* ── the plinth ── */}
      <motion.div
        ref={plate}
        className="nn-card__plinth"
        style={interactive ? { rotateX, rotateY, transformPerspective: 900 } : undefined}
      >
        {/* the light this piece stands under */}
        <span className="nn-card__light" aria-hidden="true" />

        {/* the garment, lifted off the surface */}
        <motion.span
          className="nn-card__garment"
          animate={{ y: near && interactive ? -14 : 0, scale: near && interactive ? 1.035 : 1 }}
          transition={SPRING.surface}
        >
          <GarmentArt product={product} className="w-full" />
        </motion.span>

        {/* the shadow it casts on the plinth, which is the depth cue that reads */}
        <motion.span
          className="nn-card__shadow"
          aria-hidden="true"
          animate={{
            scaleX: near && interactive ? 0.82 : 1,
            opacity: near && interactive ? 0.5 : 0.28,
          }}
          transition={SPRING.surface}
        />

        {soldOut ? <span className="nn-card__flag">Sold out</span> : null}
        {priority ? <span className="nn-card__flag nn-card__flag--metal">Featured</span> : null}
      </motion.div>

      {/* ── the label ── */}
      <div className="nn-card__label">
        <div className="nn-card__identity">
          <h3 className="nn-card__name">{product.name}</h3>
          <p className="nn-card__colour">{product.colour}</p>
        </div>
        <p className="nn-tabular nn-card__price">
          {formatMinor(product.priceMinor, product.currency)}
        </p>
      </div>

      {/* the rule that draws on approach */}
      <span className="nn-card__rule" aria-hidden="true" />

      {/* ── the detail, on approach ── */}
      <div className="nn-card__detail" aria-hidden={!near}>
        {product.fabric ? <p className="nn-card__fabric">{product.fabric}</p> : null}
        <p className="nn-card__sizes">
          {soldOut
            ? "Not in stock"
            : `${product.type === "shirt" ? "Sizes" : "Waist"} ${sizesInStock.map((v) => v.size).join(" · ")}`}
        </p>
      </div>
    </Link>
  );
}
