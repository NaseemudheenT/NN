import "server-only";

/**
 * The tools the NN Stylist may use.
 *
 * Every one reads live data. None of them can invent a product, a price or a
 * stock level, because none of them makes anything up — they return what
 * Shopify and the catalogue layer actually hold.
 *
 * add_to_bag is the one tool that would change something for the customer, so
 * it does not act: it proposes, and the interface asks first.
 */

import { loadCatalogue, loadProduct } from "@/lib/catalog";
import { recommendSize, type FitPreference } from "@/lib/fit";
import { formatMinor } from "@/lib/money";
import { estimateDelivery } from "@/lib/india";
import { readKnowledge } from "../prompts/stylist";
import { refuse, type NNTool } from "./types";
import type { Product } from "@/lib/catalog/types";

/** The shape the AI sees. Never the whole internal record. */
function publicProduct(p: Product) {
  return {
    handle: p.handle,
    name: p.name,
    colour: p.colour,
    type: p.type,
    price: formatMinor(p.priceMinor, p.currency),
    fabric: p.fabric || null,
    fit_notes: p.fitNotes || null,
    best_for: p.bestFor || null,
    care: p.care || null,
    description: p.description,
    sizes_in_stock: p.variants.filter((v) => v.available).map((v) => v.size),
    sizes_sold_out: p.variants.filter((v) => !v.available).map((v) => v.size),
    // Only stated when the data says so. Never inferred from "European-inspired".
    origin: "not stated in product data",
  };
}

export const searchProducts: NNTool<{ type?: string; colour?: string; occasion?: string }> = {
  definition: {
    name: "search_products",
    description:
      "Search the live NN catalogue. Use before naming any product. Filter by type (shirt or trouser), colour, or occasion keyword. Returns every matching product with live prices and which sizes are in stock.",
    input_schema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["shirt", "trouser"], description: "Garment type" },
        colour: { type: "string", description: "Colour name, e.g. Bianco, Charcoal" },
        occasion: { type: "string", description: "Occasion words, e.g. wedding, office, travel" },
      },
    },
  },
  async execute({ type, colour, occasion }) {
    const { products, source } = await loadCatalogue();
    let list = products;
    if (type) list = list.filter((p) => p.type === type);
    if (colour) {
      const q = colour.toLowerCase();
      list = list.filter((p) => p.colour.toLowerCase().includes(q));
    }
    if (occasion) {
      const q = occasion.toLowerCase();
      const matched = list.filter(
        (p) =>
          p.bestFor.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
      // An occasion with no exact match should still get the whole range,
      // flagged, rather than an empty answer.
      if (matched.length) list = matched;
    }
    return {
      catalogue_source: source === "shopify" ? "live Shopify" : "reference seed, not live stock",
      count: list.length,
      products: list.map(publicProduct),
    };
  },
};

export const getProduct: NNTool<{ handle: string }> = {
  definition: {
    name: "get_product",
    description:
      "Full live details for one product by its handle: price, fabric, care, fit notes, and which sizes are in stock.",
    input_schema: {
      type: "object",
      properties: { handle: { type: "string" } },
      required: ["handle"],
    },
  },
  async execute({ handle }) {
    const { product } = await loadProduct(handle);
    if (!product) return refuse(`No product with the handle "${handle}" exists in the NN range.`);
    return publicProduct(product);
  },
};

export const checkStock: NNTool<{ handle: string; size?: string }> = {
  definition: {
    name: "check_stock",
    description:
      "Live stock for a product, per size. Use this before saying anything about availability. Never claim a piece is nearly gone unless this says so.",
    input_schema: {
      type: "object",
      properties: { handle: { type: "string" }, size: { type: "string" } },
      required: ["handle"],
    },
  },
  async execute({ handle, size }) {
    const { product, source } = await loadProduct(handle);
    if (!product) return refuse(`No product with the handle "${handle}".`);
    const variants = size ? product.variants.filter((v) => v.size === size) : product.variants;
    if (size && !variants.length) return refuse(`NN does not cut a size ${size} in ${product.title}.`);
    return {
      handle,
      title: product.title,
      // Quantities are deliberately not exposed: the storefront gives
      // availability, not counts, so we cannot honestly report "2 left".
      note:
        source === "seed"
          ? "Reference catalogue — this is not live stock."
          : "Availability only. NN does not publish remaining quantities, so do not state a number left.",
      sizes: variants.map((v) => ({ size: v.size, available: v.available })),
    };
  },
};

