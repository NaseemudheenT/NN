/**
 * Kept so the original console path keeps working.
 *
 * The command centre now lives at /api/owner-ai with the full tool loop. This
 * re-exports the handler rather than duplicating the logic, so there is one
 * implementation and two routes to it.
 *
 * Next.js reads route segment config (runtime, dynamic) statically from this
 * file, so those two values are declared here directly and must match the
 * values in ../../owner-ai/route.ts. Re-exporting them is silently ignored.
 */
export { POST } from "../../owner-ai/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
