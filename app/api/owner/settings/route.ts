/**
 * Showroom settings: which product is featured, what sits where, and whether a
 * time of day is being forced for everyone.
 *
 * Authorised the same way as the command centre — a verified token belonging to
 * an email on the OWNER_EMAILS list, checked on every request.
 */

import { ownerFromToken, readShowroomSettings, writeShowroomSettings } from "@/lib/supabase";
import { loadCatalogue } from "@/lib/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLACEMENTS = new Set(["rail-a", "rail-b", "table", "mannequin-1", "mannequin-2"]);
const PHASES = new Set(["morning", "afternoon", "evening", "night"]);

function bearer(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
}

export async function GET(req: Request) {
  if (!(await ownerFromToken(bearer(req)))) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const result = await readShowroomSettings();
  return Response.json(result);
}

export async function PUT(req: Request) {
  if (!(await ownerFromToken(bearer(req)))) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  let body: { featuredHandle?: unknown; forcedPhase?: unknown; placements?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const { products } = await loadCatalogue();
  const handles = new Set(products.map((p) => p.handle));

  const next: Parameters<typeof writeShowroomSettings>[0] = {};

  if ("featuredHandle" in body) {
    const value = body.featuredHandle;
    if (value === null) next.featuredHandle = null;
    else if (typeof value === "string" && handles.has(value)) next.featuredHandle = value;
    else return Response.json({ error: "unknown_handle" }, { status: 400 });
  }

  if ("forcedPhase" in body) {
    const value = body.forcedPhase;
    if (value === null) next.forcedPhase = null;
    else if (typeof value === "string" && PHASES.has(value)) {
      next.forcedPhase = value as NonNullable<typeof next.forcedPhase>;
    } else return Response.json({ error: "unknown_phase" }, { status: 400 });
  }

  if ("placements" in body) {
    if (typeof body.placements !== "object" || body.placements === null) {
      return Response.json({ error: "bad_placements" }, { status: 400 });
    }
    const cleaned: Record<string, string> = {};
    for (const [handle, placement] of Object.entries(body.placements as Record<string, unknown>)) {
      if (handles.has(handle) && typeof placement === "string" && PLACEMENTS.has(placement)) {
        cleaned[handle] = placement;
      }
    }
    next.placements = cleaned;
  }

  const result = await writeShowroomSettings(next);
  if (!result.ok) {
    return Response.json({ error: "write_failed", message: result.message }, { status: 502 });
  }
  return Response.json({ ok: true, ...(await readShowroomSettings()) });
}
