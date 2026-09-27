/**
 * The NN Command Centre.
 *
 * The founder's private analyst. Authorised on every request: a verified
 * Supabase token whose email is on the OWNER_EMAILS list. Not "is there a
 * session" — is this person the owner.
 *
 * It reads the business through tools rather than being handed a summary, so it
 * can follow a question wherever it leads. What it cannot do is write: anything
 * that would change the store comes back as a proposal for a person to confirm.
 */

import { anthropicReady } from "@/lib/env";
import { ownerFromToken } from "@/lib/supabase";
import { loadCatalogue } from "@/lib/catalog";
import { rateLimit } from "@/lib/ratelimit";
import { LIMITS, MODELS } from "@/ai/models";
import { buildOwnerPrompt } from "@/ai/prompts/owner";
import { OWNER_TOOLS } from "@/ai/tools/owner";
import { runConversation } from "@/ai/runner";
import { logConversation } from "@/lib/ai-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearer(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
}

export async function POST(req: Request) {
  const ownerEmail = await ownerFromToken(bearer(req));
  if (!ownerEmail) {
    return Response.json(
      { error: "forbidden", message: "This console is for the owner." },
      { status: 403 },
    );
  }

  if (!anthropicReady()) {
    return Response.json(
      { error: "not_configured", message: "The command centre needs ANTHROPIC_API_KEY." },
      { status: 503 },
    );
  }

  // Generous, but not unlimited: deep analysis on Opus is not cheap.
  const limit = rateLimit(`owner:${ownerEmail}`, 60, 3_600_000);
  if (!limit.allowed) {
    return Response.json(
      { error: "rate_limited", message: "Give it a moment and ask again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: { question?: unknown; history?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const question =
    typeof body.question === "string" && body.question.trim()
      ? body.question.trim().slice(0, LIMITS.owner.maxQuestionChars)
      : "Give me today's summary.";

  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (m): m is { role: "user" | "assistant"; text: string } =>
            typeof m === "object" &&
            m !== null &&
            ((m as { role: string }).role === "user" || (m as { role: string }).role === "assistant") &&
            typeof (m as { text: unknown }).text === "string",
        )
        .slice(-LIMITS.owner.historyTurns)
        .map((m) => ({ role: m.role, content: m.text }))
    : [];

  const { source } = await loadCatalogue();
  const system = await buildOwnerPrompt({
    today: new Date().toISOString().slice(0, 10),
    ownerEmail,
    catalogueSource:
      source === "shopify" ? "live Shopify data" : "the Collection 001 reference seed, not live Shopify data",
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* the client went away */
        }
      };

      try {
        const result = await runConversation({
          model: MODELS.owner,
          system,
          messages: [...history, { role: "user", content: question }],
          tools: OWNER_TOOLS as unknown as readonly never[],
          maxToolCalls: LIMITS.owner.maxToolCalls,
          maxTokens: LIMITS.owner.maxTokens,
          ctx: { ownerEmail },
          onText: (visible) => send("delta", { visible }),
          onTool: (name, input) => {
            console.log(`[owner-ai] tool: ${name}`, JSON.stringify(input).slice(0, 200));
            send("tool", { name });
          },
        });

        send("done", {
          reply: result.text.trim(),
          toolsUsed: result.toolsUsed.map((t) => t.name),
          // Anything that would change the store waits for a confirmation.
          proposals: result.confirmations.filter((c) => c.tool === "propose_store_change"),
        });

        void logConversation({
          surface: "owner",
          question,
          reply: result.text.trim(),
          tools: result.toolsUsed.map((t) => t.name),
        });
      } catch (err) {
        console.error("[owner-ai] request failed:", err);
        send("error", { message: "The command centre could not answer just then." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
