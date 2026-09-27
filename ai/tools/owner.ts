import "server-only";

/**
 * The tools the NN Command Centre may use.
 *
 * These read the business. Every one of them reports its own data gaps, because
 * a founder acting on an invented conversion rate is worse off than a founder
 * who knows the number is missing.
 *
 * Nothing here writes to the store. Anything that would change a price, a stock
 * level or a discount is a proposal the console asks the founder to confirm.
 */

import { loadCatalogue } from "@/lib/catalog";
import { summariseBusiness } from "@/lib/business";
import { summarise } from "@/lib/analytics";
import { formatMinor } from "@/lib/money";
import { refuse, type NNTool } from "./types";
import { searchProducts, getProduct, checkStock, getOrderStatus } from "./customer";

const currencyOf = async () => (await loadCatalogue()).products[0]?.currency ?? "INR";

export const getSalesSummary: NNTool<{ days?: number }> = {
  definition: {
    name: "get_sales_summary",
    description:
      "Revenue, orders, average order value and conversion for the last N days. Figures that cannot be computed are returned as null with the reason — report those as unavailable, never estimate them.",
    input_schema: {
      type: "object",
      properties: { days: { type: "number", description: "Window in days. Default 30." } },
    },
  },
  async execute({ days }) {
    const { products } = await loadCatalogue();
    const window = Math.max(1, Math.min(365, Math.floor(days ?? 30)));
    const business = await summariseBusiness(products, window);
    const currency = await currencyOf();

    return {
      window_days: business.windowDays,
      orders_data_available: business.ordersAvailable,
      metrics: business.metrics.map((m) => ({
        label: m.label,
        value: m.value,
        rendered:
          m.value === null
            ? null
            : m.kind === "currency"
              ? formatMinor(m.value, currency)
              : m.kind === "percent"
                ? `${(m.value * 100).toFixed(2)}%`
                : String(m.value),
        basis: m.basis ?? null,
        unavailable_because: m.unavailable ?? null,
      })),
      data_gaps: business.gaps,
    };
  },
};

export const getProductPerformance: NNTool<{ days?: number }> = {
  definition: {
    name: "get_product_performance",
    description:
      "Per product: units sold, revenue, views, adds to bag and add rate. A null means the figure cannot be computed from the data held, not that it is zero.",
    input_schema: {
      type: "object",
      properties: { days: { type: "number" } },
    },
  },
  async execute({ days }) {
    const { products, source } = await loadCatalogue();
    const business = await summariseBusiness(products, Math.max(1, Math.min(365, Math.floor(days ?? 30))));
    const currency = await currencyOf();

    return {
      catalogue_source: source === "shopify" ? "live Shopify" : "reference seed",
      ranked_by: business.ordersAvailable ? "revenue" : "consented views (no order data)",
      products: business.products.map((p) => ({
        handle: p.handle,
        title: p.title,
        units_sold: p.unitsSold,
        revenue: p.revenueMinor === null ? null : formatMinor(p.revenueMinor, currency),
        views: p.views,
        adds_to_bag: p.addsToBag,
        add_rate: p.addRate === null ? null : `${(p.addRate * 100).toFixed(1)}%`,
        add_rate_null_because: p.addRate === null ? "fewer than 20 views — too few to state a rate" : null,
      })),
      data_gaps: business.gaps,
    };
  },
};

export const getInventory: NNTool<{ low_stock_only?: boolean }> = {
  definition: {
    name: "get_inventory",
    description:
      "Stock position per product and size. NN's storefront exposes availability, not quantities, so this reports which sizes are in or out of stock. Quantities need the Shopify Admin inventory scope.",
    input_schema: {
      type: "object",
      properties: { low_stock_only: { type: "boolean" } },
    },
  },
  async execute({ low_stock_only }) {
    const { products, source } = await loadCatalogue();
    const rows = products.map((p) => {
      const out = p.variants.filter((v) => !v.available).map((v) => v.size);
      return {
        handle: p.handle,
        title: p.title,
        sizes_in_stock: p.variants.filter((v) => v.available).map((v) => v.size),
        sizes_out_of_stock: out,
        fully_sold_out: out.length === p.variants.length,
      };
    });
    return {
      catalogue_source: source === "shopify" ? "live Shopify" : "reference seed, not live stock",
      quantities_available: false,
      quantities_note:
        "Exact quantities are not exposed by the Storefront API. Connect the Admin API inventory scope to report units on hand.",
      products: low_stock_only ? rows.filter((r) => r.sizes_out_of_stock.length > 0) : rows,
    };
  },
};

