/**
 * The owner console's calls to its own server.
 *
 * Nothing here decides anything. Every authorisation check happens on the
 * server, against a verified Supabase token whose email is on OWNER_EMAILS —
 * these functions only carry the token there. A console that decided for
 * itself whether someone was the owner would be a console anyone could be
 * the owner of.
 */

export interface ShowroomSettings {
  placements: Record<string, string>;
  featuredHandle?: string | null;
  forcedPhase?: string | null;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Read the showroom arrangement the Founder has set. */
export async function readSettings(token: string): Promise<ShowroomSettings | null> {
  try {
    const res = await fetch("/api/owner/settings", { headers: auth(token) });
    if (!res.ok) return null;
    const json = (await res.json()) as { settings?: ShowroomSettings };
    return json.settings ?? null;
  } catch {
    return null;
  }
}

/** Change it. The server re-checks that the caller is an owner. */
export async function writeSettings(
  token: string,
  settings: Partial<ShowroomSettings>,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch("/api/owner/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...auth(token) },
      body: JSON.stringify(settings),
    });
    const json = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    return { ok: res.ok, message: json.message ?? json.error };
  } catch {
    return { ok: false, message: "Could not reach the server." };
  }
}

/** Ask the console's assistant a question about the business. */
export async function askInsight(
  token: string,
  question: string,
  signal?: AbortSignal,
): Promise<{ answer: string; ok: boolean }> {
  try {
    const res = await fetch("/api/owner/insight", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth(token) },
      signal,
      body: JSON.stringify({ question }),
    });
    const json = (await res.json().catch(() => ({}))) as { answer?: string; message?: string; error?: string };
    return { ok: res.ok, answer: json.answer ?? json.message ?? json.error ?? "No answer came back." };
  } catch {
    return { ok: false, answer: "Could not reach the server." };
  }
}
