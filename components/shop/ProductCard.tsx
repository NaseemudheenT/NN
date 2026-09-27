"use client";

/**
 * A garment in the 2D grid.
 *
 * The 3D motion the showroom does with a camera, the card does with a transform:
 * the plate lifts, the cloth inside it turns a degree and scales, and a gold
 * hairline draws itself along the bottom. It is a real 3D transform with
 * perspective, not a drop shadow pretending to be one.
 */

import Link from "next/link";
import { useRef, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { formatMinor } from "@/lib/money";
import { GarmentArt } from "./GarmentArt";

export function ProductCard({ product }: { product: Product }) {
  const plate = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  /** Tilt toward the pointer — a card lit from where you are standing. */
  const onMove = (e: React.PointerEvent) => {
    const el = plate.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: -py * 8, y: px * 10 });
  };

  return (
    <Link
      href={`/product/${product.handle}`}
      className="group block no-underline"
      style={{ perspective: "900px" }}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div
        ref={plate}
        className="nn-plate grid place-items-center p-[12%] group-hover:border-[var(--accent)]"
        style={{
          background: "var(--paper)",
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${tilt.x || tilt.y ? -6 : 0}px)`,
          boxShadow: tilt.x || tilt.y ? "var(--shadow-plate)" : "none",
        }}
      >
        {/* the cloth */}
        <GarmentArt
          product={product}
          className="w-full transition-transform duration-700 ease-[var(--ease-showroom)] group-hover:scale-[1.045]"
        />

        {/* a sheen that crosses the plate on hover */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(104deg, transparent 38%, color-mix(in srgb, var(--accent) 16%, transparent) 50%, transparent 62%)",
          }}
        />
      </div>

      <div className="flex items-start justify-between gap-4 pt-4">
        <div>
          <h3 className="text-[var(--text-step-1)]">{product.name}</h3>
          <p className="mt-0.5 text-[var(--text-step--1)] tracking-[0.06em] text-[var(--ink-soft)]">
            {product.colour}
          </p>
        </div>
        <p className="nn-tabular shrink-0 text-[var(--text-step--1)] text-[var(--ink-soft)]">
          {formatMinor(product.priceMinor, product.currency)}
        </p>
      </div>
      {/* the gold hairline */}
      <span
        aria-hidden="true"
        className="mt-3 block h-px w-0 bg-[var(--accent)] transition-[width] duration-700 ease-[var(--ease-showroom)] group-hover:w-full"
      />
    </Link>
  );
}
