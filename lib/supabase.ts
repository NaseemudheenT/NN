/**
 * Supabase: owner authentication, showroom settings, analytics.
 *
 * Auth is a magic link — no password for the owner to lose, and no password for
 * us to store. Being on the OWNER_EMAILS list is checked on the server every
 * time, not once at sign-in, so removing an email takes effect immediately
 * rather than whenever a session happens to expire.
 *
 * This module never creates or alters a table. The SQL each feature needs is
 * written out in a comment beside it, to be run by hand.
 */

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, supabaseReady } from "./env";

/** A client with the anon key, for auth flows. */
export function supabaseAnon(): SupabaseClient | null {
  if (!supabaseReady()) return null;
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A client with the service role key. Server only, bypasses row level security. */
export function supabaseService(): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseServiceKey) return null;
  return createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Is this email allowed into the owner console? */
export function isOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = env.ownerEmails;
  if (!list.length) return false;
  return list.includes(email.trim().toLowerCase());
}

/**
 * Verify an access token and return the email it belongs to.
 * Returns null for anything we cannot verify — an unverifiable token is a
 * refused token.
 */
export async function ownerFromToken(accessToken: string | null): Promise<string | null> {
  if (!accessToken) return null;
  const client = supabaseAnon();
  if (!client) return null;

  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data.user?.email) return null;
  return isOwner(data.user.email) ? data.user.email : null;
}

/* ── showroom settings ──────────────────────────────────────────
   Table to create by hand:

     create table nn_showroom_settings (
       id text primary key default 'live',
       featured_handle text,
       forced_phase text,
       placements jsonb not null default '{}',
       updated_at timestamptz not null default now()
     );
     insert into nn_showroom_settings (id) values ('live');

   Row level security on, no anonymous policy: only the service role writes. */

export interface ShowroomSettings {
  /** The piece the showroom leads with. */
  featuredHandle: string | null;
  /** Force a time of day for everyone, for a campaign. Null follows the visitor. */
  forcedPhase: "morning" | "afternoon" | "evening" | "night" | null;
  /** handle → placement, overriding the product's own. */
  placements: Record<string, string>;
  updatedAt: string | null;
}

export const DEFAULT_SETTINGS: ShowroomSettings = {
  featuredHandle: null,
  forcedPhase: null,
  placements: {},
  updatedAt: null,
};

const SETTINGS_TABLE = "nn_showroom_settings";

export async function readShowroomSettings(): Promise<{
  settings: ShowroomSettings;
  source: "supabase" | "default";
  note?: string;
}> {
  const client = supabaseService() ?? supabaseAnon();
  if (!client) {
    return { settings: DEFAULT_SETTINGS, source: "default", note: "Supabase is not configured." };
  }

  const { data, error } = await client
    .from(SETTINGS_TABLE)
    .select("featured_handle, forced_phase, placements, updated_at")
    .eq("id", "live")
    .maybeSingle();

  if (error || !data) {
    return {
      settings: DEFAULT_SETTINGS,
      source: "default",
      note: error
        ? `Could not read ${SETTINGS_TABLE}: ${error.message}. Has the table been created?`
        : `No row in ${SETTINGS_TABLE} with id 'live' yet.`,
    };
  }

  return {
    settings: {
      featuredHandle: (data.featured_handle as string | null) ?? null,
      forcedPhase: (data.forced_phase as ShowroomSettings["forcedPhase"]) ?? null,
      placements: (data.placements as Record<string, string>) ?? {},
      updatedAt: (data.updated_at as string | null) ?? null,
    },
    source: "supabase",
  };
}

export async function writeShowroomSettings(
  next: Partial<ShowroomSettings>,
): Promise<{ ok: boolean; message?: string }> {
  const client = supabaseService();
  if (!client) {
    return {
      ok: false,
      message: "Writing showroom settings needs SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const row: Record<string, unknown> = { id: "live", updated_at: new Date().toISOString() };
  if ("featuredHandle" in next) row.featured_handle = next.featuredHandle;
  if ("forcedPhase" in next) row.forced_phase = next.forcedPhase;
  if ("placements" in next) row.placements = next.placements;

  const { error } = await client.from(SETTINGS_TABLE).upsert(row, { onConflict: "id" });
  if (error) {
    return { ok: false, message: `${error.message}. Has the ${SETTINGS_TABLE} table been created?` };
  }
  return { ok: true };
}
