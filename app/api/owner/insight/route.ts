/**
 * Kept so the original console path keeps working.
 *
 * The command centre now lives at /api/owner-ai with the full tool loop. This
 * re-exports it rather than duplicating the logic, so there is one
 * implementation and two routes to it.
 */
export { POST, runtime, dynamic } from "../../owner-ai/route";
