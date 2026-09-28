import "server-only";
import { env, integrations } from "./env";
import type { Catalog, Product, Money, Variant, Category } from "./types";
import { COLLECTION_001 } from "./collection-001";

const API_VERSION = "2025-07";

function endpoint() {
  return `https://${env.shopifyDomain()}/api/${API_VERSION}/graphql.json`;
}

async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidate = 120,
): Promise<T> {
  const token = env.shopifyStorefrontToken();
  if (!token) throw new Error("SHOPIFY_STOREFRONT_TOKEN is not set");

  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate, tags: ["catalog"] },
  });

  if (!res.ok) {
    throw new Error(`Shopify responded ${res.status}`);
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  if (!json.data) throw new Error("Shopify returned no data");
  return json.data;
}

const PRODUCT_FRAGMENT = /* GraphQL */ `
  fragment ProductParts on Product {
    id
    handle
    title
    description
    productType
    tags
    options {
      name
      values
    }
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 8) {
      nodes {
        url
        altText
        width
        height
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 40) {
      nodes {
        id
        title
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
      }
    }
    colour: metafield(namespace: "nn", key: "colour") {
      value
    }
    swatch: metafield(namespace: "nn", key: "swatch") {
      value
    }
    fabric: metafield(namespace: "nn", key: "fabric") {
      value
    }
    fitNotes: metafield(namespace: "nn", key: "fit_notes") {
      value
    }
    modelGlb: metafield(namespace: "nn", key: "model_glb") {
      value
    }
    sizeChart: metafield(namespace: "nn", key: "size_chart") {
      value
    }
    care: metafield(namespace: "nn", key: "care") {
      value
    }
  }
`;

interface ShopifyProductNode {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  options: { name: string; values: string[] }[];
  featuredImage: { url: string; altText: string | null; width: number; height: number } | null;
  images: { nodes: { url: string; altText: string | null; width: number; height: number }[] };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: {
    nodes: {
      id: string;
      title: string;
      availableForSale: boolean;
      selectedOptions: { name: string; value: string }[];
      price: { amount: string; currencyCode: string };
    }[];
  };
  colour: { value: string } | null;
  swatch: { value: string } | null;
  fabric: { value: string } | null;
  fitNotes: { value: string } | null;
  modelGlb: { value: string } | null;
  sizeChart: { value: string } | null;
  care: { value: string } | null;
}

function money(a: { amount: string; currencyCode: string }): Money {
  return { amount: Number(a.amount), currency: a.currencyCode };
}

function categoryOf(node: ShopifyProductNode): Category {
  const hay = `${node.productType} ${node.tags.join(" ")} ${node.title}`.toLowerCase();
  if (/(trouser|pant|chino)/.test(hay)) return "trousers";
  if (/(coat|jacket|overcoat|blazer)/.test(hay)) return "outerwear";
  if (/(knit|sweater|jumper)/.test(hay)) return "knitwear";
  return "shirts";
}

function parseJson<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function sizeOf(v: ShopifyProductNode["variants"]["nodes"][number]): string {
  const opt = v.selectedOptions.find((o) => /size/i.test(o.name));
  return opt?.value ?? v.title;
}

function toProduct(node: ShopifyProductNode): Product {
  const variants: Variant[] = node.variants.nodes.map((v) => ({
    id: v.id,
    size: sizeOf(v),
    available: v.availableForSale,
    price: money(v.price),
  }));

  const sizeOption = node.options.find((o) => /size/i.test(o.name));

  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    colour: node.colour?.value ?? "",
    swatch: node.swatch?.value ?? "#8a8177",
    category: categoryOf(node),
    fabric: node.fabric?.value ?? "",
    fit: node.fitNotes?.value ?? "",
    description: node.description,
    care: parseJson<string[]>(node.care?.value ?? null) ?? [],
    sizes: sizeOption?.values ?? variants.map((v) => v.size),
    price: money(node.priceRange.minVariantPrice),
    images: (node.images.nodes.length ? node.images.nodes : node.featuredImage ? [node.featuredImage] : []).map(
      (i) => ({ url: i.url, alt: i.altText ?? `${node.title} — ${node.colour?.value ?? ""}`.trim(), width: i.width, height: i.height }),
    ),
    modelGlb: node.modelGlb?.value ?? null,
    variants,
    preview: false,
    sizeChart: parseJson(node.sizeChart?.value ?? null),
  };
}

