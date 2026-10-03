"use client";

import Link from "next/link";
import { useState } from "react";
import { GarmentImage } from "./GarmentImage";
import { Heart } from "@/components/ui/icons";
import { formatMinor } from "@/lib/money";
import type { Product } from "@/lib/catalog/types";

/**
 * A piece on the floor.
 *
 * Name, colour, price, and the colours it comes in — in that order, because
 * that is the order a customer asks the questions in. Everything else
 * (fabric, fit, sizes, stock) waits for the product page, where there is room
 * to answer properly.
 *
 * The save control is a real button over a real link, so a keyboard reaches
 * both and neither swallows the other.
 */
export function ProductCard({
  product,
  siblings = [],
  priority,
  sizes,
}: {
  product: Product;
  /** Other colourways of the same cut, for the dots. */
  siblings?: Product[];
  priority?: boolean;
  sizes?: string;
}) {
  const [saved, setSaved] = useState(false);
  const inStock = product.variants.some((v) => v.available);
  const colours = [product, ...siblings];

  return (
    <article className="card">
      <div className="card__frame">
        <Link href={`/product/${product.handle}`} className="card__link" aria-label={`${product.name}, ${product.colour}`}>
          <GarmentImage product={product} priority={priority} sizes={sizes ?? "(max-width: 760px) 50vw, 23vw"} />
        </Link>
        <button
          type="button"
          className="card__save icon-btn"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          onClick={() => setSaved((v) => !v)}
          data-on={saved || undefined}
        >
          <Heart size={17} />
        </button>
        {!inStock ? <span className="card__flag label">Sold out</span> : null}
      </div>

      <div className="card__body">
        <h3 className="card__name">
          <Link href={`/product/${product.handle}`}>{product.name}</Link>
        </h3>
        <p className="card__colour small muted">{product.colour}</p>
        <p className="card__price tnum">{formatMinor(product.priceMinor, product.currency)}</p>
        {colours.length > 1 ? (
          <ul className="card__dots" aria-label="Also in">
            {colours.map((c) => (
              <li key={c.handle}>
                <Link
                  href={`/product/${c.handle}`}
                  className="card__dot"
                  style={{ background: c.hex }}
                  data-on={c.handle === product.handle || undefined}
                  aria-label={c.colour}
                  title={c.colour}
                />
              </li>
            ))}
          </ul>
        ) : (
          <span className="card__dot card__dot--solo" style={{ background: product.hex }} aria-hidden />
        )}
      </div>
    </article>
  );
}
