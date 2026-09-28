import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { env, integrations } from "./env";

/**
 * Owner access.
 *
 * Supabase sends the magic link; this module decides who is allowed in.
 * Only addresses listed in OWNER_EMAILS may hold a session, and the session
 * cookie is signed with the service key so it cannot be forged client-side.
 */

const COOKIE = "nn_owner";
const MAX_AGE = 60 * 60 * 8;

function signingKey() {
  const key = env.supabaseServiceKey() ?? env.supabaseAnonKey();
  if (!key) throw new Error("No key available to sign the owner session");
  return key;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function isOwnerEmail(email: string) {
  const list = env.ownerEmails();
  if (list.length === 0) return false;
  return list.includes(email.trim().toLowerCase());
}

export function mintSession(email: string) {
  const payload = `${email.toLowerCase()}.${Date.now() + MAX_AGE * 1000}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function readSession(token: string | undefined): string | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = sign(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const separator = payload.lastIndexOf(".");
  const email = payload.slice(0, separator);
  const expires = Number(payload.slice(separator + 1));
  if (!Number.isFinite(expires) || Date.now() > expires) return null;
  if (!isOwnerEmail(email)) return null;

  return email;
}

export async function currentOwner(): Promise<string | null> {
  try {
    const jar = await cookies();
    return readSession(jar.get(COOKIE)?.value);
  } catch {
    return null;
  }
}

export const OWNER_COOKIE = COOKIE;
export const OWNER_MAX_AGE = MAX_AGE;

/** Ask Supabase to email a one-time link. Never called for a non-owner. */
export async function sendMagicLink(email: string, redirectTo: string) {
  const url = env.supabaseUrl();
  const anon = env.supabaseAnonKey();
  if (!url || !anon) throw new Error("Supabase is not configured");

  const res = await fetch(`${url}/auth/v1/otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anon },
    body: JSON.stringify({ email, create_user: false, options: { email_redirect_to: redirectTo } }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Supabase rejected the request (${res.status})`);
  }
}

export const ownerAuthReady = () => integrations.supabase() && env.ownerEmails().length > 0;
