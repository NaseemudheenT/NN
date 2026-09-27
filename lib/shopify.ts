/**
 * Shopify Storefront API — the source of truth for products, prices, stock
 * and the cart whenever it is configured.
 *
 * Server only. The Storefront token is read from the environment and never
 * reaches the browser: every call here runs inside a server component or a
 * route handler.
 *
 * NN reads two metafields per product:
 *   nn.model_glb   — path to the garment .glb under /public/models
 *   nn.fit_notes   — the brand's own words on how the piece wears
 *   nn.size_chart  — JSON size chart used by the trial room
 */

import "server-only";
import { env, shopifyReady } from "./env";
import { toMinor } from "./money";
import type { Product, SizeChart, GarmentStyle, GarmentType } from "./catalog/types";
import { SHIRT_CHART, TROUSER_CHART } from "./catalog/seed";

const API_VERSION = "2025-07";

class ShopifyError extends Error {}

async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
  cache: RequestCache = "force-cache",
): Promise<T> {
  if (!shopifyReady()) {
    throw new ShopifyError("Shopify is not configured");
  }
  const res = await fetch(`https://${env.shopifyDomain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": env.shopifyStorefrontToken,
    },
    body: JSON.stringify({ query, variables }),
    cache,
    next: cache === "force-cache" ? { revalidate: 300, tags: ["shopify"] } : undefined,
  });

  if (!res.ok) {
    throw new ShopifyError(`Shopify responded ${res.status}`);
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new ShopifyError(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) throw new ShopifyError("Shopify returned no data");
  return json.data;
}

/* ── fragments ─────────────────────────────────────────────────── */

const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    productType
    tags
    options { name values }
    priceRange { minVariantPrice { amount currencyCode } }
    images(first: 6) { nodes { url altText } }
    variants(first: 25) {
      nodes {
        id
        title
        availableForSale
        price { amount currencyCode }
        selectedOptions { name value }
      }
    }
    modelGlb: metafield(namespace: "nn", key: "model_glb") { value }
    fitNotes: metafield(namespace: "nn", key: "fit_notes") { value }
    sizeChart: metafield(namespace: "nn", key: "size_chart") { value }
    colourHex: metafield(namespace: "nn", key: "colour_hex") { value }
    stripeHex: metafield(namespace: "nn", key: "stripe_hex") { value }
    fabric: metafield(namespace: "nn", key: "fabric") { value }
    care: metafield(namespace: "nn", key: "care") { value }
    bestFor: metafield(namespace: "nn", key: "best_for") { value }
    placement: metafield(namespace: "nn", key: "placement") { value }
  }
`;

const CART_FIELDS = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 50) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price { amount currencyCode }
            product { handle title }
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

/* ── shapes returned by Shopify ────────────────────────────────── */

interface Metafield { value: string | null }
interface RawVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  selectedOptions: { name: string; value: string }[];
}
interface RawProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { nodes: { url: string; altText: string | null }[] };
  variants: { nodes: RawVariant[] };
  modelGlb: Metafield | null;
  fitNotes: Metafield | null;
  sizeChart: Metafield | null;
  colourHex: Metafield | null;
  stripeHex: Metafield | null;
  fabric: Metafield | null;
  care: Metafield | null;
  bestFor: Metafield | null;
  placement: Metafield | null;
}

/* ── mapping Shopify → the NN Product shape ────────────────────── */

/** "The Oxford, Bianco" → { name: "The Oxford", colour: "Bianco" } */
function splitTitle(title: string): { name: string; colour: string } {
  const i = title.lastIndexOf(",");
  if (i === -1) return { name: title.trim(), colour: "" };
  return { name: title.slice(0, i).trim(), colour: title.slice(i + 1).trim() };
}

function inferType(raw: RawProduct): GarmentType {
  const t = `${raw.productType} ${raw.tags.join(" ")}`.toLowerCase();
  if (t.includes("trouser") || t.includes("pant")) return "trouser";
  if (t.includes("shirt")) return "shirt";
  // Fall back on the option values: trousers are sized by waist number.
  const sizes = raw.variants.nodes.flatMap((v) =>
    v.selectedOptions.filter((o) => /size/i.test(o.name)).map((o) => o.value),
  );
  return sizes.some((s) => /^\d{2}$/.test(s)) ? "trouser" : "shirt";
}

