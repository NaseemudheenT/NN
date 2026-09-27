/**
 * Consent-gated analytics.
 *
 * The browser only calls this after a visitor has said yes on the DPDP banner.
 * This route holds the second half of that promise: it stores no IP address, no
 * user agent and no identifier that could pick one person out. What it keeps is
 * the event, a coarse bucket of detail, and the hour it happened — enough to
 * answer "which part of the showroom do people use" and nothing more.
 *
 * With Supabase unconfigured the events are counted in memory and read back by
 * the owner console, so the console is never blank while the database is being
 * set up.
 */

import { supabaseReady } from "@/lib/env";
import { recordEvent, type AnalyticsEvent } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "page_view",
  "showroom_3d",
  "showroom_viewpoint",
  "showroom_garment",
  "product_view",
  "add_to_bag",
  "trial_room",
  "fit_finder",
  "stylist_question",
  "checkout_started",
  "checkout_paid",
]);

export async function POST(req: Request) {
  let body: { event?: unknown; detail?: unknown; at?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(null, { status: 204 });
  }

  const name = typeof body.event === "string" ? body.event : "";
  if (!ALLOWED.has(name)) {
    // Silently ignore anything we did not ask for, rather than telling a
    // caller which event names exist.
    return new Response(null, { status: 204 });
  }

  // Keep only short, non-identifying scalar values from the detail object.
  const detail: Record<string, string | number | boolean> = {};
  if (typeof body.detail === "object" && body.detail !== null) {
    for (const [key, value] of Object.entries(body.detail as Record<string, unknown>)) {
      if (Object.keys(detail).length >= 6) break;
      if (typeof value === "string") detail[key] = value.slice(0, 64);
      else if (typeof value === "number" && Number.isFinite(value)) detail[key] = value;
      else if (typeof value === "boolean") detail[key] = value;
    }
  }

  const event: AnalyticsEvent = {
    name,
    detail,
    // Rounded to the hour: enough to see a pattern, not enough to follow a person.
    hour: new Date().toISOString().slice(0, 13),
  };

  try {
    await recordEvent(event);
  } catch (err) {
    console.warn("[analytics] could not record event:", err);
  }

  return new Response(null, { status: 204 });
}

export async function GET() {
  return Response.json({ supabase: supabaseReady() });
}
