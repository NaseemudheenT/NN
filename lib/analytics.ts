/**
 * Where consented analytics go.
 *
 * Supabase when it is configured, an in-memory tally otherwise. The in-memory
 * store is honest about what it is: it lives for as long as the server process
 * does, which is fine for development and for the owner console to have
 * something real to show before the database exists.
 *
 * Nothing stored here can identify a visitor. That is a design constraint, not
 * a setting: there is no field for an address, an id or a user agent.
 */

import "server-only";
import { env, supabaseReady } from "./env";

export interface AnalyticsEvent {
  name: string;
  detail: Record<string, string | number | boolean>;
  /** ISO timestamp truncated to the hour, e.g. 2026-09-27T14. */
  hour: string;
}

export interface EventTally {
  name: string;
  count: number;
  /** The most common values of the most useful detail key, if any. */
  top: { value: string; count: number }[];
}

/* ── in-memory fallback ────────────────────────────────────────── */

const memory: AnalyticsEvent[] = [];
const MEMORY_CAP = 5000;

function rememberInMemory(event: AnalyticsEvent) {
  memory.push(event);
  if (memory.length > MEMORY_CAP) memory.splice(0, memory.length - MEMORY_CAP);
}

/* ── Supabase ──────────────────────────────────────────────────── */

/**
 * Expects a table created by hand — this code never creates or alters one:
 *
 *   create table nn_events (
 *     id bigint generated always as identity primary key,
 *     name text not null,
 *     detail jsonb not null default '{}',
 *     hour text not null,
 *     created_at timestamptz not null default now()
 *   );
 *   create index nn_events_hour_idx on nn_events (hour);
 *
 * Row level security should deny anonymous reads; the service role key used
 * here bypasses it, and only ever runs on the server.
 */
const TABLE = "nn_events";

async function writeToSupabase(event: AnalyticsEvent): Promise<boolean> {
  const key = env.supabaseServiceKey || env.supabaseAnonKey;
  if (!env.supabaseUrl || !key) return false;

  const res = await fetch(`${env.supabaseUrl}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(event),
    cache: "no-store",
  });

  if (!res.ok) {
    // A missing table is the common case before setup; say so once, clearly.
    console.warn(
      `[analytics] Supabase rejected the event (${res.status}). Has the ${TABLE} table been created?`,
    );
    return false;
  }
  return true;
}

export async function recordEvent(event: AnalyticsEvent): Promise<void> {
  if (supabaseReady()) {
    const ok = await writeToSupabase(event);
    if (ok) return;
  }
  rememberInMemory(event);
}

/* ── reading back, for the owner console ───────────────────────── */

async function readFromSupabase(sinceHour: string): Promise<AnalyticsEvent[] | null> {
  const key = env.supabaseServiceKey || env.supabaseAnonKey;
  if (!env.supabaseUrl || !key) return null;

  try {
    const url = new URL(`${env.supabaseUrl}/rest/v1/${TABLE}`);
    url.searchParams.set("select", "name,detail,hour");
    url.searchParams.set("hour", `gte.${sinceHour}`);
    url.searchParams.set("limit", "10000");

    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as AnalyticsEvent[];
  } catch {
    return null;
  }
}

/** Which detail key is worth tallying, per event. */
const DETAIL_KEY: Record<string, string> = {
  showroom_viewpoint: "viewpoint",
  showroom_garment: "handle",
  product_view: "handle",
  add_to_bag: "handle",
  trial_room: "handle",
};

export interface AnalyticsSummary {
  source: "supabase" | "memory";
  since: string;
  total: number;
  events: EventTally[];
}

export async function summarise(days = 7): Promise<AnalyticsSummary> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 13);

  const fromDb = supabaseReady() ? await readFromSupabase(since) : null;
  const rows = fromDb ?? memory.filter((e) => e.hour >= since);
  const source = fromDb ? "supabase" : "memory";

  const byName = new Map<string, AnalyticsEvent[]>();
  for (const row of rows) {
    const list = byName.get(row.name) ?? [];
    list.push(row);
    byName.set(row.name, list);
  }

  const events: EventTally[] = [...byName.entries()]
    .map(([name, list]) => {
      const key = DETAIL_KEY[name];
      const counts = new Map<string, number>();
      if (key) {
        for (const row of list) {
          const value = row.detail?.[key];
          if (typeof value === "string") counts.set(value, (counts.get(value) ?? 0) + 1);
        }
      }
      return {
        name,
        count: list.length,
        top: [...counts.entries()]
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      };
    })
    .sort((a, b) => b.count - a.count);

  return { source, since, total: rows.length, events };
}
