import Image from "next/image";
import type { Product } from "@/lib/catalog/types";

/**
 * A garment, as it is shown.
 *
 * The product's own photograph wins every time it exists. This component's
 * only real job is to make sure that is TRUE — the previous build drew
 * procedural artwork unconditionally and the photographs on the products
 * could never reach a customer at all, which made the whole catalogue of
 * pictures invisible to the people it was taken for.
 *
 * Without a photograph it draws the cloth: the garment's actual colour from
 * the catalogue, with the weave where the catalogue says there is one, lit
 * from the upper left like everything else in this building. It says what is
 * known and does not invent what is not.
 */
export function GarmentImage({
  product,
  sizes,
  priority,
  index = 0,
  className,
}: {
  product: Product;
  sizes?: string;
  priority?: boolean;
  index?: number;
  className?: string;
}) {
  const photo = product.images[index] ?? product.images[0];

  if (photo) {
    return (
      <span className={`plate ${className ?? ""}`}>
        <Image
          src={photo.url}
          alt={photo.alt || `${product.name} — ${product.colour}`}
          fill
          sizes={sizes ?? "(max-width: 760px) 50vw, 25vw"}
          priority={priority}
          className="plate__img"
        />
      </span>
    );
  }

  /* The cloth itself. Stripe colour is drawn only when the catalogue carries
     one, at the pitch a real shirting stripe runs. */
  const weave =
    product.stripe
      ? `repeating-linear-gradient(90deg, transparent 0 9px, ${product.stripe}55 9px 11px)`
      : product.style === "oxford"
        ? "repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 2px, transparent 2px 4px), repeating-linear-gradient(0deg, rgba(0,0,0,.05) 0 2px, transparent 2px 4px)"
        : "none";

  return (
    <span
      className={`plate plate--drawn garment ${className ?? ""}`}
      style={{ background: product.hex }}
      role="img"
      aria-label={`${product.name} in ${product.colour} — photograph to follow`}
    >
      <span className="garment__weave" style={{ backgroundImage: weave }} />
      <span className="garment__light" />
      <span className="garment__fold" />
      <span className="plate__grain" aria-hidden />
    </span>
  );
}
