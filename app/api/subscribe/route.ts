/**
 * The newsletter.
 *
 * An address is the most personal thing a visitor hands over on this site
 * before they hand over money, so three rules govern it:
 *
 *   · it is validated and normalised here, on the server, and nowhere else
 *     is trusted to have done it;
 *   · it is stored or it is not — if Supabase is not configured the route
 *     says so plainly rather than returning a green tick over a black hole.
 *     A form that pretends to have saved an address is worse than one that
 *     is honestly switched off;
 *   · a second sign-up from the same address is a success, not an error.
 *     Telling a stranger "you are already on this list" discloses who is on
 *     it, which is not ours to disclose.
 *
 * Rate-limited by visitor, because an open insert endpoint is an open
 * mailing list.
 */

import { supabaseService } from "@/lib/supabase";
import { rateLimit, visitorKey } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** One reply shape, so the footer never has to guess what came back. */
function back(message: string, ok: boolean) {
  return Response.json({ ok, message }, { status: ok ? 200 : 400 });
}

export async function POST(req: Request) {
  const limit = rateLimit(`subscribe:${visitorKey(req)}`, 5, 60 * 60_000);
  if (!limit.allowed) {
    return back(
      `Too many sign-ups from here. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
      false,
    );
  }

  let email = "";
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      email = String(((await req.json()) as { email?: unknown }).email ?? "");
    } else {
      email = String((await req.formData()).get("email") ?? "");
    }
  } catch {
    return back("We could not read that.", false);
  }

  email = email.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return back("That does not look like an email address.", false);
  }

  const db = supabaseService();
  if (!db) {
    return back(
      "The list is not connected yet, so we have not stored your address — we would rather say that than pretend.",
      false,
    );
  }

  const { error } = await db
    .from("subscribers")
    .upsert({ email, created_at: new Date().toISOString() }, { onConflict: "email" });

  if (error) {
    console.error("[subscribe]", error.message);
    return back("We could not save that just now. Please try again.", false);
  }

  return back("You are on the list. Welcome.", true);
}
