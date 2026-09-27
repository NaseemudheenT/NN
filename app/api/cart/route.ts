/**
 * Mirrors the visitor's bag into a real Shopify cart.
 *
 * The bag on the device is the source of truth for what the customer chose; the
 * Shopify cart is what Shopify can price, tax and turn into an order. This route
 * reconciles the two: it creates a cart the first time, then makes the cart's
 * lines match the bag's on every change.
 *
 * Returns the cart id so the browser can hold onto it. No secrets cross the
 * wire — the Storefront token stays here.
 */

import { addToCart, createCart, getCart, updateCart, type Cart } from "@/lib/shopify";
import { shopifyReady } from "@/lib/env";
import { loadCatalogue } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BagLine {
  handle: string;
  size: string;
  quantity: number;
  variantId?: string;
}

function parseLines(value: unknown): BagLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((l) => {
    if (typeof l !== "object" || l === null) return [];
    const { handle, size, quantity, variantId } = l as Record<string, unknown>;
    if (typeof handle !== "string" || typeof size !== "string") return [];
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0 || q > 99) return [];
    return [{
      handle,
      size,
      quantity: Math.floor(q),
      variantId: typeof variantId === "string" ? variantId : undefined,
    }];
  });
}

export async function POST(req: Request) {
  if (!shopifyReady()) {
    return Response.json(
      {
        error: "not_configured",
        message: "Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN to sync a Shopify cart.",
      },
      { status: 503 },
    );
  }

  let body: { cartId?: unknown; lines?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const wanted = parseLines(body.lines);
  const cartId = typeof body.cartId === "string" ? body.cartId : null;

  // Resolve every line to a real Shopify variant id. A handle and a size the
  // store does not have is dropped rather than failing the whole sync.
  const { products } = await loadCatalogue();
  const variantFor = (line: BagLine): string | null => {
    if (line.variantId?.startsWith("gid://")) return line.variantId;
    const product = products.find((p) => p.handle === line.handle);
    return product?.variants.find((v) => v.size === line.size)?.id ?? null;
  };

  const resolved = wanted.flatMap((line) => {
    const variantId = variantFor(line);
    return variantId ? [{ ...line, variantId }] : [];
  });

  try {
    let cart: Cart | null = cartId ? await getCart(cartId) : null;

    if (!cart) {
      cart = await createCart(resolved.map((l) => ({ variantId: l.variantId!, quantity: l.quantity })));
      return Response.json({ cartId: cart.id, checkoutUrl: cart.checkoutUrl, cart });
    }

    /* reconcile: change what differs, remove what is gone, add what is new */
    const changes: { id: string; quantity: number }[] = [];
    for (const existing of cart.lines) {
      const match = resolved.find((l) => l.variantId === existing.variantId);
      if (!match) changes.push({ id: existing.id, quantity: 0 });
      else if (match.quantity !== existing.quantity) {
        changes.push({ id: existing.id, quantity: match.quantity });
      }
    }
    if (changes.length) cart = await updateCart(cart.id, changes);

    const additions = resolved
      .filter((l) => !cart!.lines.some((existing) => existing.variantId === l.variantId))
      .map((l) => ({ variantId: l.variantId!, quantity: l.quantity }));
    if (additions.length) cart = await addToCart(cart.id, additions);

    return Response.json({ cartId: cart.id, checkoutUrl: cart.checkoutUrl, cart });
  } catch (err) {
    console.error("[cart] sync failed:", err);
    return Response.json(
      { error: "shopify_error", message: err instanceof Error ? err.message : "unknown" },
      { status: 502 },
    );
  }
}

export async function GET(req: Request) {
  if (!shopifyReady()) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }
  const cartId = new URL(req.url).searchParams.get("cartId");
  if (!cartId) return Response.json({ error: "bad_request" }, { status: 400 });

  try {
    const cart = await getCart(cartId);
    return cart ? Response.json({ cart }) : Response.json({ error: "not_found" }, { status: 404 });
  } catch (err) {
    console.error("[cart] lookup failed:", err);
    return Response.json({ error: "shopify_error" }, { status: 502 });
  }
}