function inferStyle(raw: RawProduct, type: GarmentType): GarmentStyle {
  const t = `${raw.title} ${raw.tags.join(" ")}`.toLowerCase();
  if (type === "shirt") return t.includes("oxford") ? "oxford" : "poplin";
  return t.includes("pleat") ? "pleat" : "flat";
}

function parseSizeChart(value: string | null | undefined, type: GarmentType): SizeChart {
  if (value) {
    try {
      const parsed = JSON.parse(value) as SizeChart;
      if (parsed?.rows?.length) return parsed;
    } catch {
      // A malformed metafield must not break the shop; fall through to default.
    }
  }
  return type === "shirt" ? SHIRT_CHART : TROUSER_CHART;
}

const PLACEMENTS: Product["placement"][] = ["rail-a", "rail-b", "table", "mannequin-1", "mannequin-2"];

function mapProduct(raw: RawProduct, index: number): Product {
  const { name, colour } = splitTitle(raw.title);
  const type = inferType(raw);
  const style = inferStyle(raw, type);
  const sizeOf = (v: RawVariant) =>
    v.selectedOptions.find((o) => /size|waist/i.test(o.name))?.value ?? v.title;

  const placementRaw = raw.placement?.value as Product["placement"] | undefined;
  const placement =
    placementRaw && PLACEMENTS.includes(placementRaw)
      ? placementRaw
      : PLACEMENTS[index % PLACEMENTS.length];

  return {
    handle: raw.handle,
    title: raw.title,
    name,
    colour,
    type,
    style,
    hex: raw.colourHex?.value || (type === "shirt" ? "#F3F2EE" : "#3A3A3D"),
    stripe: raw.stripeHex?.value || undefined,
    description: raw.description,
    fabric: raw.fabric?.value || "",
    care: raw.care?.value || "",
    bestFor: raw.bestFor?.value || "",
    priceMinor: toMinor(raw.priceRange.minVariantPrice.amount),
    currency: raw.priceRange.minVariantPrice.currencyCode,
    variants: raw.variants.nodes.map((v) => ({
      id: v.id,
      size: sizeOf(v),
      available: v.availableForSale,
      priceMinor: toMinor(v.price.amount),
      currency: v.price.currencyCode,
    })),
    sizeChart: parseSizeChart(raw.sizeChart?.value, type),
    modelGlb: raw.modelGlb?.value || undefined,
    fitNotes: raw.fitNotes?.value || undefined,
    placement,
    images: raw.images.nodes.map((n) => ({ url: n.url, alt: n.altText || raw.title })),
    isSeed: false,
  };
}

/* ── products ──────────────────────────────────────────────────── */

export async function getProducts(first = 40): Promise<Product[]> {
  const data = await storefront<{ products: { nodes: RawProduct[] } }>(
    /* GraphQL */ `
      ${PRODUCT_FIELDS}
      query Products($first: Int!) {
        products(first: $first, sortKey: CREATED_AT) {
          nodes { ...ProductFields }
        }
      }
    `,
    { first },
  );
  return data.products.nodes.map(mapProduct);
}

export async function getProduct(handle: string): Promise<Product | null> {
  const data = await storefront<{ product: RawProduct | null }>(
    /* GraphQL */ `
      ${PRODUCT_FIELDS}
      query Product($handle: String!) {
        product(handle: $handle) { ...ProductFields }
      }
    `,
    { handle },
  );
  return data.product ? mapProduct(data.product, 0) : null;
}

/* ── cart ──────────────────────────────────────────────────────── */

export interface CartLine {
  id: string;
  quantity: number;
  variantId: string;
  size: string;
  handle: string;
  title: string;
  priceMinor: number;
  currency: string;
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotalMinor: number;
  totalMinor: number;
  currency: string;
  lines: CartLine[];
}

