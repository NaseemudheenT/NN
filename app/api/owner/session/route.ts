import { NextResponse } from "next/server";
import {
  OWNER_COOKIE,
  OWNER_MAX_AGE,
  isOwnerEmail,
  mintSession,
  ownerAuthReady,
  sendMagicLink,
} from "@/lib/owner";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/** Step one: request a link. Only listed owners ever get one. */
export async function POST(request: Request) {
  if (!ownerAuthReady()) {
    return NextResponse.json(
      {
        message:
          "Owner access is not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY and OWNER_EMAILS.",
      },
      { status: 503 },
    );
  }

  let email = "";
  try {
    ({ email } = (await request.json()) as { email: string });
  } catch {
    return NextResponse.json({ message: "Malformed request" }, { status: 400 });
  }

  // The same answer either way, so this endpoint cannot be used to discover
  // which addresses are owners.
  const generic = NextResponse.json({
    message: "If that address can open the console, a link is on its way.",
  });

  if (!isOwnerEmail(email)) return generic;

  try {
    await sendMagicLink(email.trim().toLowerCase(), `${env.siteUrl()}/owner/enter`);
  } catch (e) {
    console.error("[owner] magic link failed:", e instanceof Error ? e.message : e);
  }
  return generic;
}

/** Step two: the link lands here with a verified Supabase access token. */
export async function PUT(request: Request) {
  if (!ownerAuthReady()) {
    return NextResponse.json({ message: "Owner access is not configured" }, { status: 503 });
  }

  let accessToken = "";
  try {
    ({ accessToken } = (await request.json()) as { accessToken: string });
  } catch {
    return NextResponse.json({ message: "Malformed request" }, { status: 400 });
  }
  if (!accessToken) return NextResponse.json({ message: "No token" }, { status: 400 });

  const url = env.supabaseUrl();
  const anon = env.supabaseAnonKey();

  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon!, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ message: "That link is no longer valid." }, { status: 401 });
  }

  const user = (await res.json()) as { email?: string };
  if (!user.email || !isOwnerEmail(user.email)) {
    return NextResponse.json({ message: "That address cannot open the console." }, { status: 403 });
  }

  const response = NextResponse.json({ email: user.email });
  response.cookies.set(OWNER_COOKIE, mintSession(user.email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OWNER_MAX_AGE,
  });
  return response;
}

/** Sign out. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OWNER_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