export const getSizeChart: NNTool<{ handle: string }> = {
  definition: {
    name: "get_size_chart",
    description:
      "The size chart for one product: the body measurements each size is cut to fit, and the finished garment measurements. The difference between them is the ease.",
    input_schema: {
      type: "object",
      properties: { handle: { type: "string" } },
      required: ["handle"],
    },
  },
  async execute({ handle }) {
    const { product } = await loadProduct(handle);
    if (!product) return refuse(`No product with the handle "${handle}".`);
    return {
      handle,
      unit: "cm",
      type: product.sizeChart.type,
      rows: product.sizeChart.rows.map((r) => ({
        size: r.label,
        fits_body: r.body,
        finished_garment: r.garment,
      })),
    };
  },
};

export const recommendSizeTool: NNTool<{
  product_handle: string;
  height_cm: number;
  weight_kg: number;
  jeans_waist_in?: number;
  fit_preference?: FitPreference;
}> = {
  definition: {
    name: "recommend_size",
    description:
      "Recommend an NN size for one product from the customer's measurements. Use for any fit or size question. Returns the size plus fit notes per body area, and says which figures were measured and which estimated.",
    input_schema: {
      type: "object",
      properties: {
        product_handle: { type: "string" },
        height_cm: { type: "number" },
        weight_kg: { type: "number" },
        jeans_waist_in: {
          type: "number",
          description: "Usual jeans waist in inches, if known. Makes trousers exact.",
        },
        fit_preference: { type: "string", enum: ["close", "regular", "easy"] },
      },
      required: ["product_handle", "height_cm", "weight_kg"],
    },
  },
  async execute({ product_handle, height_cm, weight_kg, jeans_waist_in, fit_preference }) {
    const { product } = await loadProduct(product_handle);
    if (!product) return refuse(`No product with the handle "${product_handle}".`);

    const result = recommendSize(product.sizeChart, {
      heightCm: height_cm,
      weightKg: weight_kg,
      jeansWaistIn: jeans_waist_in,
      preference: fit_preference ?? "regular",
    });

    return {
      handle: product_handle,
      recommended_size: result.recommendedSize,
      confidence: result.confidence,
      caution: result.caution ?? null,
      fit_by_area: result.chosen.areas.map((a) => ({
        area: a.label,
        verdict: a.verdict,
        ease_cm: a.easeCm,
        note: a.note,
      })),
      neighbouring_sizes: result.alternatives.map((a) => a.size),
      body_estimate: {
        chest_cm: Math.round(result.body.chestCm),
        waist_cm: Math.round(result.body.waistCm),
        waist_was_measured: result.body.measured.waist,
      },
      suggest: "Offer the Trial Room for a visual check.",
    };
  },
};

export const getPolicy: NNTool<{ topic: string }> = {
  definition: {
    name: "get_policy",
    description:
      "NN's shipping, returns, exchange or payment policy, and a delivery estimate for a PIN code. Returns the policy text exactly. If a policy is still marked [TO FILL], say it is not published yet rather than guessing.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          enum: ["delivery", "returns", "exchange", "payment", "discounts", "all"],
        },
        pin: { type: "string", description: "Six-digit Indian PIN code, for a delivery window" },
      },
      required: ["topic"],
    },
  },
  async execute(input) {
    const { topic } = input;
    const pin = (input as { pin?: string }).pin;
    const knowledge = await readKnowledge();
    const policySection = knowledge.split("## Policies")[1]?.split("##")[0]?.trim() ?? "";
    const unfilled = /\[TO FILL[^\]]*\]/.test(policySection);

    return {
      topic,
      policy_text: policySection || "No policy section found in the knowledge file.",
      contains_unfilled_placeholders: unfilled,
      instruction: unfilled
        ? "Some policies are still marked [TO FILL]. Say plainly that the detail is not published yet and offer handoff_to_human. Do not invent it."
        : "Quote the policy as written.",
      delivery_estimate: pin ? (estimateDelivery(pin)?.text ?? "That PIN code was not recognised.") : null,
    };
  },
};