export const getReturns: NNTool<{ days?: number }> = {
  definition: {
    name: "get_returns",
    description:
      "Return and RTO rates. Computed from Shopify order tags. Returns null with a reason when there are too few fulfilled orders to state a rate honestly.",
    input_schema: { type: "object", properties: { days: { type: "number" } } },
  },
  async execute({ days }) {
    const { products } = await loadCatalogue();
    const business = await summariseBusiness(products, Math.max(1, Math.min(365, Math.floor(days ?? 30))));
    const pick = (label: string) => business.metrics.find((m) => m.label === label);
    const ret = pick("Return rate");
    const rto = pick("RTO rate");
    return {
      window_days: business.windowDays,
      return_rate: ret?.value === null || ret?.value === undefined ? null : `${(ret.value * 100).toFixed(2)}%`,
      return_rate_unavailable_because: ret?.unavailable ?? null,
      rto_rate: rto?.value === null || rto?.value === undefined ? null : `${(rto.value * 100).toFixed(2)}%`,
      rto_rate_unavailable_because: rto?.unavailable ?? null,
      basis: "orders tagged 'return' or 'RTO' in Shopify, divided by fulfilled orders",
      reasons_available: false,
      reasons_note:
        "Return reasons are not captured yet. Add a reason field to the returns flow to analyse why.",
    };
  },
};

export const getMarketingMetrics: NNTool<{ days?: number }> = {
  definition: {
    name: "get_marketing_metrics",
    description:
      "Marketing spend, CAC and traffic sources. NN has no ad platform connected, so this reports what is genuinely known and what is not. Never estimate CAC.",
    input_schema: { type: "object", properties: { days: { type: "number" } } },
  },
  async execute() {
    const analytics = await summarise(30);
    return {
      ad_spend: null,
      cac: null,
      roas: null,
      unavailable_because:
        "No advertising platform is connected. Spend, CAC and ROAS cannot be computed. Connect Meta or Google Ads, or record spend manually, before any decision about scaling.",
      consented_traffic: {
        source: analytics.source,
        page_views: analytics.events.find((e) => e.name === "page_view")?.count ?? 0,
        note: "Counted only for visitors who agreed under the DPDP consent banner, so this undercounts real traffic.",
      },
    };
  },
};

export const getAiInsights: NNTool<{ days?: number }> = {
  definition: {
    name: "get_ai_insights",
    description:
      "What customers are asking the stylist most, and which products it recommends. Useful for spotting demand and gaps in the range.",
    input_schema: { type: "object", properties: { days: { type: "number" } } },
  },
  async execute({ days }) {
    const analytics = await summarise(Math.max(1, Math.min(365, Math.floor(days ?? 30))));
    const questions = analytics.events.find((e) => e.name === "stylist_question");
    return {
      source: analytics.source,
      stylist_questions: questions?.count ?? 0,
      most_viewed_products: analytics.events.find((e) => e.name === "product_view")?.top ?? [],
      trial_room_uses: analytics.events.find((e) => e.name === "trial_room")?.count ?? 0,
      note:
        analytics.source === "memory"
          ? "Held in server memory and lost on restart. Create the nn_events table in Supabase to keep this."
          : "Stored in Supabase, consented visitors only.",
      topics_available: false,
      topics_note:
        "Question topics are not classified yet. Conversation logging populates this once the nn_ai_conversations table exists.",
    };
  },
};

/** A store change the founder must approve. Never executed by the AI. */
export const proposeStoreChange: NNTool<{ change: string; reason: string; risk: string }> = {
  definition: {
    name: "propose_store_change",
    description:
      "Propose a change to the store — a price, a stock position, an offer. This does NOT make the change. It returns a proposal the founder confirms in the console. Always state the risk.",
    input_schema: {
      type: "object",
      properties: {
        change: { type: "string", description: "Exactly what would change, and from what to what" },
        reason: { type: "string", description: "The evidence for it, with the figures" },
        risk: { type: "string", description: "What could go wrong, and how it would be detected" },
      },
      required: ["change", "reason", "risk"],
    },
  },
  confirms: true,
  async execute({ change, reason, risk }, ctx) {
    if (!ctx.ownerEmail) return refuse("Only the owner may propose a store change.");
    return {
      proposed: true,
      change,
      reason,
      risk,
      executed: false,
      instruction:
        "Present this as a proposal awaiting the founder's confirmation. Do not say it has been applied.",
    };
  },
};

export const OWNER_TOOLS = [
  searchProducts,
  getProduct,
  checkStock,
  getOrderStatus,
  getSalesSummary,
  getProductPerformance,
  getInventory,
  getReturns,
  getMarketingMetrics,
  getAiInsights,
  proposeStoreChange,
] as const;
