/**
 * The numbers the owner console reports.
 *
 * Every figure here is either computed from real data or explicitly marked as
 * unavailable. There is no synthetic filler: a dashboard that invents a
 * conversion rate is worse than a dashboard that says it cannot compute one,
 * because a made-up number gets acted on.
 *
 * The formulas are the standard retail ones, written out so they can be checked:
 *   AOV            = revenue / orders
 *   conversion     = orders / sessions
 *   sell-through   = units sold / (units sold + units on hand)
 *   RTO rate       = returned-to-origin orders / orders shipped
 */

import "server-only";
import { env, shopifyReady } from "./env";
import { summarise, type AnalyticsSummary } from "./analytics";
import type { Product } from "./catalog/types";

export interface Metric {
  label: string;
  /** Null when it genuinely cannot be computed from the data we hold. */
  value: number | null;
  /** How to render it. */
  kind: "currency" | "count" | "percent" | "ratio";
  /** Said plainly when the value is null. */
  unavailable?: string;
  /** Where the number came from. */
  basis?: string;
}

export interface ProductPerformance {
  handle: string;
  title: string;
  unitsSold: number | null;
  revenueMinor: number | null;
  /** Views from consented analytics. */
  views: number;
  addsToBag: number;
  /** views → adds, when there are enough views to mean anything. */
  addRate: number | null;
  inventory: number | null;
  sellThrough: number | null;
}

export interface BusinessSummary {
  /** True when Shopify order data is available. */
  ordersAvailable: boolean;
  metrics: Metric[];
  products: ProductPerformance[];
  analytics: AnalyticsSummary;
  /** Anything the console should say out loud about missing data. */
  gaps: string[];
  windowDays: number;
}

/* ── Shopify order data, via the Admin API ─────────────────────── */

interface AdminOrder {
  id: number;
  created_at: string;
  cancelled_at: string | null;
  financial_status: string | null;
  fulfillment_status: string | null;
  total_price: string;
  currency: string;
  tags: string;
  line_items: { sku: string | null; title: string; quantity: number; price: string; variant_id: number | null }[];
}

async function fetchOrders(days: number): Promise<{ orders: AdminOrder[] | null; reason?: string }> {
  if (!shopifyReady() || !env.shopifyAdminToken) {
    return {
      orders: null,
      reason: "Order figures need SHOPIFY_ADMIN_TOKEN as well as the Storefront token.",
    };
  }

  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  try {
    const url = new URL(`https://${env.shopifyDomain}/admin/api/2025-07/orders.json`);
    url.searchParams.set("status", "any");
    url.searchParams.set("created_at_min", since);
    url.searchParams.set("limit", "250");
    url.searchParams.set(
      "fields",
      "id,created_at,cancelled_at,financial_status,fulfillment_status,total_price,currency,tags,line_items",
    );

    const res = await fetch(url, {
      headers: { "X-Shopify-Access-Token": env.shopifyAdminToken },
      cache: "no-store",
    });
    if (!res.ok) {
      return { orders: null, reason: `Shopify Admin API returned ${res.status}.` };
    }
    const data = (await res.json()) as { orders?: AdminOrder[] };
    return { orders: data.orders ?? [] };
  } catch (err) {
    return { orders: null, reason: err instanceof Error ? err.message : "Shopify was unreachable." };
  }
}

/* ── the summary ───────────────────────────────────────────────── */