/**
 * The catalogue. When Shopify is connected it is the only source of truth.
 * When it is not, the showroom shows Collection 001 as display forms with
 * no price and no stock — never invented numbers.
 */
export async function getCatalog(): Promise<Catalog> {
  if (!integrations.shopify()) {
    return { configured: false, source: "preview", products: COLLECTION_001, error: null };
  }
  try {
    const data = await storefront<{ products: { nodes: ShopifyProductNode[] } }>(
      /* GraphQL */ `
        ${PRODUCT_FRAGMENT}
        query Catalog {
          products(first: 60, sortKey: BEST_SELLING) {
            nodes {
              ...ProductParts
            }
          }
        }
      `,
    );
    return {
      configured: true,
      source: "shopify",
      products: data.products.nodes.map(toProduct),
      error: null,
    };
  } catch (e) {
    return {
      configured: true,
      source: "preview",
      products: COLLECTION_001,
      error: e instanceof Error ? e.message : "Shopify request failed",
    };
  }
}

export async function getProduct(handle: string): Promise<Product | null> {
  if (!integrations.shopify()) {
    return COLLECTION_001.find((p) => p.handle === handle) ?? null;
  }
  try {
    const data = await storefront<{ product: ShopifyProductNode | null }>(
      /* GraphQL */ `
        ${PRODUCT_FRAGMENT}
        query OneProduct($handle: String!) {
          product(handle: $handle) {
            ...ProductParts
          }
        }
      `,
      { handle },
    );
    return data.product ? toProduct(data.product) : null;
  } catch {
    return COLLECTION_001.find((p) => p.handle === handle) ?? null;
  }
}

/* ------------------------------------------------------------------ */
/* Cart                                                                */
/* ------------------------------------------------------------------ */

const CART_FRAGMENT = /* GraphQL */ `
  fragment CartParts on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 50) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            selectedOptions {
              name
              value
            }
            price {
              amount
              currencyCode
            }
            image {
              url
              altText
            }
            product {
              handle
              title
            }
          }
        }
      }
    }
  }
`;

export interface ShopifyCart {
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
        selectedOptions: { name: string; value: string }[];
        price: { amount: string; currencyCode: string };
        image: { url: string; altText: string | null } | null;
        product: { handle: string; title: string };
      };
    }[];
  };
}

export async function createCart(): Promise<ShopifyCart> {
  const data = await storefront<{ cartCreate: { cart: ShopifyCart } }>(
    /* GraphQL */ `
      ${CART_FRAGMENT}
      mutation CartCreate {
        cartCreate {
          cart {
            ...CartParts
          }
        }
      }
    `,
    {},
    0,
  );
  return data.cartCreate.cart;
}

export async function getCart(id: string): Promise<ShopifyCart | null> {
  const data = await storefront<{ cart: ShopifyCart | null }>(
    /* GraphQL */ `
      ${CART_FRAGMENT}
      query Cart($id: ID!) {
        cart(id: $id) {
          ...CartParts
        }
      }
    `,
    { id },
    0,
  );
  return data.cart;
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
): Promise<ShopifyCart> {
  const data = await storefront<{ cartLinesAdd: { cart: ShopifyCart } }>(
    /* GraphQL */ `
      ${CART_FRAGMENT}
      mutation CartAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            ...CartParts
          }
        }
      }
    `,
    { cartId, lines },
    0,
  );
  return data.cartLinesAdd.cart;
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<ShopifyCart> {
  if (quantity <= 0) {
    const data = await storefront<{ cartLinesRemove: { cart: ShopifyCart } }>(
      /* GraphQL */ `
        ${CART_FRAGMENT}
        mutation CartRemove($cartId: ID!, $lineIds: [ID!]!) {
          cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
            cart {
              ...CartParts
            }
          }
        }
      `,
      { cartId, lineIds: [lineId] },
      0,
    );
    return data.cartLinesRemove.cart;
  }
  const data = await storefront<{ cartLinesUpdate: { cart: ShopifyCart } }>(
    /* GraphQL */ `
      ${CART_FRAGMENT}
      mutation CartUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            ...CartParts
          }
        }
      }
    `,
    { cartId, lines: [{ id: lineId, quantity }] },
    0,
  );
  return data.cartLinesUpdate.cart;
}