interface RawCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      merchandise: {
        id: string;
        title: string;
        price: { amount: string; currencyCode: string };
        product: { handle: string; title: string };
        selectedOptions: { name: string; value: string }[];
      };
    }[];
  };
}

function mapCart(raw: RawCart): Cart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    subtotalMinor: toMinor(raw.cost.subtotalAmount.amount),
    totalMinor: toMinor(raw.cost.totalAmount.amount),
    currency: raw.cost.totalAmount.currencyCode,
    lines: raw.lines.nodes.map((l) => ({
      id: l.id,
      quantity: l.quantity,
      variantId: l.merchandise.id,
      size:
        l.merchandise.selectedOptions.find((o) => /size|waist/i.test(o.name))?.value ??
        l.merchandise.title,
      handle: l.merchandise.product.handle,
      title: l.merchandise.product.title,
      priceMinor: toMinor(l.merchandise.price.amount),
      currency: l.merchandise.price.currencyCode,
    })),
  };
}

export async function createCart(
  lines: { variantId: string; quantity: number }[] = [],
): Promise<Cart> {
  const data = await storefront<{ cartCreate: { cart: RawCart; userErrors: { message: string }[] } }>(
    /* GraphQL */ `
      ${CART_FIELDS}
      mutation CartCreate($lines: [CartLineInput!]) {
        cartCreate(input: { lines: $lines }) {
          cart { ...CartFields }
          userErrors { message }
        }
      }
    `,
    { lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })) },
    "no-store",
  );
  if (data.cartCreate.userErrors?.length) {
    throw new ShopifyError(data.cartCreate.userErrors.map((e) => e.message).join("; "));
  }
  return mapCart(data.cartCreate.cart);
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await storefront<{ cart: RawCart | null }>(
    /* GraphQL */ `
      ${CART_FIELDS}
      query Cart($cartId: ID!) { cart(id: $cartId) { ...CartFields } }
    `,
    { cartId },
    "no-store",
  );
  return data.cart ? mapCart(data.cart) : null;
}

export async function addToCart(
  cartId: string,
  lines: { variantId: string; quantity: number }[],
): Promise<Cart> {
  const data = await storefront<{ cartLinesAdd: { cart: RawCart; userErrors: { message: string }[] } }>(
    /* GraphQL */ `
      ${CART_FIELDS}
      mutation CartAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart { ...CartFields }
          userErrors { message }
        }
      }
    `,
    { cartId, lines: lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })) },
    "no-store",
  );
  if (data.cartLinesAdd.userErrors?.length) {
    throw new ShopifyError(data.cartLinesAdd.userErrors.map((e) => e.message).join("; "));
  }
  return mapCart(data.cartLinesAdd.cart);
}

export async function updateCart(
  cartId: string,
  lines: { id: string; quantity: number }[],
): Promise<Cart> {
  // Quantity 0 is a removal in Shopify's model, so split the two mutations.
  const removals = lines.filter((l) => l.quantity <= 0).map((l) => l.id);
  const updates = lines.filter((l) => l.quantity > 0);

  let cart: RawCart | null = null;

  if (updates.length) {
    const data = await storefront<{ cartLinesUpdate: { cart: RawCart } }>(
      /* GraphQL */ `
        ${CART_FIELDS}
        mutation CartUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
          cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } }
        }
      `,
      { cartId, lines: updates },
      "no-store",
    );
    cart = data.cartLinesUpdate.cart;
  }

  if (removals.length) {
    const data = await storefront<{ cartLinesRemove: { cart: RawCart } }>(
      /* GraphQL */ `
        ${CART_FIELDS}
        mutation CartRemove($cartId: ID!, $lineIds: [ID!]!) {
          cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } }
        }
      `,
      { cartId, lineIds: removals },
      "no-store",
    );
    cart = data.cartLinesRemove.cart;
  }

  if (!cart) {
    const existing = await getCart(cartId);
    if (!existing) throw new ShopifyError("Cart not found");
    return existing;
  }
  return mapCart(cart);
}

export { ShopifyError };