export const getOrderStatus: NNTool<{ order_number: string; phone_or_email: string }> = {
  definition: {
    name: "get_order_status",
    description:
      "Status of one order. Requires BOTH the order number AND the phone or email used at checkout. Never call this with only an order number — ask the customer for the second detail first.",
    input_schema: {
      type: "object",
      properties: {
        order_number: { type: "string" },
        phone_or_email: {
          type: "string",
          description: "The phone number or email used when the order was placed",
        },
      },
      required: ["order_number", "phone_or_email"],
    },
  },
  async execute({ order_number, phone_or_email }) {
    if (!order_number?.trim() || !phone_or_email?.trim()) {
      return refuse("Both the order number and the phone or email used at checkout are required.");
    }
    // Order lookup needs the Shopify Admin API. Until it is wired, say so
    // rather than returning a plausible-looking status.
    return {
      status: "unavailable",
      message:
        "Order lookup is not connected yet. Use handoff_to_human so NN care can check this personally.",
    };
  },
};

export const addToBag: NNTool<{ handle: string; size: string; quantity?: number }> = {
  definition: {
    name: "add_to_bag",
    description:
      "Propose adding a product and size to the customer's bag. This does NOT add it: the customer sees a confirmation and taps it themselves. Check the size is in stock first.",
    input_schema: {
      type: "object",
      properties: {
        handle: { type: "string" },
        size: { type: "string" },
        quantity: { type: "number", description: "Default 1" },
      },
      required: ["handle", "size"],
    },
  },
  confirms: true,
  async execute({ handle, size, quantity }) {
    const { product } = await loadProduct(handle);
    if (!product) return refuse(`No product with the handle "${handle}".`);
    const variant = product.variants.find((v) => v.size === size);
    if (!variant) return refuse(`${product.title} is not cut in size ${size}.`);
    if (!variant.available) {
      return refuse(`${product.title} in size ${size} is not in stock at the moment.`);
    }
    return {
      proposed: true,
      handle,
      size,
      quantity: Math.max(1, Math.min(10, Math.floor(quantity ?? 1))),
      title: product.title,
      price: formatMinor(variant.priceMinor, variant.currency),
      instruction:
        "Tell the customer what you are about to add and that they need to confirm it. Do not say it has been added.",
    };
  },
};

export const handoffToHuman: NNTool<{ reason: string; summary: string }> = {
  definition: {
    name: "handoff_to_human",
    description:
      "Hand the conversation to NN care. Use for complaints, damaged items, payment problems, order issues, anything you do not have the facts for, or an upset customer.",
    input_schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          enum: ["complaint", "damaged", "payment", "order", "missing_information", "other"],
        },
        summary: { type: "string", description: "One or two sentences for the NN care team" },
      },
      required: ["reason", "summary"],
    },
  },
  confirms: true,
  async execute({ reason, summary }) {
    const knowledge = await readKnowledge();
    const care = knowledge.match(/Customer care:\s*(.+)/)?.[1]?.trim() ?? "";
    const unpublished = /\[TO FILL/.test(care);
    return {
      handed_off: true,
      reason,
      summary,
      contact: unpublished ? null : care,
      instruction: unpublished
        ? "Tell the customer you are passing this to NN care, and that they will be contacted. Do not invent an email address or phone number."
        : `Tell the customer you are passing this to NN care and give them this contact: ${care}`,
    };
  },
};

export const CUSTOMER_TOOLS = [
  searchProducts,
  getProduct,
  checkStock,
  getSizeChart,
  recommendSizeTool,
  getPolicy,
  getOrderStatus,
  addToBag,
  handoffToHuman,
] as const;