export async function summariseBusiness(
  products: Product[],
  days = 30,
): Promise<BusinessSummary> {
  const gaps: string[] = [];
  const [{ orders, reason }, analytics] = await Promise.all([fetchOrders(days), summarise(days)]);

  if (!orders) {
    gaps.push(reason ?? "Order data is unavailable.");
  }
  if (analytics.source === "memory") {
    gaps.push(
      "Visitor figures are counted in this server's memory and reset when it restarts. Create the nn_events table in Supabase to keep them.",
    );
  }
  if (analytics.total === 0) {
    gaps.push("No visitor events yet — either nobody has consented, or nobody has visited.");
  }

  /* orders and money */
  const paid = orders?.filter((o) => !o.cancelled_at && o.financial_status === "paid") ?? [];
  const revenueMinor = paid.reduce((a, o) => a + Math.round(Number(o.total_price) * 100), 0);
  const orderCount = paid.length;

  /* sessions, from consented analytics */
  const sessions = analytics.events.find((e) => e.name === "page_view")?.count ?? 0;

  /* returns and RTO, read from Shopify tags — the usual way a small brand marks them */
  const shipped = orders?.filter((o) => o.fulfillment_status === "fulfilled").length ?? 0;
  const rto = orders?.filter((o) => /rto|returned.to.origin/i.test(o.tags)).length ?? 0;
  const returned = orders?.filter((o) => /return/i.test(o.tags) && !/rto/i.test(o.tags)).length ?? 0;

  const metrics: Metric[] = [
    {
      label: "Revenue",
      value: orders ? revenueMinor : null,
      kind: "currency",
      unavailable: reason,
      basis: orders ? `${orderCount} paid orders in the last ${days} days` : undefined,
    },
    {
      label: "Orders",
      value: orders ? orderCount : null,
      kind: "count",
      unavailable: reason,
    },
    {
      label: "Average order value",
      value: orders && orderCount > 0 ? Math.round(revenueMinor / orderCount) : null,
      kind: "currency",
      unavailable: !orders ? reason : orderCount === 0 ? "No paid orders in this window." : undefined,
      basis: "revenue ÷ orders",
    },
    {
      label: "Conversion rate",
      value: orders && sessions >= 30 ? orderCount / sessions : null,
      kind: "percent",
      unavailable: !orders
        ? reason
        : sessions < 30
          ? `Only ${sessions} consented page views so far — too few to state a rate honestly.`
          : undefined,
      basis: "orders ÷ consented page views",
    },
    {
      label: "Return rate",
      value: orders && shipped >= 10 ? returned / shipped : null,
      kind: "percent",
      unavailable: !orders
        ? reason
        : shipped < 10
          ? `Only ${shipped} fulfilled orders — too few to state a rate.`
          : undefined,
      basis: "orders tagged 'return' ÷ fulfilled orders",
    },
    {
      label: "RTO rate",
      value: orders && shipped >= 10 ? rto / shipped : null,
      kind: "percent",
      unavailable: !orders
        ? reason
        : shipped < 10
          ? `Only ${shipped} fulfilled orders — too few to state a rate.`
          : undefined,
      basis: "orders tagged 'RTO' ÷ fulfilled orders",
    },
  ];

  /* per product */
  const viewsFor = (handle: string) =>
    analytics.events.find((e) => e.name === "product_view")?.top.find((t) => t.value === handle)
      ?.count ?? 0;
  const addsFor = (handle: string) =>
    analytics.events.find((e) => e.name === "add_to_bag")?.top.find((t) => t.value === handle)
      ?.count ?? 0;

  const unitsByTitle = new Map<string, { units: number; revenueMinor: number }>();
  for (const order of paid) {
    for (const item of order.line_items) {
      const key = item.title.toLowerCase();
      const entry = unitsByTitle.get(key) ?? { units: 0, revenueMinor: 0 };
      entry.units += item.quantity;
      entry.revenueMinor += Math.round(Number(item.price) * 100) * item.quantity;
      unitsByTitle.set(key, entry);
    }
  }

  const performance: ProductPerformance[] = products.map((p) => {
    const sold = unitsByTitle.get(p.title.toLowerCase());
    const views = viewsFor(p.handle);
    const adds = addsFor(p.handle);
    return {
      handle: p.handle,
      title: p.title,
      unitsSold: orders ? (sold?.units ?? 0) : null,
      revenueMinor: orders ? (sold?.revenueMinor ?? 0) : null,
      views,
      addsToBag: adds,
      // A rate from four views is noise, so we do not state one.
      addRate: views >= 20 ? adds / views : null,
      // Inventory needs the Admin API's inventory scope; not assumed here.
      inventory: null,
      sellThrough: null,
    };
  });

  if (orders) {
    performance.sort((a, b) => (b.revenueMinor ?? 0) - (a.revenueMinor ?? 0));
  } else {
    performance.sort((a, b) => b.views - a.views);
    gaps.push(
      "Products are ranked by consented views, not by revenue, because order data is unavailable.",
    );
  }

  return {
    ordersAvailable: !!orders,
    metrics,
    products: performance,
    analytics,
    gaps,
    windowDays: days,
  };
}
